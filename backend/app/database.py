import hashlib
import json
import os
import secrets
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Optional

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

        if "006_scans_and_analysis_results" not in applied:
            existing_pc_cols = {
                row["name"]
                for row in conn.execute("PRAGMA table_info(provider_connections)").fetchall()
            }
            if "selected_repo_id" not in existing_pc_cols:
                conn.execute("ALTER TABLE provider_connections ADD COLUMN selected_repo_id TEXT;")
            if "selected_repo_default_branch" not in existing_pc_cols:
                conn.execute("ALTER TABLE provider_connections ADD COLUMN selected_repo_default_branch TEXT;")
            if "selected_repo_language" not in existing_pc_cols:
                conn.execute("ALTER TABLE provider_connections ADD COLUMN selected_repo_language TEXT;")
            if "selected_repo_private" not in existing_pc_cols:
                conn.execute("ALTER TABLE provider_connections ADD COLUMN selected_repo_private INTEGER DEFAULT 0;")

            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scans (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    repository TEXT NOT NULL,
                    branch TEXT NOT NULL,
                    commit_sha TEXT,
                    status TEXT NOT NULL,
                    progress_percent INTEGER NOT NULL DEFAULT 0,
                    current_step TEXT,
                    files_scanned INTEGER NOT NULL DEFAULT 0,
                    total_loc INTEGER NOT NULL DEFAULT 0,
                    findings_count INTEGER NOT NULL DEFAULT 0,
                    debt_score INTEGER NOT NULL DEFAULT 100,
                    debt_grade TEXT NOT NULL DEFAULT 'A',
                    categories_json TEXT,
                    languages_json TEXT,
                    metrics_json TEXT,
                    dependency_graph_json TEXT,
                    error_message TEXT,
                    started_at TEXT NOT NULL,
                    completed_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_scans_user_repo 
                ON scans(user_id, provider, repository, branch);
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scan_findings (
                    id TEXT PRIMARY KEY,
                    scan_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    repository TEXT NOT NULL,
                    branch TEXT NOT NULL,
                    rule_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    cwe TEXT,
                    category TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    line_number INTEGER NOT NULL DEFAULT 1,
                    description TEXT NOT NULL,
                    remediation TEXT NOT NULL,
                    code_snippet_json TEXT,
                    remediation_diff_json TEXT,
                    signal_type TEXT NOT NULL DEFAULT 'confirmed_ast',
                    confidence INTEGER NOT NULL DEFAULT 90,
                    verified_fix_available INTEGER NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'open',
                    remediation_status TEXT NOT NULL DEFAULT 'proposed',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_scan_findings_scan_id
                ON scan_findings(scan_id);
                """
            )
            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                ("006_scans_and_analysis_results", now_iso),
            )

        if "007_ai_code_review_and_audit" not in applied:
            # 1. scan_files table to store downloaded source files for fast, real file viewer
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scan_files (
                    scan_id TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    content TEXT NOT NULL,
                    line_count INTEGER NOT NULL DEFAULT 0,
                    language TEXT NOT NULL DEFAULT 'plaintext',
                    created_at TEXT NOT NULL,
                    PRIMARY KEY (scan_id, file_path),
                    FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_scan_files_scan_id
                ON scan_files(scan_id);
                """
            )

            # 2. Add review workflow and beginner explanation columns to scan_findings if missing
            existing_findings_cols = {
                row["name"]
                for row in conn.execute("PRAGMA table_info(scan_findings)").fetchall()
            }
            new_finding_cols = [
                ("review_status", "TEXT DEFAULT 'open'"),
                ("reviewed_by_user_id", "TEXT"),
                ("reviewed_by_name", "TEXT"),
                ("reviewed_at", "TEXT"),
                ("applied_patch_json", "TEXT"),
                ("beginner_explanation", "TEXT"),
                ("what_happened", "TEXT"),
                ("where_happened", "TEXT"),
                ("why_it_matters", "TEXT"),
                ("potential_impact", "TEXT"),
                ("how_to_fix", "TEXT"),
                ("confidence_evidence", "TEXT"),
            ]
            for col_name, col_type in new_finding_cols:
                if col_name not in existing_findings_cols:
                    conn.execute(f"ALTER TABLE scan_findings ADD COLUMN {col_name} {col_type};")

            # 3. finding_reviews table for audit trail
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS finding_reviews (
                    id TEXT PRIMARY KEY,
                    finding_id TEXT NOT NULL,
                    scan_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    user_name TEXT NOT NULL,
                    user_email TEXT NOT NULL,
                    action TEXT NOT NULL,
                    from_status TEXT,
                    to_status TEXT,
                    note TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (finding_id) REFERENCES scan_findings(id) ON DELETE CASCADE,
                    FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_finding_reviews_finding_id
                ON finding_reviews(finding_id);
                """
            )

            # 4. ai_explanations table for storing generated AI explanations & suggestions
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS ai_explanations (
                    id TEXT PRIMARY KEY,
                    finding_id TEXT NOT NULL,
                    scan_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    beginner_explanation TEXT,
                    technical_explanation TEXT,
                    what_happened TEXT,
                    why_it_matters TEXT,
                    potential_impact TEXT,
                    recommended_solution TEXT,
                    validation_steps_json TEXT,
                    suggested_patch_json TEXT,
                    side_effects TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (finding_id) REFERENCES scan_findings(id) ON DELETE CASCADE,
                    FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_ai_explanations_finding_id
                ON ai_explanations(finding_id);
                """
            )

            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                ("007_ai_code_review_and_audit", now_iso),
            )

        if "008_demo_booking_management_enhancements" not in applied:
            existing_demo_cols = {
                row["name"]
                for row in conn.execute("PRAGMA table_info(demo_bookings)").fetchall()
            }
            demo_new_cols = {
                "meeting_url": "TEXT",
                "confirmed_by_admin_id": "TEXT",
                "confirmed_at": "TEXT",
                "proposed_date": "TEXT",
                "proposed_time": "TEXT",
                "reschedule_reason": "TEXT",
                "reschedule_status": "TEXT",
                "rejection_reason": "TEXT",
                "cancellation_reason": "TEXT",
                "cancelled_by": "TEXT",
                "cancelled_at": "TEXT",
                "completed_at": "TEXT",
            }
            for col_name, col_type in demo_new_cols.items():
                if col_name not in existing_demo_cols:
                    conn.execute(f"ALTER TABLE demo_bookings ADD COLUMN {col_name} {col_type};")

            # Normalize any existing demo_bookings status to lowercase
            conn.execute("UPDATE demo_bookings SET status = lower(status) WHERE status IS NOT NULL;")

            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                ("008_demo_booking_management_enhancements", now_iso),
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


# ============================================================================
# Scan & Findings Persistence Helpers
# ============================================================================


def create_scan_record(
    conn,
    *,
    scan_id: str,
    user_id: str,
    provider: str,
    repository: str,
    branch: str,
    commit_sha: Optional[str] = None,
    status: str = "queued",
    progress_percent: int = 5,
    current_step: str = "Scan queued for analysis",
) -> dict:
    now_iso = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO scans (
            id, user_id, provider, repository, branch, commit_sha,
            status, progress_percent, current_step,
            started_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            scan_id,
            user_id,
            provider,
            repository,
            branch,
            commit_sha,
            status,
            progress_percent,
            current_step,
            now_iso,
            now_iso,
            now_iso,
        ),
    )
    row = conn.execute("SELECT * FROM scans WHERE id = ?", (scan_id,)).fetchone()
    return dict(row) if row else {}


def update_scan_progress(
    conn,
    *,
    scan_id: str,
    status: str,
    progress_percent: int,
    current_step: str,
    error_message: Optional[str] = None,
) -> None:
    now_iso = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        UPDATE scans
        SET status = ?, progress_percent = ?, current_step = ?, error_message = ?, updated_at = ?
        WHERE id = ?
        """,
        (status, progress_percent, current_step, error_message, now_iso, scan_id),
    )


def save_scan_completion(
    conn,
    *,
    scan_id: str,
    scan_result: dict,
    files_dict: Optional[dict] = None,
) -> dict:
    now_iso = datetime.now(timezone.utc).isoformat()
    findings = scan_result.get("findings", [])

    if files_dict:
        save_scan_files(conn, scan_id, files_dict)

    conn.execute(
        """
        UPDATE scans
        SET status = 'completed',
            progress_percent = 100,
            current_step = 'Scan completed successfully',
            files_scanned = ?,
            total_loc = ?,
            findings_count = ?,
            debt_score = ?,
            debt_grade = ?,
            categories_json = ?,
            languages_json = ?,
            metrics_json = ?,
            dependency_graph_json = ?,
            completed_at = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            scan_result.get("filesScanned", 0),
            scan_result.get("totalLoc", 0),
            len(findings),
            scan_result.get("debtScore", 100),
            scan_result.get("debtGrade", "A"),
            json.dumps(scan_result.get("categories", {})),
            json.dumps(scan_result.get("languages", [])),
            json.dumps({
                "severityCounts": scan_result.get("severityCounts", {}),
                "categoryCounts": scan_result.get("categoryCounts", {}),
                "debtBudget": scan_result.get("debtBudget", {}),
                "fingerprints": scan_result.get("fingerprints", []),
                "highestRiskModules": scan_result.get("highestRiskModules", []),
                "calculationMethodology": scan_result.get("calculationMethodology", ""),
                "recommendedActions": scan_result.get("recommendedActions", []),
            }),
            json.dumps(scan_result.get("moduleDependencies", [])),
            now_iso,
            now_iso,
            scan_id,
        ),
    )

    # Insert findings
    scan_row = conn.execute("SELECT * FROM scans WHERE id = ?", (scan_id,)).fetchone()
    user_id = scan_row["user_id"]
    repo = scan_row["repository"]
    branch = scan_row["branch"]

    for f in findings:
        code_snip = f.get("codeSnippet")
        rem_diff = f.get("remediationDiff")
        finding_id = f.get("id") or f"find_{uuid.uuid4().hex[:10]}"
        conn.execute(
            """
            INSERT INTO scan_findings (
                id, scan_id, user_id, repository, branch,
                rule_id, title, cwe, category, severity,
                file_path, line_number, description, remediation,
                code_snippet_json, remediation_diff_json,
                signal_type, confidence, verified_fix_available,
                status, remediation_status, review_status,
                beginner_explanation, what_happened, where_happened,
                why_it_matters, potential_impact, how_to_fix, confidence_evidence,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                finding_id,
                scan_id,
                user_id,
                repo,
                branch,
                f.get("ruleId", "RULE-GENERAL"),
                f.get("title", "Detected Code Issue"),
                f.get("cwe"),
                f.get("category", "maintainability"),
                f.get("severity", "medium"),
                f.get("filePath", ""),
                f.get("line", 1),
                f.get("description", ""),
                f.get("remediation", ""),
                json.dumps(code_snip) if code_snip else None,
                json.dumps(rem_diff) if rem_diff else None,
                f.get("signalType", "confirmed_ast"),
                f.get("confidence", 90),
                1 if f.get("verifiedFixAvailable") else 0,
                f.get("status", "open"),
                "proposed",
                f.get("reviewStatus", "open"),
                f.get("beginnerExplanation"),
                f.get("whatHappened"),
                f.get("whereHappened", f"{f.get('filePath')}:{f.get('line')}"),
                f.get("whyItMatters"),
                f.get("potentialImpact"),
                f.get("howToFix"),
                f.get("confidenceEvidence"),
                now_iso,
            ),
        )

    updated_row = conn.execute("SELECT * FROM scans WHERE id = ?", (scan_id,)).fetchone()
    return dict(updated_row) if updated_row else {}


def save_scan_files(conn, scan_id: str, files_dict: dict) -> None:
    now_iso = datetime.now(timezone.utc).isoformat()
    for f_path, f_content in files_dict.items():
        _, ext = os.path.splitext(f_path.lower())
        lang = "plaintext"
        if ext in {".py"}:
            lang = "python"
        elif ext in {".js", ".mjs", ".cjs"}:
            lang = "javascript"
        elif ext in {".ts"}:
            lang = "typescript"
        elif ext in {".jsx", ".tsx"}:
            lang = "typescriptreact"
        elif ext in {".json"}:
            lang = "json"
        elif ext in {".yml", ".yaml"}:
            lang = "yaml"
        elif f_path.lower().startswith(".env"):
            lang = "configuration"

        line_count = len(f_content.splitlines()) if f_content else 0
        conn.execute(
            """
            INSERT OR REPLACE INTO scan_files (scan_id, file_path, content, line_count, language, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (scan_id, f_path, f_content or "", line_count, lang, now_iso),
        )


def get_scan_file_content(conn, scan_id: str, file_path: str) -> Optional[dict]:
    row = conn.execute(
        "SELECT * FROM scan_files WHERE scan_id = ? AND file_path = ?",
        (scan_id, file_path),
    ).fetchone()
    if not row:
        norm_path = file_path.lstrip("/")
        row = conn.execute(
            "SELECT * FROM scan_files WHERE scan_id = ? AND (file_path = ? OR file_path LIKE ?)",
            (scan_id, norm_path, f"%{norm_path}"),
        ).fetchone()
    if not row:
        return None
    return dict(row)


def add_finding_review_entry(
    conn,
    finding_id: str,
    scan_id: str,
    user_id: str,
    user_name: str,
    user_email: str,
    action: str,
    from_status: str,
    to_status: str,
    note: Optional[str] = None,
) -> dict:
    now_iso = datetime.now(timezone.utc).isoformat()
    review_id = f"rev_{uuid.uuid4().hex[:10]}"
    conn.execute(
        """
        INSERT INTO finding_reviews (
            id, finding_id, scan_id, user_id, user_name, user_email,
            action, from_status, to_status, note, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            review_id,
            finding_id,
            scan_id,
            user_id,
            user_name,
            user_email,
            action,
            from_status,
            to_status,
            note or "",
            now_iso,
        ),
    )
    conn.execute(
        """
        UPDATE scan_findings
        SET review_status = ?, reviewed_by_user_id = ?, reviewed_by_name = ?, reviewed_at = ?
        WHERE id = ?
        """,
        (to_status, user_id, user_name, now_iso, finding_id),
    )
    return {
        "id": review_id,
        "finding_id": finding_id,
        "action": action,
        "from_status": from_status,
        "to_status": to_status,
        "user_name": user_name,
        "user_email": user_email,
        "note": note,
        "created_at": now_iso,
    }


def get_finding_review_history(conn, finding_id: str) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM finding_reviews WHERE finding_id = ? ORDER BY created_at ASC",
        (finding_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def save_ai_explanation(
    conn,
    finding_id: str,
    scan_id: str,
    user_id: str,
    explanation_data: dict,
) -> dict:
    now_iso = datetime.now(timezone.utc).isoformat()
    expl_id = f"ai_{uuid.uuid4().hex[:10]}"
    conn.execute(
        """
        INSERT INTO ai_explanations (
            id, finding_id, scan_id, user_id, provider,
            beginner_explanation, technical_explanation, what_happened,
            why_it_matters, potential_impact, recommended_solution,
            validation_steps_json, suggested_patch_json, side_effects, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            expl_id,
            finding_id,
            scan_id,
            user_id,
            explanation_data.get("provider", "SilentGuard Rule-Based Intelligence Engine"),
            explanation_data.get("beginner_explanation"),
            explanation_data.get("technical_explanation"),
            explanation_data.get("what_happened"),
            explanation_data.get("why_it_matters"),
            explanation_data.get("potential_impact"),
            explanation_data.get("how_to_fix"),
            json.dumps(explanation_data.get("validation_steps", [])),
            json.dumps(explanation_data.get("suggestedPatch", {})),
            explanation_data.get("side_effects"),
            now_iso,
        ),
    )
    return explanation_data


def get_saved_ai_explanation(conn, finding_id: str) -> Optional[dict]:
    row = conn.execute(
        "SELECT * FROM ai_explanations WHERE finding_id = ? ORDER BY created_at DESC LIMIT 1",
        (finding_id,),
    ).fetchone()
    if not row:
        return None
    d = dict(row)
    if d.get("validation_steps_json"):
        try:
            d["validation_steps"] = json.loads(d["validation_steps_json"])
        except Exception:
            d["validation_steps"] = []
    if d.get("suggested_patch_json"):
        try:
            d["suggestedPatch"] = json.loads(d["suggested_patch_json"])
        except Exception:
            d["suggestedPatch"] = {}
    return d


def get_latest_user_scan(
    conn,
    user_id: str,
    repository: Optional[str] = None,
    branch: Optional[str] = None,
) -> Optional[dict]:
    query = "SELECT * FROM scans WHERE user_id = ? AND status = 'completed'"
    params: list[Any] = [user_id]
    if repository:
        query += " AND repository = ?"
        params.append(repository)
    if branch:
        query += " AND branch = ?"
        params.append(branch)
    query += " ORDER BY completed_at DESC LIMIT 1"
    row = conn.execute(query, tuple(params)).fetchone()
    return dict(row) if row else None


def get_scan_findings_list(
    conn,
    scan_id: str,
    user_id: str,
    category: Optional[str] = None,
    severity: Optional[str] = None,
) -> list[dict]:
    query = "SELECT * FROM scan_findings WHERE scan_id = ? AND user_id = ?"
    params: list[Any] = [scan_id, user_id]
    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
    if severity and severity != "all":
        query += " AND severity = ?"
        params.append(severity)
    query += " ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END, line_number ASC"
    rows = conn.execute(query, tuple(params)).fetchall()

    from app.masking import mask_credentials_in_text

    results = []
    for r in rows:
        item = dict(r)
        if item.get("code_snippet_json"):
            try:
                snip = json.loads(item["code_snippet_json"])
                if isinstance(snip, dict) and "vulnerableLine" in snip:
                    snip["vulnerableLine"] = mask_credentials_in_text(snip["vulnerableLine"])
                    if "beforeLines" in snip:
                        snip["beforeLines"] = [mask_credentials_in_text(l) for l in snip["beforeLines"]]
                    if "afterLines" in snip:
                        snip["afterLines"] = [mask_credentials_in_text(l) for l in snip["afterLines"]]
                item["codeSnippet"] = snip
            except Exception:
                item["codeSnippet"] = None
        else:
            item["codeSnippet"] = None

        if item.get("remediation_diff_json"):
            try:
                rd = json.loads(item["remediation_diff_json"])
                if isinstance(rd, dict):
                    if "removedLines" in rd:
                        rd["removedLines"] = [mask_credentials_in_text(l) for l in rd["removedLines"]]
                    if "addedLines" in rd:
                        rd["addedLines"] = [mask_credentials_in_text(l) for l in rd["addedLines"]]
                item["remediationDiff"] = rd
            except Exception:
                item["remediationDiff"] = None
        else:
            item["remediationDiff"] = None

        item["ruleId"] = item.pop("rule_id")
        item["filePath"] = item.pop("file_path")
        item["line"] = item.pop("line_number")
        item["signalType"] = item.pop("signal_type")
        item["verifiedFixAvailable"] = bool(item.pop("verified_fix_available"))
        item["remediationStatus"] = item.pop("remediation_status")
        item["reviewStatus"] = item.get("review_status", "open")
        item["reviewedByName"] = item.get("reviewed_by_name")
        item["reviewedAt"] = item.get("reviewed_at")
        from app.ai_engine import RULE_INTELLIGENCE_CATALOG
        rule_cat = RULE_INTELLIGENCE_CATALOG.get(item["ruleId"], {})

        item["whatHappened"] = item.get("what_happened") or rule_cat.get("what_happened") or item.get("description")
        item["whereHappened"] = item.get("where_happened") or f"{item['filePath']}:{item['line']}"
        item["whyItMatters"] = item.get("why_it_matters") or rule_cat.get("why_it_matters") or "May compromise repository security or maintainability."
        item["potentialImpact"] = item.get("potential_impact") or rule_cat.get("potential_impact") or "Increased risk and technical debt."
        item["howToFix"] = item.get("how_to_fix") or rule_cat.get("how_to_fix") or item.get("remediation")
        item["beginnerExplanation"] = item.get("beginner_explanation") or rule_cat.get("beginner_analogy") or item.get("description")
        item["confidenceEvidence"] = item.get("confidence_evidence") or f"Identified via AST heuristics ({item.get('confidence', 85)}% confidence)."
        results.append(item)
    return results

