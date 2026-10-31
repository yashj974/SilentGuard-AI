import base64
import hashlib
import json
import logging
import os
import secrets
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable, Optional

logger = logging.getLogger("silentguard.oauth")


# ============================================================================
# Security & Redirect Helpers (PKCE S256 + Open Redirect Prevention)
# ============================================================================


def generate_pkce_pair() -> tuple[str, str]:
    """Generate a high-entropy PKCE code_verifier and S256 code_challenge."""
    code_verifier = secrets.token_urlsafe(48)
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return code_verifier, code_challenge


def validate_relative_redirect(path: Optional[str], default: str = "/workspace") -> str:
    """
    Validate that a redirect target is a strictly relative application path.
    Prevents open redirects to external domains or protocol-relative URLs.
    """
    if not path:
        return default
    cleaned = path.strip()
    if not cleaned.startswith("/") or cleaned.startswith("//") or "\\" in cleaned:
        return default
    parsed = urllib.parse.urlsplit(cleaned)
    if parsed.scheme or parsed.netloc:
        return default
    return cleaned


def validate_gitlab_instance_url(raw_url: Optional[str] = None) -> str:
    """
    Return a validated HTTPS GitLab base URL (defaults to https://gitlab.com).
    Blocks non-HTTPS schemes and local/private metadata addresses.
    """
    candidate = (
        raw_url
        or os.environ.get("GITLAB_INSTANCE_URL")
        or "https://gitlab.com"
    ).strip().rstrip("/")
    parsed = urllib.parse.urlsplit(candidate)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError("GitLab instance URL must use https:// with a valid hostname.")
    host = (parsed.hostname or "").lower()
    if host in {"localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254", "::1"}:
        raise ValueError("GitLab instance URL cannot point to loopback or internal metadata hosts.")
    return f"https://{parsed.netloc}"


def get_backend_base_url() -> str:
    _load_backend_dotenv()
    return os.environ.get("SILENTGUARD_BACKEND_URL", "http://localhost:8000").strip().rstrip("/")


def get_frontend_base_url() -> str:
    _load_backend_dotenv()
    return os.environ.get("SILENTGUARD_FRONTEND_URL", "http://localhost:5173").strip().rstrip("/")


# ============================================================================
# Pluggable HTTP Request Transport (allows clean unit/integration testing)
# ============================================================================


class ProviderHTTPError(Exception):
    def __init__(self, status_code: int, body: dict[str, Any] | str, headers: dict[str, str]):
        super().__init__(f"HTTP {status_code}")
        self.status_code = status_code
        self.body = body
        self.headers = headers


def _default_http_request(
    method: str,
    url: str,
    headers: Optional[dict[str, str]] = None,
    data: Optional[bytes] = None,
    timeout: int = 10,
) -> tuple[int, dict[str, Any] | str, dict[str, str]]:
    req_headers = {"User-Agent": "SilentGuard-AI/0.2.0"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw_bytes = resp.read()
            text = raw_bytes.decode("utf-8", errors="replace")
            resp_headers = {k.lower(): v for k, v in resp.headers.items()}
            try:
                parsed_body: dict[str, Any] | str = json.loads(text) if text else {}
            except json.JSONDecodeError:
                parsed_body = text
            return resp.status, parsed_body, resp_headers
    except urllib.error.HTTPError as exc:
        raw_bytes = exc.read() if exc.fp else b""
        text = raw_bytes.decode("utf-8", errors="replace")
        resp_headers = {k.lower(): v for k, v in exc.headers.items()} if exc.headers else {}
        try:
            parsed_body = json.loads(text) if text else {}
        except json.JSONDecodeError:
            parsed_body = text
        raise ProviderHTTPError(exc.code, parsed_body, resp_headers) from exc
    except urllib.error.URLError as exc:
        raise ProviderHTTPError(503, {"error": "network_unreachable", "detail": str(exc.reason)}, {}) from exc


HttpTransport = Callable[
    [str, str, Optional[dict[str, str]], Optional[bytes], int],
    tuple[int, dict[str, Any] | str, dict[str, str]],
]

_active_http_transport: HttpTransport = _default_http_request


def set_http_transport(transport: Optional[HttpTransport]) -> None:
    """Override HTTP transport in automated tests; pass None to restore default."""
    global _active_http_transport
    _active_http_transport = transport or _default_http_request


def is_mock_http_active() -> bool:
    return _active_http_transport != _default_http_request


def http_request(
    method: str,
    url: str,
    headers: Optional[dict[str, str]] = None,
    data: Optional[bytes] = None,
    timeout: int = 10,
) -> tuple[int, dict[str, Any] | str, dict[str, str]]:
    try:
        res = _active_http_transport(method, url, headers, data, timeout)
    except TypeError:
        res = _active_http_transport(method, url, headers, data)  # type: ignore[call-arg]
    status_code, body, resp_headers = res
    if status_code >= 400:
        raise ProviderHTTPError(status_code, body, resp_headers)
    return status_code, body, resp_headers


# ============================================================================
# Provider Configuration Inspection & Secure .env Loading
# ============================================================================

_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_ROOT_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))
_ENV_FILE_PATH = os.path.join(_BACKEND_DIR, ".env")
_ROOT_ENV_FILE_PATH = os.path.join(_ROOT_DIR, ".env")


def _load_backend_dotenv() -> None:
    """
    Load key=value pairs from backend/.env (or workspace .env fallback) using UTF-8-SIG (BOM-safe).
    """
    target_files = [p for p in (_ENV_FILE_PATH, _ROOT_ENV_FILE_PATH) if os.path.exists(p)]
    if not target_files:
        return

    for env_path in target_files:
        try:
            from dotenv import load_dotenv  # type: ignore[import-not-found]

            load_dotenv(dotenv_path=env_path, encoding="utf-8-sig", override=True)
        except Exception:
            pass

        try:
            with open(env_path, "r", encoding="utf-8-sig") as f:
                for raw_line in f:
                    line = raw_line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    key = k.lstrip("\ufeff").strip()
                    val = v.strip().strip('"').strip("'")
                    if key and val:
                        os.environ[key] = val
        except OSError:
            pass


_load_backend_dotenv()


def get_provider_oauth_config(provider: str) -> dict[str, Any]:
    _load_backend_dotenv()
    p = provider.strip().lower()
    backend_base = get_backend_base_url()

    cfg: dict[str, Any]
    if p == "google":
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
        redirect_uri = os.environ.get(
            "GOOGLE_REDIRECT_URI", f"{backend_base}/api/auth/google/callback"
        ).strip()
        cfg = {
            "provider": "google",
            "configured": bool(client_id and client_secret),
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "scopes": "openid email profile",
            "required_env": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"],
        }
    elif p == "github":
        client_id = os.environ.get("GITHUB_CLIENT_ID", "").strip()
        client_secret = os.environ.get("GITHUB_CLIENT_SECRET", "").strip()
        redirect_uri = os.environ.get(
            "GITHUB_REDIRECT_URI", f"{backend_base}/api/integrations/github/callback"
        ).strip()
        cfg = {
            "provider": "github",
            "configured": bool(client_id and client_secret),
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "authorize_url": "https://github.com/login/oauth/authorize",
            "token_url": "https://github.com/login/oauth/access_token",
            "scopes": "read:user user:email repo",
            "required_env": ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_REDIRECT_URI"],
        }
    elif p == "gitlab":
        client_id = os.environ.get("GITLAB_CLIENT_ID", "").strip()
        client_secret = os.environ.get("GITLAB_CLIENT_SECRET", "").strip()
        instance_url = validate_gitlab_instance_url()
        redirect_uri = os.environ.get(
            "GITLAB_REDIRECT_URI", f"{backend_base}/api/integrations/gitlab/callback"
        ).strip()
        cfg = {
            "provider": "gitlab",
            "configured": bool(client_id and client_secret),
            "client_id": client_id,
            "client_secret": client_secret,
            "instance_url": instance_url,
            "redirect_uri": redirect_uri,
            "authorize_url": f"{instance_url}/oauth/authorize",
            "token_url": f"{instance_url}/oauth/token",
            "scopes": "read_user read_api read_repository",
            "required_env": [
                "GITLAB_CLIENT_ID",
                "GITLAB_CLIENT_SECRET",
                "GITLAB_REDIRECT_URI",
                "GITLAB_INSTANCE_URL",
            ],
        }
    elif p == "bitbucket":
        client_id = os.environ.get("BITBUCKET_CLIENT_ID", "").strip()
        client_secret = os.environ.get("BITBUCKET_CLIENT_SECRET", "").strip()
        redirect_uri = os.environ.get(
            "BITBUCKET_REDIRECT_URI", f"{backend_base}/api/integrations/bitbucket/callback"
        ).strip()
        cfg = {
            "provider": "bitbucket",
            "configured": bool(client_id and client_secret),
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "authorize_url": "https://bitbucket.org/site/oauth2/authorize",
            "token_url": "https://bitbucket.org/site/oauth2/access_token",
            "scopes": "account repository",
            "required_env": [
                "BITBUCKET_CLIENT_ID",
                "BITBUCKET_CLIENT_SECRET",
                "BITBUCKET_REDIRECT_URI",
            ],
        }
    else:
        raise ValueError(f"Unsupported provider: {provider}")

    logger.info(
        "Safe OAuth diagnostic check: provider=%s, client_id_configured=%s, client_secret_configured=%s, redirect_uri=%s",
        p,
        bool(cfg.get("client_id")),
        bool(cfg.get("client_secret")),
        cfg.get("redirect_uri"),
    )
    return cfg


# ============================================================================
# 1. Google OAuth 2.0 Authorization, Token Exchange & Identity Verification
# ============================================================================


def build_google_authorize_url(state: str, code_challenge: str) -> str:
    cfg = get_provider_oauth_config("google")
    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": cfg["redirect_uri"],
        "response_type": "code",
        "scope": cfg["scopes"],
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return f"{cfg['authorize_url']}?{urllib.parse.urlencode(params)}"


def exchange_and_verify_google_code(code: str, code_verifier: str) -> dict[str, Any]:
    cfg = get_provider_oauth_config("google")
    form = urllib.parse.urlencode(
        {
            "client_id": cfg["client_id"],
            "client_secret": cfg["client_secret"],
            "code": code,
            "code_verifier": code_verifier,
            "grant_type": "authorization_code",
            "redirect_uri": cfg["redirect_uri"],
        }
    ).encode("utf-8")

    _, token_body, _ = http_request(
        "POST",
        cfg["token_url"],
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        data=form,
    )
    if not isinstance(token_body, dict) or not token_body.get("access_token"):
        raise ProviderHTTPError(401, {"detail": "Google token exchange did not return a valid access_token."}, {})

    access_token = str(token_body["access_token"])
    _, user_info, _ = http_request(
        "GET",
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
    )
    if not isinstance(user_info, dict) or not user_info.get("email"):
        raise ProviderHTTPError(401, {"detail": "Google UserInfo endpoint did not return a verified email."}, {})

    if user_info.get("email_verified") is False:
        raise ProviderHTTPError(403, {"detail": "Google account email address is not verified."}, {})

    return {
        "email": str(user_info["email"]).strip().lower(),
        "full_name": str(user_info.get("name") or user_info["email"].split("@")[0]).strip(),
        "provider_account_id": str(user_info.get("sub") or ""),
    }


# ============================================================================
# 2. GitHub OAuth 2.0 & Repository Access Verification
# ============================================================================


def build_github_authorize_url(state: str, code_challenge: str) -> str:
    cfg = get_provider_oauth_config("github")
    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": cfg["redirect_uri"],
        "scope": cfg["scopes"],
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    return f"{cfg['authorize_url']}?{urllib.parse.urlencode(params)}"


def exchange_github_code(code: str, code_verifier: str, state: str) -> dict[str, Any]:
    cfg = get_provider_oauth_config("github")
    form = urllib.parse.urlencode(
        {
            "client_id": cfg["client_id"],
            "client_secret": cfg["client_secret"],
            "code": code,
            "redirect_uri": cfg["redirect_uri"],
            "state": state,
            "code_verifier": code_verifier,
        }
    ).encode("utf-8")

    _, token_body, _ = http_request(
        "POST",
        cfg["token_url"],
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        data=form,
    )
    if not isinstance(token_body, dict) or token_body.get("error") or not token_body.get("access_token"):
        err_desc = (
            token_body.get("error_description")
            if isinstance(token_body, dict)
            else "GitHub authorization code exchange failed."
        )
        raise ProviderHTTPError(401, {"detail": err_desc or "GitHub token exchange failed."}, {})

    return token_body


def verify_github_access(access_token: str, declared_scopes: Optional[str] = None) -> dict[str, Any]:
    """
    Verify GitHub user identity, required repository scopes, and live repository listing.
    Returns structured verification result with status:
      - 'connected'
      - 'permission_insufficient'
      - 'token_expired_or_revoked'
      - 'authorization_failed'
    """
    gh_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    try:
        _, user_body, user_headers = http_request("GET", "https://api.github.com/user", headers=gh_headers)
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {
                "status": "token_expired_or_revoked",
                "error": "GitHub access token is invalid, expired, or has been revoked.",
            }
        if exc.status_code == 403:
            return {
                "status": "permission_insufficient",
                "error": "GitHub API access forbidden (insufficient token permissions or rate limit).",
            }
        return {
            "status": "authorization_failed",
            "error": "Failed to verify GitHub identity with api.github.com.",
        }

    if not isinstance(user_body, dict) or not user_body.get("login"):
        return {
            "status": "authorization_failed",
            "error": "Unexpected response from GitHub user API.",
        }

    header_scopes = user_headers.get("x-oauth-scopes", "")
    raw_scopes = header_scopes if header_scopes else (declared_scopes or "")
    scope_set = {s.strip() for s in raw_scopes.replace(",", " ").split() if s.strip()}

    # If OAuth scopes are reported, require 'repo' or 'public_repo'
    if scope_set and not ({"repo", "public_repo"} & scope_set):
        return {
            "status": "permission_insufficient",
            "provider_account_id": str(user_body.get("id", "")),
            "provider_username": str(user_body.get("login", "")),
            "provider_email": user_body.get("email"),
            "scopes": ", ".join(sorted(scope_set)),
            "error": "GitHub token is missing required repository read scope ('repo' or 'public_repo').",
        }

    try:
        _, repos_body, _ = http_request(
            "GET",
            "https://api.github.com/user/repos?per_page=15&sort=updated",
            headers=gh_headers,
        )
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {
                "status": "token_expired_or_revoked",
                "error": "GitHub access token was revoked or expired while listing repositories.",
            }
        if exc.status_code in (403, 404):
            return {
                "status": "permission_insufficient",
                "provider_account_id": str(user_body.get("id", "")),
                "provider_username": str(user_body.get("login", "")),
                "provider_email": user_body.get("email"),
                "scopes": ", ".join(sorted(scope_set)),
                "error": "GitHub token does not have permission to list or read repositories.",
            }
        return {
            "status": "authorization_failed",
            "error": "Unable to query GitHub repositories API.",
        }

    if not isinstance(repos_body, list):
        return {
            "status": "authorization_failed",
            "error": "Invalid repository payload returned by GitHub API.",
        }

    repos = [
        {
            "id": str(r.get("id", "")),
            "name": str(r.get("name", "")),
            "full_name": str(r.get("full_name", "")),
            "private": bool(r.get("private", False)),
            "default_branch": str(r.get("default_branch") or "main"),
            "html_url": str(r.get("html_url") or ""),
            "language": r.get("language") or "Unknown",
        }
        for r in repos_body
        if isinstance(r, dict) and r.get("full_name")
    ]

    return {
        "status": "connected",
        "provider_account_id": str(user_body.get("id", "")),
        "provider_username": str(user_body.get("login", "")),
        "provider_email": user_body.get("email"),
        "scopes": ", ".join(sorted(scope_set)) if scope_set else "repo, read:user",
        "repositories": repos,
        "accessible_repos_count": len(repos),
        "error": None,
    }


def verify_github_single_repo(access_token: str, repo_full_name: str) -> dict[str, Any]:
    gh_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    encoded_full_name = "/".join(urllib.parse.quote(part, safe="") for part in repo_full_name.split("/", 1))
    try:
        _, repo_body, _ = http_request(
            "GET",
            f"https://api.github.com/repos/{encoded_full_name}",
            headers=gh_headers,
        )
        if not isinstance(repo_body, dict) or not repo_body.get("full_name"):
            return {"ok": False, "status": "authorization_failed", "error": "Invalid GitHub repository response."}
        return {
            "ok": True,
            "repo": {
                "full_name": repo_body["full_name"],
                "default_branch": repo_body.get("default_branch") or "main",
                "private": bool(repo_body.get("private", False)),
                "language": repo_body.get("language") or "Python",
            },
        }
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {"ok": False, "status": "token_expired_or_revoked", "error": "GitHub token is expired or revoked."}
        return {
            "ok": False,
            "status": "permission_insufficient",
            "error": f"GitHub denied read access to repository '{repo_full_name}' (HTTP {exc.status_code}).",
        }


def fetch_github_repo_branches(
    access_token: str, repo_full_name: str, default_branch: str = "main"
) -> dict[str, Any]:
    gh_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    encoded_full_name = "/".join(
        urllib.parse.quote(part, safe="") for part in repo_full_name.split("/", 1)
    )
    try:
        _, branches_body, _ = http_request(
            "GET",
            f"https://api.github.com/repos/{encoded_full_name}/branches?per_page=30",
            headers=gh_headers,
        )
        if not isinstance(branches_body, list):
            return {"ok": True, "branches": [default_branch]}
        names = [
            str(b.get("name"))
            for b in branches_body
            if isinstance(b, dict) and b.get("name")
        ]
        if not names:
            names = [default_branch]
        return {"ok": True, "branches": names}
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {
                "ok": False,
                "status": "token_expired_or_revoked",
                "error": "GitHub token is expired or revoked.",
            }
        if exc.status_code == 403:
            return {
                "ok": False,
                "status": "permission_insufficient",
                "error": f"GitHub denied branch read access to '{repo_full_name}'.",
            }
        return {"ok": True, "branches": [default_branch]}


# ============================================================================
# 3. GitLab OAuth 2.0 & Project/Repository Access Verification
# ============================================================================


def build_gitlab_authorize_url(
    state: str, code_challenge: str, instance_url: Optional[str] = None
) -> str:
    cfg = get_provider_oauth_config("gitlab")
    base_url = validate_gitlab_instance_url(instance_url or cfg["instance_url"])
    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": cfg["redirect_uri"],
        "response_type": "code",
        "scope": cfg["scopes"],
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    return f"{base_url}/oauth/authorize?{urllib.parse.urlencode(params)}"


def exchange_gitlab_code(
    code: str, code_verifier: str, instance_url: Optional[str] = None
) -> dict[str, Any]:
    cfg = get_provider_oauth_config("gitlab")
    base_url = validate_gitlab_instance_url(instance_url or cfg["instance_url"])
    form = urllib.parse.urlencode(
        {
            "client_id": cfg["client_id"],
            "client_secret": cfg["client_secret"],
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": cfg["redirect_uri"],
            "code_verifier": code_verifier,
        }
    ).encode("utf-8")

    _, token_body, _ = http_request(
        "POST",
        f"{base_url}/oauth/token",
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        data=form,
    )
    if not isinstance(token_body, dict) or token_body.get("error") or not token_body.get("access_token"):
        err_desc = (
            token_body.get("error_description")
            if isinstance(token_body, dict)
            else "GitLab authorization code exchange failed."
        )
        raise ProviderHTTPError(401, {"detail": err_desc or "GitLab token exchange failed."}, {})

    return token_body


def verify_gitlab_access(
    access_token: str,
    instance_url: Optional[str] = None,
    declared_scopes: Optional[str] = None,
) -> dict[str, Any]:
    base_url = validate_gitlab_instance_url(instance_url)
    gl_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    try:
        _, user_body, _ = http_request("GET", f"{base_url}/api/v4/user", headers=gl_headers)
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {
                "status": "token_expired_or_revoked",
                "instance_url": base_url,
                "error": "GitLab access token is invalid, expired, or has been revoked.",
            }
        if exc.status_code == 403:
            return {
                "status": "permission_insufficient",
                "instance_url": base_url,
                "error": "GitLab token lacks 'read_user' / 'read_api' permission.",
            }
        return {
            "status": "authorization_failed",
            "instance_url": base_url,
            "error": f"Failed to verify GitLab user identity on {base_url}.",
        }

    if not isinstance(user_body, dict) or not user_body.get("username"):
        return {
            "status": "authorization_failed",
            "instance_url": base_url,
            "error": "Unexpected response from GitLab /api/v4/user endpoint.",
        }

    scope_set = {s.strip() for s in (declared_scopes or "").replace(",", " ").split() if s.strip()}
    if scope_set and not ({"read_api", "api", "read_repository"} & scope_set):
        return {
            "status": "permission_insufficient",
            "instance_url": base_url,
            "provider_account_id": str(user_body.get("id", "")),
            "provider_username": str(user_body.get("username", "")),
            "provider_email": user_body.get("email"),
            "scopes": ", ".join(sorted(scope_set)),
            "error": "GitLab token is missing required repository scopes ('read_api' or 'read_repository').",
        }

    try:
        _, projects_body, _ = http_request(
            "GET",
            f"{base_url}/api/v4/projects?membership=true&simple=true&per_page=15",
            headers=gl_headers,
        )
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {
                "status": "token_expired_or_revoked",
                "instance_url": base_url,
                "error": "GitLab access token expired or was revoked while listing projects.",
            }
        if exc.status_code == 403:
            return {
                "status": "permission_insufficient",
                "instance_url": base_url,
                "provider_account_id": str(user_body.get("id", "")),
                "provider_username": str(user_body.get("username", "")),
                "provider_email": user_body.get("email"),
                "scopes": ", ".join(sorted(scope_set)),
                "error": "GitLab token does not have permission to read projects (/api/v4/projects returned 403).",
            }
        return {
            "status": "authorization_failed",
            "instance_url": base_url,
            "error": "Unable to query GitLab projects API.",
        }

    if not isinstance(projects_body, list):
        return {
            "status": "authorization_failed",
            "instance_url": base_url,
            "error": "Invalid project list returned by GitLab API.",
        }

    repos = [
        {
            "id": str(p.get("id", "")),
            "name": str(p.get("name", "")),
            "full_name": str(p.get("path_with_namespace", "")),
            "private": p.get("visibility") != "public",
            "default_branch": str(p.get("default_branch") or "main"),
            "html_url": str(p.get("web_url") or ""),
            "language": "GitLab Project",
        }
        for p in projects_body
        if isinstance(p, dict) and p.get("path_with_namespace")
    ]

    return {
        "status": "connected",
        "instance_url": base_url,
        "provider_account_id": str(user_body.get("id", "")),
        "provider_username": str(user_body.get("username", "")),
        "provider_email": user_body.get("email"),
        "scopes": ", ".join(sorted(scope_set)) if scope_set else "read_user, read_api, read_repository",
        "repositories": repos,
        "accessible_repos_count": len(repos),
        "error": None,
    }


def verify_gitlab_single_repo(
    access_token: str, repo_full_name: str, instance_url: Optional[str] = None
) -> dict[str, Any]:
    base_url = validate_gitlab_instance_url(instance_url)
    gl_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    encoded_path = urllib.parse.quote(repo_full_name, safe="")
    try:
        _, proj_body, _ = http_request(
            "GET",
            f"{base_url}/api/v4/projects/{encoded_path}",
            headers=gl_headers,
        )
        if not isinstance(proj_body, dict) or not proj_body.get("path_with_namespace"):
            return {"ok": False, "status": "authorization_failed", "error": "Invalid GitLab project response."}
        return {
            "ok": True,
            "repo": {
                "full_name": proj_body["path_with_namespace"],
                "default_branch": proj_body.get("default_branch") or "main",
                "private": proj_body.get("visibility") != "public",
                "language": "GitLab Project",
            },
        }
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {"ok": False, "status": "token_expired_or_revoked", "error": "GitLab token is expired or revoked."}
        return {
            "ok": False,
            "status": "permission_insufficient",
            "error": f"GitLab denied read access to project '{repo_full_name}' (HTTP {exc.status_code}).",
        }


def fetch_gitlab_repo_branches(
    access_token: str,
    repo_full_name: str,
    instance_url: Optional[str] = None,
    default_branch: str = "main",
) -> dict[str, Any]:
    base_url = validate_gitlab_instance_url(instance_url)
    gl_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    encoded_path = urllib.parse.quote(repo_full_name, safe="")
    try:
        _, branches_body, _ = http_request(
            "GET",
            f"{base_url}/api/v4/projects/{encoded_path}/repository/branches?per_page=30",
            headers=gl_headers,
        )
        if not isinstance(branches_body, list):
            return {"ok": True, "branches": [default_branch]}
        names = [
            str(b.get("name"))
            for b in branches_body
            if isinstance(b, dict) and b.get("name")
        ]
        if not names:
            names = [default_branch]
        return {"ok": True, "branches": names}
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {
                "ok": False,
                "status": "token_expired_or_revoked",
                "error": "GitLab token is expired or revoked.",
            }
        if exc.status_code == 403:
            return {
                "ok": False,
                "status": "permission_insufficient",
                "error": f"GitLab denied branch read access to '{repo_full_name}'.",
            }
        return {"ok": True, "branches": [default_branch]}


# ============================================================================
# 4. Bitbucket Cloud OAuth 2.0 & Repository/Workspace Verification
# ============================================================================


def build_bitbucket_authorize_url(state: str) -> str:
    cfg = get_provider_oauth_config("bitbucket")
    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": cfg["redirect_uri"],
        "response_type": "code",
        "state": state,
    }
    return f"{cfg['authorize_url']}?{urllib.parse.urlencode(params)}"


def exchange_bitbucket_code(code: str) -> dict[str, Any]:
    cfg = get_provider_oauth_config("bitbucket")
    basic_creds = f"{cfg['client_id']}:{cfg['client_secret']}".encode("utf-8")
    basic_header = base64.b64encode(basic_creds).decode("ascii")

    form = urllib.parse.urlencode(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": cfg["redirect_uri"],
        }
    ).encode("utf-8")

    _, token_body, _ = http_request(
        "POST",
        cfg["token_url"],
        headers={
            "Authorization": f"Basic {basic_header}",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        },
        data=form,
    )
    if not isinstance(token_body, dict) or token_body.get("error") or not token_body.get("access_token"):
        err_desc = (
            token_body.get("error_description")
            if isinstance(token_body, dict)
            else "Bitbucket authorization code exchange failed."
        )
        raise ProviderHTTPError(401, {"detail": err_desc or "Bitbucket token exchange failed."}, {})

    return token_body


def verify_bitbucket_access(
    access_token: str, declared_scopes: Optional[str] = None
) -> dict[str, Any]:
    bb_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    try:
        _, user_body, _ = http_request("GET", "https://api.bitbucket.org/2.0/user", headers=bb_headers)
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {
                "status": "token_expired_or_revoked",
                "error": "Bitbucket access token is invalid, expired, or has been revoked.",
            }
        if exc.status_code == 403:
            return {
                "status": "permission_insufficient",
                "error": "Bitbucket token lacks 'account' read permission.",
            }
        return {
            "status": "authorization_failed",
            "error": "Failed to verify Bitbucket identity with api.bitbucket.org.",
        }

    if not isinstance(user_body, dict) or not (user_body.get("username") or user_body.get("uuid") or user_body.get("nickname")):
        return {
            "status": "authorization_failed",
            "error": "Unexpected response from Bitbucket /2.0/user endpoint.",
        }

    username = str(user_body.get("username") or user_body.get("nickname") or user_body.get("display_name") or "bitbucket-user")
    account_id = str(user_body.get("uuid") or user_body.get("account_id") or username)

    scope_set = {s.strip() for s in (declared_scopes or "").replace(",", " ").split() if s.strip()}
    if scope_set and "repository" not in scope_set:
        return {
            "status": "permission_insufficient",
            "provider_account_id": account_id,
            "provider_username": username,
            "provider_email": None,
            "scopes": ", ".join(sorted(scope_set)),
            "error": "Bitbucket token is missing required 'repository' read scope.",
        }

    try:
        _, repos_body, _ = http_request(
            "GET",
            "https://api.bitbucket.org/2.0/repositories?role=member&pagelen=15",
            headers=bb_headers,
        )
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {
                "status": "token_expired_or_revoked",
                "error": "Bitbucket access token expired or was revoked while listing repositories.",
            }
        if exc.status_code == 403:
            return {
                "status": "permission_insufficient",
                "provider_account_id": account_id,
                "provider_username": username,
                "provider_email": None,
                "scopes": ", ".join(sorted(scope_set)),
                "error": "Bitbucket token does not have permission to list workspace repositories (HTTP 403).",
            }
        return {
            "status": "authorization_failed",
            "error": "Unable to query Bitbucket /2.0/repositories API.",
        }

    values = repos_body.get("values") if isinstance(repos_body, dict) else None
    if not isinstance(values, list):
        return {
            "status": "authorization_failed",
            "error": "Invalid repository payload returned by Bitbucket API.",
        }

    repos = []
    for r in values:
        if not isinstance(r, dict) or not r.get("full_name"):
            continue
        mainbranch = r.get("mainbranch")
        default_branch = (
            mainbranch.get("name")
            if isinstance(mainbranch, dict) and mainbranch.get("name")
            else "main"
        )
        links = r.get("links")
        html_link = (
            links.get("html", {}).get("href", "")
            if isinstance(links, dict) and isinstance(links.get("html"), dict)
            else ""
        )
        repos.append(
            {
                "id": str(r.get("uuid") or r.get("full_name")),
                "name": str(r.get("name") or r.get("full_name")),
                "full_name": str(r.get("full_name")),
                "private": bool(r.get("is_private", True)),
                "default_branch": str(default_branch),
                "html_url": str(html_link),
                "language": str(r.get("language") or "Bitbucket Repo"),
            }
        )

    return {
        "status": "connected",
        "provider_account_id": account_id,
        "provider_username": username,
        "provider_email": None,
        "scopes": ", ".join(sorted(scope_set)) if scope_set else "account, repository",
        "repositories": repos,
        "accessible_repos_count": len(repos),
        "error": None,
    }


def verify_bitbucket_single_repo(access_token: str, repo_full_name: str) -> dict[str, Any]:
    bb_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    encoded_full_name = "/".join(urllib.parse.quote(part, safe="") for part in repo_full_name.split("/", 1))
    try:
        _, repo_body, _ = http_request(
            "GET",
            f"https://api.bitbucket.org/2.0/repositories/{encoded_full_name}",
            headers=bb_headers,
        )
        if not isinstance(repo_body, dict) or not repo_body.get("full_name"):
            return {"ok": False, "status": "authorization_failed", "error": "Invalid Bitbucket repository response."}
        mainbranch = repo_body.get("mainbranch")
        default_branch = (
            mainbranch.get("name")
            if isinstance(mainbranch, dict) and mainbranch.get("name")
            else "main"
        )
        return {
            "ok": True,
            "repo": {
                "full_name": repo_body["full_name"],
                "default_branch": default_branch,
                "private": bool(repo_body.get("is_private", True)),
                "language": repo_body.get("language") or "Bitbucket Repo",
            },
        }
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {"ok": False, "status": "token_expired_or_revoked", "error": "Bitbucket token is expired or revoked."}
        return {
            "ok": False,
            "status": "permission_insufficient",
            "error": f"Bitbucket denied read access to repository '{repo_full_name}' (HTTP {exc.status_code}).",
        }


def fetch_bitbucket_repo_branches(
    access_token: str, repo_full_name: str, default_branch: str = "main"
) -> dict[str, Any]:
    bb_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    encoded_full_name = "/".join(
        urllib.parse.quote(part, safe="") for part in repo_full_name.split("/", 1)
    )
    try:
        _, branches_body, _ = http_request(
            "GET",
            f"https://api.bitbucket.org/2.0/repositories/{encoded_full_name}/refs/branches?pagelen=30",
            headers=bb_headers,
        )
        values = branches_body.get("values") if isinstance(branches_body, dict) else None
        if not isinstance(values, list):
            return {"ok": True, "branches": [default_branch]}
        names = [
            str(b.get("name"))
            for b in values
            if isinstance(b, dict) and b.get("name")
        ]
        if not names:
            names = [default_branch]
        return {"ok": True, "branches": names}
    except ProviderHTTPError as exc:
        if exc.status_code == 401:
            return {
                "ok": False,
                "status": "token_expired_or_revoked",
                "error": "Bitbucket token is expired or revoked.",
            }
        if exc.status_code == 403:
            return {
                "ok": False,
                "status": "permission_insufficient",
                "error": f"Bitbucket denied branch read access to '{repo_full_name}'.",
            }
        return {"ok": True, "branches": [default_branch]}
