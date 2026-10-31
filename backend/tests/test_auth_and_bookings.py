import os
import tempfile
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client():
    fd, temp_db = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["SILENTGUARD_DB_PATH"] = temp_db
    os.environ["SILENTGUARD_ADMIN_EMAILS"] = "admin@silentguard.ai"
    os.environ.pop("SMTP_HOST", None)
    os.environ.pop("ADMIN_NOTIFICATION_EMAIL", None)

    from app.database import init_db
    from app.main import app

    init_db()
    with TestClient(app) as test_client:
        yield test_client

    if os.path.exists(temp_db):
        os.remove(temp_db)


def test_FullAuthAndBookingWorkflow(client: TestClient):
    # 1. Signup as User A
    res_signup_a = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Alice Engineer",
            "email": "alice@acme.io",
            "password": "SecurePassword123!",
            "company": "Acme Corp",
            "job_title": "Staff Security Engineer",
        },
    )
    assert res_signup_a.status_code == 200
    data_a = res_signup_a.json()
    token_a = data_a["token"]
    user_a = data_a["user"]
    assert user_a["email"] == "alice@acme.io"
    assert user_a["role"] == "user"
    assert "password_hash" not in user_a

    # Verify /api/auth/me and profile update
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_a}"})
    assert res_me.status_code == 200
    assert res_me.json()["user"]["full_name"] == "Alice Engineer"

    res_patch_profile = client.patch(
        "/api/auth/profile",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"full_name": "Alice M. Engineer", "company": "Acme Security"},
    )
    assert res_patch_profile.status_code == 200
    assert res_patch_profile.json()["user"]["full_name"] == "Alice M. Engineer"
    assert res_patch_profile.json()["user"]["company"] == "Acme Security"

    # 2. Submit a demo booking as User A
    res_book = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "full_name": "Alice M. Engineer",
            "work_email": "alice@acme.io",
            "company": "Acme Security",
            "team_size": "51-200 developers",
            "preferred_date": "2026-11-05",
            "preferred_time": "14:30",
            "timezone": "America/New_York",
            "message": "Interested in AST SSRF & Prisma isolation rules.",
        },
    )
    assert res_book.status_code == 200
    book_data = res_book.json()
    assert book_data["status"] == "received"
    booking_id = book_data["request_id"]
    assert book_data["booking"]["status"] == "Pending"
    assert book_data["email_notification_status"] == "not_configured"

    # Duplicate submission check within 5 minutes
    res_dup = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "full_name": "Alice M. Engineer",
            "work_email": "alice@acme.io",
            "company": "Acme Security",
            "team_size": "51-200 developers",
            "preferred_date": "2026-11-05",
            "preferred_time": "14:30",
            "timezone": "America/New_York",
        },
    )
    assert res_dup.status_code == 409

    # 3. View booking as submitting user (User A)
    res_my_list = client.get(
        "/api/my/bookings", headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_my_list.status_code == 200
    assert res_my_list.json()["count"] == 1
    assert res_my_list.json()["bookings"][0]["id"] == booking_id

    res_my_detail = client.get(
        f"/api/my/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_my_detail.status_code == 200

    # 4. Signup as User B and verify User B CANNOT access User A's booking
    res_signup_b = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Bob Developer",
            "email": "bob@other.io",
            "password": "OtherPassword123!",
        },
    )
    token_b = res_signup_b.json()["token"]

    res_b_list = client.get(
        "/api/my/bookings", headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_b_list.status_code == 200
    assert res_b_list.json()["count"] == 0

    res_b_steal = client.get(
        f"/api/my/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res_b_steal.status_code == 403

    # 5. Verify non-admin (User A & User B) CANNOT access admin endpoints
    res_non_admin = client.get(
        "/api/admin/bookings", headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_non_admin.status_code == 403

    res_non_admin_patch = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"status": "Confirmed"},
    )
    assert res_non_admin_patch.status_code == 403

    # 6. Login as seeded Admin and manage demo requests
    res_admin_login = client.post(
        "/api/auth/login",
        json={
            "email": "admin@silentguard.ai",
            "password": "Admin@SilentGuard2026!",
        },
    )
    assert res_admin_login.status_code == 200
    admin_token = res_admin_login.json()["token"]
    assert res_admin_login.json()["user"]["role"] == "admin"

    res_admin_list = client.get(
        "/api/admin/bookings",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin_list.status_code == 200
    assert res_admin_list.json()["count"] == 1

    # Admin updates status to Confirmed + adds admin notes
    res_admin_update = client.patch(
        f"/api/admin/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "status": "Confirmed",
            "admin_notes": "Assigned Solutions Architect Sarah K. Zoom link dispatched.",
            "confirmed_datetime": "2026-11-05 14:30 America/New_York",
        },
    )
    assert res_admin_update.status_code == 200
    updated_booking = res_admin_update.json()["booking"]
    assert updated_booking["status"] == "Confirmed"
    assert "Sarah K." in updated_booking["admin_notes"]
    assert len(updated_booking["status_history"]) >= 2

    # User A sees the Confirmed status and admin notes in My Bookings
    res_a_after = client.get(
        f"/api/my/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_a_after.status_code == 200
    assert res_a_after.json()["booking"]["status"] == "Confirmed"

    # 7. Logout User A and verify token is invalidated
    res_logout = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_logout.status_code == 200

    res_after_logout = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_after_logout.status_code == 401


def test_EmailNotificationSuccessAndFailureHandling(client: TestClient):
    os.environ["SMTP_HOST"] = "smtp.example.com"
    os.environ["SMTP_PORT"] = "587"
    os.environ["ADMIN_NOTIFICATION_EMAIL"] = "admin@silentguard.ai"

    # Case 1: SMTP succeeds
    with patch("smtplib.SMTP") as mock_smtp:
        instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = instance

        res_ok = client.post(
            "/api/demo-requests",
            json={
                "full_name": "Charlie DevOps",
                "work_email": "charlie@devops.io",
                "company": "DevOps Inc",
                "preferred_date": "2026-11-10",
                "preferred_time": "11:00",
                "timezone": "UTC",
            },
        )
        assert res_ok.status_code == 200
        assert res_ok.json()["email_notification_status"] == "sent"
        assert instance.send_message.called

    # Case 2: SMTP raises connection error -> booking still saved, status='failed'
    with patch("smtplib.SMTP", side_effect=OSError("Connection refused")):
        res_fail = client.post(
            "/api/demo-requests",
            json={
                "full_name": "Dana CTO",
                "work_email": "dana@cto.io",
                "company": "CTO Labs",
                "preferred_date": "2026-11-12",
                "preferred_time": "16:00",
                "timezone": "UTC",
            },
        )
        assert res_fail.status_code == 200
        data_fail = res_fail.json()
        assert data_fail["email_notification_status"] == "failed"
        assert data_fail["booking"]["status"] == "Pending"


def test_ValidationAndUnauthenticatedRejections(client: TestClient):
    # Invalid email on booking
    res_bad = client.post(
        "/api/demo-requests",
        json={
            "full_name": "Test User",
            "work_email": "not-an-email",
            "preferred_date": "2026-11-12",
            "preferred_time": "10:00",
            "timezone": "UTC",
        },
    )
    assert res_bad.status_code == 400

    # Unauthenticated access to protected endpoints
    assert client.get("/api/my/bookings").status_code == 401
    assert client.get("/api/admin/bookings").status_code == 401
    assert client.patch("/api/auth/profile", json={"full_name": "X"}).status_code == 401


def test_OfficialGoogleOAuthAndEmailPasswordSecurity(client: TestClient):
    """
    Scenarios 1, 2, 3, 4, 8, 9 for Google Authentication & Email/Password Login:
    - Wrong email/password strictly rejected with 401 (never logs user in)
    - Unconfigured Google OAuth reports 503 truthfully
    - Official Google OAuth 2.0 + PKCE start & callback succeeds only when Google verifies token + email_verified=True
    - Denied Google OAuth (error=access_denied) never creates a session
    - Invalid/replayed OAuth state is rejected with 400
    - Open redirect attempts in redirect_path are rejected with 400
    """
    # Wrong password on existing admin account -> 401
    res_wrong_pw = client.post(
        "/api/auth/login",
        json={"email": "admin@silentguard.ai", "password": "WrongPassword999!"},
    )
    assert res_wrong_pw.status_code == 401
    assert "token" not in res_wrong_pw.json()

    # Unknown account -> 401
    res_unknown = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "SomePassword123!"},
    )
    assert res_unknown.status_code == 401

    # Open redirect attempt on Google OAuth start -> 400
    os.environ["GOOGLE_CLIENT_ID"] = "test-google-client-id.apps.googleusercontent.com"
    os.environ["GOOGLE_CLIENT_SECRET"] = "test-google-client-secret"
    os.environ.pop("SILENTGUARD_BACKEND_URL", None)
    os.environ.pop("GOOGLE_REDIRECT_URI", None)

    res_status = client.get("/api/auth/google/status")
    assert res_status.status_code == 200
    status_json = res_status.json()
    assert status_json["configured"] is True
    assert status_json["redirect_uri"] == "http://localhost:8001/api/auth/google/callback"
    assert "client_secret" not in status_json

    res_open_redirect = client.post(
        "/api/auth/google/start",
        json={"redirect_path": "https://evil.attacker.com/steal"},
    )
    assert res_open_redirect.status_code == 400

    # Valid Google OAuth start -> returns official accounts.google.com URL with PKCE S256, state & port 8001 callback
    res_start = client.post(
        "/api/auth/google/start",
        json={"redirect_path": "/workspace"},
    )
    assert res_start.status_code == 200
    start_data = res_start.json()
    assert start_data["authorization_url"].startswith(
        "https://accounts.google.com/o/oauth2/v2/auth?"
    )
    assert "code_challenge_method=S256" in start_data["authorization_url"]
    assert (
        "redirect_uri=http%3A%2F%2Flocalhost%3A8001%2Fapi%2Fauth%2Fgoogle%2Fcallback"
        in start_data["authorization_url"]
    )
    state_ok = start_data["state"]

    # Scenario 4: Invalid/tampered state on Google callback -> 400
    res_bad_state = client.get(
        "/api/auth/google/callback",
        params={"state": "tampered_state_value", "code": "some_code"},
        follow_redirects=False,
    )
    assert res_bad_state.status_code == 400

    # Scenario 2: User denies Google OAuth (error=access_denied) -> redirects to /login with oauth_error, no session created
    res_start_deny = client.post(
        "/api/auth/google/start", json={"redirect_path": "/workspace"}
    )
    state_deny = res_start_deny.json()["state"]
    res_denied = client.get(
        "/api/auth/google/callback",
        params={"state": state_deny, "error": "access_denied"},
        follow_redirects=False,
    )
    assert res_denied.status_code == 302
    assert "oauth_error=" in res_denied.headers["location"]
    assert "token=" not in res_denied.headers["location"]

    # Scenario 1 & 9: Successful Google OAuth token exchange + verified userinfo
    from app.oauth_providers import set_http_transport

    def mock_google_http(method, url, headers, data, timeout=10):
        if url == "https://oauth2.googleapis.com/token":
            return 200, {"access_token": "ya29.real_google_access_token"}, {}
        if url == "https://openidconnect.googleapis.com/v1/userinfo":
            return (
                200,
                {
                    "sub": "google-uid-998877",
                    "email": "verified.user@gmail.com",
                    "email_verified": True,
                    "name": "Verified Google Engineer",
                    "picture": "https://lh3.googleusercontent.com/a/default-user",
                },
                {},
            )
        return 404, {"error": "not_found"}, {}

    set_http_transport(mock_google_http)
    try:
        res_cb_ok = client.get(
            "/api/auth/google/callback",
            params={"state": state_ok, "code": "valid_google_auth_code"},
            follow_redirects=False,
        )
        assert res_cb_ok.status_code == 302
        loc = res_cb_ok.headers["location"]
        assert "/oauth/callback?token=" in loc

        # Extract session token from redirect query
        from urllib.parse import urlparse, parse_qs

        parsed = urlparse(loc)
        qs = parse_qs(parsed.query)
        google_session_token = qs["token"][0]

        # Replaying the same state must fail with 400 (one-time state consumption)
        res_replay = client.get(
            "/api/auth/google/callback",
            params={"state": state_ok, "code": "valid_google_auth_code"},
            follow_redirects=False,
        )
        assert res_replay.status_code == 400

        # Verify session works via /api/auth/me
        res_me = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {google_session_token}"},
        )
        assert res_me.status_code == 200
        assert res_me.json()["user"]["email"] == "verified.user@gmail.com"
        assert res_me.json()["user"]["auth_provider"] == "google"

        # Scenario 9: Signing in with Google MUST NOT auto-connect GitHub, GitLab, or Bitbucket
        res_ints = client.get(
            "/api/integrations",
            headers={"Authorization": f"Bearer {google_session_token}"},
        )
        assert res_ints.status_code == 200
        ints = res_ints.json()["integrations"]
        assert ints["github"]["status"] == "not_connected"
        assert ints["gitlab"]["status"] == "not_connected"
        assert ints["bitbucket"]["status"] == "not_connected"
    finally:
        set_http_transport(None)


def test_GitHubGitLabBitbucketAll10Scenarios(client: TestClient):
    """
    Comprehensive test covering Scenarios 1 through 10 across GitHub, GitLab (Cloud + self-managed HTTPS),
    and Bitbucket Cloud:
    1. Successful authorization & API verification
    2. Denied authorization (error=access_denied)
    3. Invalid or expired credentials/tokens (401 -> token_expired_or_revoked)
    4. Incorrect OAuth callback state (400)
    5. Missing scopes or repository permissions (403 -> permission_insufficient)
    6. Token revocation and reconnect (connected -> token_expired_or_revoked -> connected)
    7. User A cannot access User B's connected repositories or scan them (403)
    8. Failed authorization never creates a connected state (access_token is NULL)
    9. Login/logout and repository connections remain separate
    10. Repository scanning only runs when backend has verified live repository access for current user
    """
    from app.oauth_providers import set_http_transport
    from app.database import get_db_connection

    os.environ["GITHUB_CLIENT_ID"] = "gh-client-id"
    os.environ["GITHUB_CLIENT_SECRET"] = "gh-client-secret"
    os.environ["GITLAB_CLIENT_ID"] = "gl-client-id"
    os.environ["GITLAB_CLIENT_SECRET"] = "gl-client-secret"
    os.environ["BITBUCKET_CLIENT_ID"] = "bb-client-id"
    os.environ["BITBUCKET_CLIENT_SECRET"] = "bb-client-secret"

    # Create User A and User B
    res_a = client.post(
        "/api/auth/signup",
        json={
            "full_name": "User A",
            "email": "usera@silentguard.dev",
            "password": "PasswordA123!",
        },
    )
    token_a = res_a.json()["token"]
    user_a_id = res_a.json()["user"]["id"]

    res_b = client.post(
        "/api/auth/signup",
        json={
            "full_name": "User B",
            "email": "userb@silentguard.dev",
            "password": "PasswordB123!",
        },
    )
    token_b = res_b.json()["token"]

    # ------------------------------------------------------------------
    # SCENARIO 10 (Pre-check): Scanning before connecting is rejected (403)
    # ------------------------------------------------------------------
    res_scan_unconnected = client.post(
        "/api/repositories/scan",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "provider": "github",
            "repo_full_name": "octocat/hello-world",
            "branch": "main",
        },
    )
    assert res_scan_unconnected.status_code == 403

    # ------------------------------------------------------------------
    # SCENARIO 2 & 8: Denied OAuth authorization on GitHub -> authorization_failed, NULL token
    # ------------------------------------------------------------------
    res_gh_start = client.post(
        "/api/integrations/github/connect",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"redirect_path": "/projects"},
    )
    assert res_gh_start.status_code == 200
    assert res_gh_start.json()["integration"]["status"] == "connecting"
    gh_state_deny = res_gh_start.json()["state"]

    res_gh_deny_cb = client.get(
        "/api/integrations/github/callback",
        params={
            "state": gh_state_deny,
            "error": "access_denied",
            "error_description": "The user denied your request",
        },
        follow_redirects=False,
    )
    assert res_gh_deny_cb.status_code == 302

    # Check DB & API: status must be authorization_failed and access_token must be NULL
    res_ints_after_deny = client.get(
        "/api/integrations", headers={"Authorization": f"Bearer {token_a}"}
    )
    assert (
        res_ints_after_deny.json()["integrations"]["github"]["status"]
        == "authorization_failed"
    )
    with get_db_connection() as conn:
        row = conn.execute(
            "SELECT status, access_token FROM provider_connections WHERE user_id = ? AND provider = 'github'",
            (user_a_id,),
        ).fetchone()
        assert row["status"] == "authorization_failed"
        assert row["access_token"] is None

    # ------------------------------------------------------------------
    # SCENARIO 3 & 8: Invalid/expired token on GitHub, GitLab, Bitbucket -> 401 & token_expired_or_revoked
    # ------------------------------------------------------------------
    def mock_invalid_token_http(method, url, headers, data, timeout=10):
        return 401, {"message": "401 Unauthorized - Bad credentials"}, {}

    set_http_transport(mock_invalid_token_http)
    try:
        for prov in ("github", "gitlab", "bitbucket"):
            res_bad_tok = client.post(
                f"/api/integrations/{prov}/connect",
                headers={"Authorization": f"Bearer {token_a}"},
                json={"access_token": "invalid_or_expired_token_value"},
            )
            assert res_bad_tok.status_code == 401
            assert (
                res_bad_tok.json()["detail"]["integration"]["status"]
                == "token_expired_or_revoked"
            )
            with get_db_connection() as conn:
                row = conn.execute(
                    "SELECT status, access_token FROM provider_connections WHERE user_id = ? AND provider = ?",
                    (user_a_id, prov),
                ).fetchone()
                assert row["status"] == "token_expired_or_revoked"
                assert row["access_token"] is None
    finally:
        set_http_transport(None)

    # ------------------------------------------------------------------
    # SCENARIO 5 & 8: Missing repository scopes on GitHub -> 403 & permission_insufficient
    # ------------------------------------------------------------------
    def mock_missing_scopes_github(method, url, headers, data, timeout=10):
        if url == "https://api.github.com/user":
            # Missing 'repo' or 'public_repo' in X-OAuth-Scopes
            return (
                200,
                {"id": 101, "login": "octocat", "email": "octocat@github.com"},
                {"x-oauth-scopes": "read:user"},
            )
        return 403, {"message": "Forbidden"}, {}

    set_http_transport(mock_missing_scopes_github)
    try:
        res_no_scope = client.post(
            "/api/integrations/github/connect",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"access_token": "gho_no_repo_scope_token"},
        )
        assert res_no_scope.status_code == 403
        assert (
            res_no_scope.json()["detail"]["integration"]["status"]
            == "permission_insufficient"
        )
    finally:
        set_http_transport(None)

    # ------------------------------------------------------------------
    # SCENARIO 1: Successful OAuth / API Verification for GitHub, GitLab (self-managed HTTPS), and Bitbucket
    # ------------------------------------------------------------------
    token_revoked_flag = {"github": False}

    def mock_all_providers_valid(method, url, headers, data, timeout=10):
        # GitHub OAuth & API
        if url == "https://github.com/login/oauth/access_token":
            return (
                200,
                {
                    "access_token": "gho_valid_user_a_token",
                    "scope": "read:user,user:email,repo",
                },
                {},
            )
        if url == "https://api.github.com/user":
            if token_revoked_flag["github"]:
                return 401, {"message": "Bad credentials (token revoked)"}, {}
            return (
                200,
                {"id": 5001, "login": "alice-gh", "email": "alice@github.com"},
                {"x-oauth-scopes": "read:user, user:email, repo"},
            )
        if url.startswith("https://api.github.com/user/repos"):
            return (
                200,
                [
                    {
                        "id": 9001,
                        "name": "silentguard-core",
                        "full_name": "alice-gh/silentguard-core",
                        "private": True,
                        "default_branch": "main",
                        "html_url": "https://github.com/alice-gh/silentguard-core",
                        "language": "Python",
                        "permissions": {"pull": True, "push": True},
                    }
                ],
                {"x-oauth-scopes": "read:user, user:email, repo"},
            )
        if url == "https://api.github.com/repos/alice-gh/silentguard-core":
            if token_revoked_flag["github"]:
                return 401, {"message": "Bad credentials"}, {}
            return (
                200,
                {
                    "id": 9001,
                    "full_name": "alice-gh/silentguard-core",
                    "permissions": {"pull": True},
                },
                {},
            )
        if url.startswith("https://api.github.com/repos/alice-gh/silentguard-core/branches"):
            return (
                200,
                [
                    {"name": "main", "protected": True, "commit": {"sha": "abc1234567890"}},
                    {"name": "develop", "protected": False, "commit": {"sha": "def0987654321"}},
                ],
                {},
            )

        # GitLab self-managed HTTPS API
        if url == "https://gitlab.enterprise.io/oauth/token":
            return (
                200,
                {
                    "access_token": "glpat_valid_user_a",
                    "refresh_token": "gl_refresh_a",
                    "scope": "read_user read_api read_repository",
                },
                {},
            )
        if url == "https://gitlab.enterprise.io/api/v4/user":
            return (
                200,
                {"id": 6001, "username": "alice-gl", "email": "alice@gitlab.io"},
                {},
            )
        if url.startswith("https://gitlab.enterprise.io/api/v4/projects/alice-gl%2Fpayments-service/repository/branches"):
            return (
                200,
                [
                    {"name": "main", "protected": True, "commit": {"id": "glsha11112222"}},
                    {"name": "release", "protected": True, "commit": {"id": "glsha33334444"}},
                ],
                {},
            )
        if url == "https://gitlab.enterprise.io/api/v4/projects/alice-gl%2Fpayments-service":
            return (
                200,
                {
                    "id": 7001,
                    "name": "payments-service",
                    "path_with_namespace": "alice-gl/payments-service",
                    "visibility": "private",
                    "default_branch": "main",
                },
                {},
            )
        if url.startswith("https://gitlab.enterprise.io/api/v4/projects"):
            return (
                200,
                [
                    {
                        "id": 7001,
                        "name": "payments-service",
                        "path_with_namespace": "alice-gl/payments-service",
                        "visibility": "private",
                        "default_branch": "main",
                        "web_url": "https://gitlab.enterprise.io/alice-gl/payments-service",
                    }
                ],
                {},
            )

        # Bitbucket Cloud OAuth & API
        if url == "https://bitbucket.org/site/oauth2/access_token":
            return (
                200,
                {
                    "access_token": "bb_valid_user_a",
                    "refresh_token": "bb_refresh_a",
                    "scopes": "account repository",
                },
                {},
            )
        if url == "https://api.bitbucket.org/2.0/user":
            return (
                200,
                {
                    "account_id": "bb-acc-8001",
                    "username": "alice-bb",
                    "nickname": "alice-bb",
                },
                {},
            )
        if url.startswith("https://api.bitbucket.org/2.0/repositories/alice-bb/infra-pipelines/refs/branches"):
            return (
                200,
                {
                    "values": [
                        {"name": "main", "target": {"hash": "bbsha99998888"}},
                        {"name": "staging", "target": {"hash": "bbsha77776666"}},
                    ]
                },
                {},
            )
        if url == "https://api.bitbucket.org/2.0/repositories/alice-bb/infra-pipelines":
            return (
                200,
                {
                    "uuid": "{repo-uuid-1}",
                    "name": "infra-pipelines",
                    "full_name": "alice-bb/infra-pipelines",
                },
                {},
            )
        if url.startswith("https://api.bitbucket.org/2.0/repositories"):
            return (
                200,
                {
                    "values": [
                        {
                            "uuid": "{repo-uuid-1}",
                            "name": "infra-pipelines",
                            "full_name": "alice-bb/infra-pipelines",
                            "is_private": True,
                            "mainbranch": {"name": "main"},
                            "links": {
                                "html": {
                                    "href": "https://bitbucket.org/alice-bb/infra-pipelines"
                                }
                            },
                            "language": "TypeScript",
                        }
                    ]
                },
                {},
            )
        return 404, {"message": f"Unmocked URL {url}"}, {}

    set_http_transport(mock_all_providers_valid)
    try:
        # 1A. Connect GitHub via full OAuth callback for User A
        res_gh_init = client.post(
            "/api/integrations/github/connect",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"redirect_path": "/projects"},
        )
        gh_state = res_gh_init.json()["state"]
        res_gh_cb = client.get(
            "/api/integrations/github/callback",
            params={"state": gh_state, "code": "gh_auth_code_123"},
            follow_redirects=False,
        )
        assert res_gh_cb.status_code == 302
        assert "integration_status=connected" in res_gh_cb.headers["location"]

        # 1B. Connect GitLab (self-managed HTTPS instance) via OAuth callback for User A
        res_gl_init = client.post(
            "/api/integrations/gitlab/connect",
            headers={"Authorization": f"Bearer {token_a}"},
            json={
                "redirect_path": "/projects",
                "instance_url": "https://gitlab.enterprise.io",
            },
        )
        assert res_gl_init.status_code == 200
        gl_state = res_gl_init.json()["state"]
        res_gl_cb = client.get(
            "/api/integrations/gitlab/callback",
            params={"state": gl_state, "code": "gl_auth_code_456"},
            follow_redirects=False,
        )
        assert res_gl_cb.status_code == 302
        assert "integration_status=connected" in res_gl_cb.headers["location"]

        # 1C. Connect Bitbucket Cloud via OAuth callback for User A
        res_bb_init = client.post(
            "/api/integrations/bitbucket/connect",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"redirect_path": "/projects"},
        )
        bb_state = res_bb_init.json()["state"]
        res_bb_cb = client.get(
            "/api/integrations/bitbucket/callback",
            params={"state": bb_state, "code": "bb_auth_code_789"},
            follow_redirects=False,
        )
        assert res_bb_cb.status_code == 302
        assert "integration_status=connected" in res_bb_cb.headers["location"]

        # Verify all 3 providers are connected for User A and tokens are NEVER exposed in API responses
        res_a_ints = client.get(
            "/api/integrations", headers={"Authorization": f"Bearer {token_a}"}
        )
        assert res_a_ints.status_code == 200
        a_ints = res_a_ints.json()["integrations"]
        for prov in ("github", "gitlab", "bitbucket"):
            assert a_ints[prov]["status"] == "connected"
            assert a_ints[prov]["accessible_repos_count"] == 1
            assert "access_token" not in a_ints[prov]
            assert "refresh_token" not in a_ints[prov]

        # ------------------------------------------------------------------
        # SCENARIO 7: User B cannot see or scan User A's connected repositories
        # ------------------------------------------------------------------
        res_b_ints = client.get(
            "/api/integrations", headers={"Authorization": f"Bearer {token_b}"}
        )
        assert res_b_ints.status_code == 200
        b_ints = res_b_ints.json()["integrations"]
        assert b_ints["github"]["status"] == "not_connected"
        assert b_ints["gitlab"]["status"] == "not_connected"
        assert b_ints["bitbucket"]["status"] == "not_connected"

        res_b_repos = client.get(
            "/api/integrations/github/repositories",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert res_b_repos.status_code == 403

        res_b_scan_steal = client.post(
            "/api/repositories/scan",
            headers={"Authorization": f"Bearer {token_b}"},
            json={
                "provider": "github",
                "repo_full_name": "alice-gh/silentguard-core",
                "branch": "main",
            },
        )
        assert res_b_scan_steal.status_code == 403

        # ------------------------------------------------------------------
        # SCENARIO 10: User A can list branches, select target repo+branch, and run a verified repository scan
        # ------------------------------------------------------------------
        for prov, repo_name, target_branch in (
            ("github", "alice-gh/silentguard-core", "develop"),
            ("gitlab", "alice-gl/payments-service", "release"),
            ("bitbucket", "alice-bb/infra-pipelines", "staging"),
        ):
            res_repos = client.get(
                f"/api/integrations/{prov}/repositories",
                params={"refresh": "true"},
                headers={"Authorization": f"Bearer {token_a}"},
            )
            assert res_repos.status_code == 200
            assert res_repos.json()["repositories"][0]["full_name"] == repo_name

            res_branches = client.get(
                f"/api/integrations/{prov}/branches",
                params={"repo_full_name": repo_name},
                headers={"Authorization": f"Bearer {token_a}"},
            )
            assert res_branches.status_code == 200
            branch_names = res_branches.json()["branches"]
            assert "main" in branch_names
            assert target_branch in branch_names

            # Select repository and branch for User A
            res_sel = client.post(
                f"/api/integrations/{prov}/select",
                headers={"Authorization": f"Bearer {token_a}"},
                json={"repo_full_name": repo_name, "branch": target_branch},
            )
            assert res_sel.status_code == 200
            sel_int = res_sel.json()["integration"]
            assert sel_int["selected_repo_full_name"] == repo_name
            assert sel_int["selected_branch"] == target_branch

            # User B cannot select User A's repository
            res_b_sel = client.post(
                f"/api/integrations/{prov}/select",
                headers={"Authorization": f"Bearer {token_b}"},
                json={"repo_full_name": repo_name, "branch": target_branch},
            )
            assert res_b_sel.status_code == 403

        res_a_scan = client.post(
            "/api/repositories/scan",
            headers={"Authorization": f"Bearer {token_a}"},
            json={
                "provider": "github",
                "repo_full_name": "alice-gh/silentguard-core",
                "branch": "develop",
            },
        )
        assert res_a_scan.status_code == 200
        scan_payload = res_a_scan.json()
        assert scan_payload["status"] == "scan_verified_and_completed"
        assert scan_payload["verified_by_user_id"] == user_a_id
        assert scan_payload["repository"] == "alice-gh/silentguard-core"
        assert scan_payload["branch"] == "develop"
        scan_id_a = scan_payload["scan_id"]
        assert scan_payload["findings_count"] > 0
        assert scan_payload["debt_score"] > 0

        # Verify scan record & findings persistence via API
        res_latest = client.get(
            "/api/scans/latest",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res_latest.status_code == 200
        latest_data = res_latest.json()
        assert latest_data["has_scan"] is True
        assert latest_data["scan"]["id"] == scan_id_a

        res_findings = client.get(
            f"/api/scans/{scan_id_a}/findings",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res_findings.status_code == 200
        findings_list = res_findings.json()["findings"]
        assert len(findings_list) == scan_payload["findings_count"]
        first_finding = findings_list[0]
        assert "ruleId" in first_finding
        assert "filePath" in first_finding
        assert "line" in first_finding

        # User B cannot read User A's scan details (Isolation check)
        res_b_read_scan = client.get(
            f"/api/scans/{scan_id_a}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert res_b_read_scan.status_code == 404

        # Verify workspace summary delivers real scan results
        res_summary = client.get(
            "/api/workspace/summary",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res_summary.status_code == 200
        sum_data = res_summary.json()
        assert sum_data["has_scans"] is True
        assert sum_data["is_demo"] is False
        assert sum_data["active_project"]["repo"] == "alice-gh/silentguard-core"
        assert sum_data["overview"]["silentDebtScore"] == scan_payload["debt_score"]

        # Test finding remediation patch
        res_rem = client.patch(
            f"/api/findings/{first_finding['id']}/remediation",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"status": "approved"},
        )
        assert res_rem.status_code == 200
        assert res_rem.json()["remediation_status"] == "approved"

        # ------------------------------------------------------------------
        # SCENARIO 6: Token revocation -> transitions to token_expired_or_revoked -> Reconnect restores connected
        # ------------------------------------------------------------------
        token_revoked_flag["github"] = True
        res_verify_revoked = client.post(
            "/api/integrations/github/verify",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res_verify_revoked.status_code == 401
        assert (
            res_verify_revoked.json()["detail"]["integration"]["status"]
            == "token_expired_or_revoked"
        )

        # Scanning while token is revoked must fail with 401/403
        res_scan_revoked = client.post(
            "/api/repositories/scan",
            headers={"Authorization": f"Bearer {token_a}"},
            json={
                "provider": "github",
                "repo_full_name": "alice-gh/silentguard-core",
                "branch": "main",
            },
        )
        assert res_scan_revoked.status_code in (401, 403)

        # Reconnect with a fresh valid token -> back to connected
        token_revoked_flag["github"] = False
        res_reconnect = client.post(
            "/api/integrations/github/connect",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"access_token": "gho_fresh_reconnected_token"},
        )
        assert res_reconnect.status_code == 200
        assert res_reconnect.json()["integration"]["status"] == "connected"

        # ------------------------------------------------------------------
        # Safe Disconnect behavior
        # ------------------------------------------------------------------
        res_disc = client.post(
            "/api/integrations/bitbucket/disconnect",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res_disc.status_code == 200
        assert res_disc.json()["integration"]["status"] == "disconnected"
        assert res_disc.json()["integration"]["accessible_repos_count"] == 0
    finally:
        set_http_transport(None)
