import os
import sqlite3
import hashlib
import secrets
import uuid
from datetime import datetime, timezone
from contextlib import contextmanager

DEFAULT_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "silentguard.db",
)


def get_db_path() -> str:
    return os.environ.get("SILENTGUARD_DB_PATH", DEFAULT_DB_PATH)


@contextmanager
def get_db_connection():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def hash_password(password: str, salt: str | None = None) -> str:
    if salt is None:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        120_000,
    )
    return f"pbkdf2_sha256$120000${salt}${dk.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        parts = stored_hash.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = parts[2]
        expected_hex = parts[3]
        dk = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        return secrets.compare_digest(dk.hex(), expected_hex)
    except Exception:
        return False


def get_configured_admin_emails() -> set[str]:
    raw = os.environ.get("SILENTGUARD_ADMIN_EMAILS", "admin@silentguard.ai")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def init_db() -> None:
    with get_db_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version TEXT PRIMARY KEY,
                applied_at TEXT NOT NULL
            );
            """
        )

        applied = {
            row["version"]
            for row in conn.execute("SELECT version FROM schema_migrations").fetchall()
        }

        now_iso = datetime.now(timezone.utc).isoformat()

        if "001_users_and_sessions" not in applied:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    full_name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    company TEXT,
                    job_title TEXT,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    revoked INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                ("001_users_and_sessions", now_iso),
            )

        if "002_demo_bookings_and_audit" not in applied:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS demo_bookings (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    full_name TEXT NOT NULL,
                    work_email TEXT NOT NULL,
                    company TEXT,
                    team_size TEXT,
                    preferred_date TEXT NOT NULL,
                    preferred_time TEXT NOT NULL,
                    timezone TEXT NOT NULL,
                    message TEXT,
                    status TEXT NOT NULL DEFAULT 'Pending',
                    admin_notes TEXT,
                    confirmed_datetime TEXT,
                    email_notification_status TEXT NOT NULL DEFAULT 'not_configured',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                );
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS booking_status_history (
                    id TEXT PRIMARY KEY,
                    booking_id TEXT NOT NULL,
                    previous_status TEXT,
                    new_status TEXT NOT NULL,
                    changed_by_user_id TEXT,
                    changed_by_email TEXT,
                    notes TEXT,
                    changed_at TEXT NOT NULL,
                    FOREIGN KEY (booking_id) REFERENCES demo_bookings(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                ("002_demo_bookings_and_audit", now_iso),
            )

        if "003_oauth_provider_columns" not in applied:
            existing_cols = {
                row["name"]
                for row in conn.execute("PRAGMA table_info(users)").fetchall()
            }
            if "auth_provider" not in existing_cols:
                conn.execute(
                    "ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'email';"
                )
            if "provider_account_id" not in existing_cols:
                conn.execute(
                    "ALTER TABLE users ADD COLUMN provider_account_id TEXT;"
                )
            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                ("003_oauth_provider_columns", now_iso),
            )

        if "004_oauth_states_and_provider_connections" not in applied:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS oauth_states (
                    state TEXT PRIMARY KEY,
                    provider TEXT NOT NULL,
                    purpose TEXT NOT NULL,
                    user_id TEXT,
                    code_verifier TEXT NOT NULL,
                    redirect_uri TEXT NOT NULL,
                    frontend_redirect TEXT NOT NULL,
                    instance_url TEXT,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    consumed INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS provider_connections (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'not_connected',
                    provider_account_id TEXT,
                    provider_username TEXT,
                    provider_email TEXT,
                    instance_url TEXT,
                    scopes TEXT,
                    access_token TEXT,
                    refresh_token TEXT,
                    token_expires_at TEXT,
                    accessible_repos_count INTEGER NOT NULL DEFAULT 0,
                    sample_repositories_json TEXT,
                    last_error TEXT,
                    last_verified_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, provider),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                ("004_oauth_states_and_provider_connections", now_iso),
            )

        if "005_selected_repository_and_branch" not in applied:
            existing_pc_cols = {
                row["name"]
                for row in conn.execute("PRAGMA table_info(provider_connections)").fetchall()
            }
            if "selected_repo_full_name" not in existing_pc_cols:
                conn.execute(
                    "ALTER TABLE provider_connections ADD COLUMN selected_repo_full_name TEXT;"
                )
            if "selected_branch" not in existing_pc_cols:
                conn.execute(
                    "ALTER TABLE provider_connections ADD COLUMN selected_branch TEXT;"
                )
            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                ("005_selected_repository_and_branch", now_iso),
            )

        # Seed configured bootstrap admin account if not present
        bootstrap_email = (
            os.environ.get("SILENTGUARD_BOOTSTRAP_ADMIN_EMAIL", "admin@silentguard.ai")
            .strip()
            .lower()
        )
        bootstrap_password = os.environ.get(
            "SILENTGUARD_BOOTSTRAP_ADMIN_PASSWORD", "Admin@SilentGuard2026!"
        )
        bootstrap_name = os.environ.get(
            "SILENTGUARD_BOOTSTRAP_ADMIN_NAME", "SilentGuard Admin"
        )

        existing_admin = conn.execute(
            "SELECT id FROM users WHERE email = ?", (bootstrap_email,)
        ).fetchone()

        if not existing_admin and bootstrap_email:
            conn.execute(
                """
                INSERT INTO users (id, full_name, email, company, job_title, password_hash, role, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'admin', ?, ?)
                """,
                (
                    f"usr_{uuid.uuid4().hex[:12]}",
                    bootstrap_name,
                    bootstrap_email,
                    "SilentGuard AI",
                    "Platform Administrator",
                    hash_password(bootstrap_password),
                    now_iso,
                    now_iso,
                ),
            )
