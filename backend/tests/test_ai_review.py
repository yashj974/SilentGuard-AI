import os
import tempfile
import json
import uuid
import pytest
from fastapi.testclient import TestClient

from app.database import (
    init_db,
    get_db_connection,
    create_scan_record,
    save_scan_completion,
    hash_password,
)
from app.main import app
from app.masking import mask_credentials_in_text


@pytest.fixture()
def client():
    fd, temp_db = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["SILENTGUARD_DB_PATH"] = temp_db
    init_db()

    with TestClient(app) as test_client:
        yield test_client

    if os.path.exists(temp_db):
        try:
            os.remove(temp_db)
        except Exception:
            pass


def create_user_and_session(client, full_name="Alice Reviewer", email="alice@test.com", password="Password123!"):
    resp = client.post("/api/auth/signup", json={"full_name": full_name, "email": email, "password": password})
    assert resp.status_code == 200
    token = resp.json()["token"]
    user = resp.json()["user"]
    return user, token


def test_file_retrieval_and_secret_masking(client):
    user, token = create_user_and_session(client, email="alice.files@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Setup scan with real files in DB
    with get_db_connection() as conn:
        scan_id = f"scan_{uuid.uuid4().hex[:12]}"
        create_scan_record(
            conn,
            scan_id=scan_id,
            user_id=user["id"],
            provider="github",
            repository="alice/secure-app",
            branch="main",
            commit_sha="a1b2c3d",
        )
        files = {
            ".env": "DATABASE_URL=postgres://app_admin:super_secret_pw123@db.prod:5432/main\nJWT_SECRET=\"supersecretjwttokenhere12345\"\n",
            "src/service.py": "import os\n\ndef run(cmd):\n    os.system('echo ' + cmd)\n",
        }
        scan_result = {
            "filesScanned": 2,
            "totalLoc": 6,
            "debtScore": 76,
            "debtGrade": "B",
            "findingsCount": 2,
            "findings": [
                {
                    "id": "find_sec_1",
                    "ruleId": "SEC-HARDCODED-SECRET",
                    "title": "Hardcoded Secret in Plaintext",
                    "category": "security",
                    "severity": "critical",
                    "filePath": ".env",
                    "line": 2,
                    "description": "Exposed JWT secret in .env",
                    "codeSnippet": {
                        "beforeLines": ["DATABASE_URL=postgres://app_admin:super_secret_pw123@db.prod:5432/main"],
                        "vulnerableLine": "JWT_SECRET=\"supersecretjwttokenhere12345\"",
                        "afterLines": [],
                    },
                    "remediationDiff": {
                        "removedLines": ["JWT_SECRET=\"supersecretjwttokenhere12345\""],
                        "addedLines": ["JWT_SECRET=os.getenv('JWT_SECRET')"],
                    },
                    "verifiedFixAvailable": True,
                },
                {
                    "id": "find_cmd_1",
                    "ruleId": "SEC-CMD-INJECTION",
                    "title": "Command Injection Vulnerability",
                    "category": "security",
                    "severity": "high",
                    "filePath": "src/service.py",
                    "line": 4,
                    "description": "os.system called with concatenated input",
                    "codeSnippet": {
                        "beforeLines": ["import os", "", "def run(cmd):"],
                        "vulnerableLine": "    os.system('echo ' + cmd)",
                        "afterLines": [],
                    },
                    "verifiedFixAvailable": True,
                }
            ],
            "categories": {"security": {"score": 60}},
            "languages": [{"name": "Python", "percentage": 80}],
            "recommendedActions": ["Extract credentials from .env to secrets manager"],
        }
        save_scan_completion(conn, scan_id=scan_id, scan_result=scan_result, files_dict=files)

    # 1. Retrieve .env file content
    resp = client.get(f"/api/scans/{scan_id}/file?path=.env", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["file_path"] == ".env"
    assert data["line_count"] == 2
    # Verify secrets are masked!
    assert "super_secret_pw123" not in data["content"]
    assert "supersecretjwttoken" not in data["content"]
    assert "DATABASE_URL=postgres://app_admin:********@db.prod:5432/main" in data["content"]
    assert "findings_in_file" in data
    assert len(data["findings_in_file"]) == 1
    assert data["findings_in_file"][0]["id"] == "find_sec_1"

    # 2. Retrieve Python file
    resp_py = client.get(f"/api/scans/{scan_id}/file?path=src/service.py", headers=headers)
    assert resp_py.status_code == 200
    data_py = resp_py.json()
    assert "os.system" in data_py["content"]
    assert len(data_py["findings_in_file"]) == 1
    assert data_py["findings_in_file"][0]["id"] == "find_cmd_1"


def test_ai_explanation_and_beginner_breakdown(client):
    user, token = create_user_and_session(client, email="alice.explain@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    with get_db_connection() as conn:
        scan_id = f"scan_{uuid.uuid4().hex[:12]}"
        create_scan_record(conn, scan_id=scan_id, user_id=user["id"], provider="github", repository="org/app", branch="main")
        scan_result = {
            "debtScore": 85,
            "findingsCount": 1,
            "findings": [{
                "id": "find_cmd_test",
                "ruleId": "SEC-CMD-INJECTION",
                "title": "OS Command Injection with shell=True",
                "cwe": "CWE-78",
                "category": "security",
                "severity": "critical",
                "filePath": "src/backup.py",
                "line": 14,
                "description": "Untrusted input passed to shell",
                "codeSnippet": {"beforeLines": [], "vulnerableLine": "subprocess.run(user_cmd, shell=True)", "afterLines": []},
            }],
        }
        save_scan_completion(conn, scan_id=scan_id, scan_result=scan_result)

    resp = client.post("/api/findings/find_cmd_test/explain", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    expl = data["explanation"]
    assert "what_happened" in expl
    assert "why_it_matters" in expl
    assert "potential_impact" in expl
    assert "how_to_fix" in expl
    assert "beginner_explanation" in expl
    assert "validation_steps" in expl
    assert len(expl["validation_steps"]) >= 2
    assert expl["provider"] in {"Google Gemini 2.0 Flash", "SilentGuard Rule-Based Intelligence Engine"}


def test_suggested_fix_diff_generation(client):
    user, token = create_user_and_session(client, email="alice.fix@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    with get_db_connection() as conn:
        scan_id = f"scan_{uuid.uuid4().hex[:12]}"
        create_scan_record(conn, scan_id=scan_id, user_id=user["id"], provider="github", repository="org/repo", branch="main")
        scan_result = {
            "debtScore": 90,
            "findingsCount": 1,
            "findings": [{
                "id": "find_console_test",
                "ruleId": "MAINT-CONSOLE-LOG",
                "title": "Console Debug Logging Statement",
                "category": "maintainability",
                "severity": "low",
                "filePath": "client/index.js",
                "line": 42,
                "description": "console.log in production",
                "codeSnippet": {"beforeLines": [], "vulnerableLine": "console.log('user token', token);", "afterLines": []},
            }],
        }
        save_scan_completion(conn, scan_id=scan_id, scan_result=scan_result)

    resp = client.post("/api/findings/find_console_test/suggest-fix", headers=headers)
    assert resp.status_code == 200
    fix = resp.json()["suggested_fix"]
    assert fix["filePath"] == "client/index.js"
    assert fix["line"] == 42
    assert "--- a/client/index.js" in fix["diffUnified"]
    assert "+++ b/client/index.js" in fix["diffUnified"]
    assert "-" in fix["diffUnified"]
    assert "+" in fix["diffUnified"]
    assert "validationSteps" in fix


def test_review_workflow_and_audit_history(client):
    user, token = create_user_and_session(client, email="alice.workflow@test.com", full_name="Alice Reviewer")
    headers = {"Authorization": f"Bearer {token}"}

    with get_db_connection() as conn:
        scan_id = f"scan_{uuid.uuid4().hex[:12]}"
        create_scan_record(conn, scan_id=scan_id, user_id=user["id"], provider="github", repository="org/workflow", branch="main")
        scan_result = {
            "debtScore": 88,
            "findingsCount": 1,
            "findings": [{
                "id": "find_wf_1",
                "ruleId": "REL-SILENT-EXCEPTION-SWALLOW",
                "title": "Swallowed Exception Block",
                "category": "reliability",
                "severity": "medium",
                "filePath": "src/tasks.py",
                "line": 20,
                "description": "Silent pass in except block",
            }],
        }
        save_scan_completion(conn, scan_id=scan_id, scan_result=scan_result)

    # 1. Transition open -> under_review
    resp1 = client.post("/api/findings/find_wf_1/review", json={"status": "under_review", "note": "Assigned to team lead"}, headers=headers)
    assert resp1.status_code == 200
    assert resp1.json()["review_status"] == "under_review"

    # 2. Transition under_review -> approved
    resp2 = client.post("/api/findings/find_wf_1/review", json={"status": "approved", "note": "Fix approach looks good"}, headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()["review_status"] == "approved"

    # 3. Invalid status check
    resp_invalid = client.post("/api/findings/find_wf_1/review", json={"status": "invalid_bogus_status"}, headers=headers)
    assert resp_invalid.status_code == 400

    # 4. Fetch history and verify audit trail
    hist_resp = client.get("/api/findings/find_wf_1/history", headers=headers)
    assert hist_resp.status_code == 200
    history = hist_resp.json()["history"]
    assert len(history) >= 2
    assert history[0]["action"] == "status_change"
    assert history[0]["to_status"] == "under_review"
    assert history[0]["user_name"] == "Alice Reviewer"
    assert history[1]["to_status"] == "approved"


def test_apply_fix_to_working_copy(client):
    user, token = create_user_and_session(client, email="alice.apply@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    with get_db_connection() as conn:
        scan_id = f"scan_{uuid.uuid4().hex[:12]}"
        create_scan_record(conn, scan_id=scan_id, user_id=user["id"], provider="github", repository="org/apply-app", branch="main")
        files = {
            "src/logging.py": "def handle():\n    try:\n        do_work()\n    except:\n        pass\n",
        }
        scan_result = {
            "debtScore": 90,
            "findingsCount": 1,
            "findings": [{
                "id": "find_apply_test",
                "ruleId": "REL-SILENT-EXCEPTION-SWALLOW",
                "title": "Silent Exception Swallow",
                "category": "reliability",
                "severity": "medium",
                "filePath": "src/logging.py",
                "line": 5,
                "description": "empty pass",
                "codeSnippet": {
                    "beforeLines": ["    try:", "        do_work()", "    except:"],
                    "vulnerableLine": "        pass",
                    "afterLines": [],
                },
                "remediationDiff": {
                    "removedLines": ["        pass"],
                    "addedLines": ["        logger.warning('Failed operation')"],
                },
                "verifiedFixAvailable": True,
            }],
        }
        save_scan_completion(conn, scan_id=scan_id, scan_result=scan_result, files_dict=files)

    # Apply fix
    resp = client.post("/api/findings/find_apply_test/apply-fix", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["review_status"] == "applied"
    assert "suggested_fix" in data

    # Verify file content in scan_files has updated
    file_resp = client.get(f"/api/scans/{scan_id}/file?path=src/logging.py", headers=headers)
    assert file_resp.status_code == 200
    assert "logger.warning('Failed operation')" in file_resp.json()["content"]


def test_contextual_ai_assistant_chat(client):
    user, token = create_user_and_session(client, email="alice.chat@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    with get_db_connection() as conn:
        scan_id = f"scan_{uuid.uuid4().hex[:12]}"
        create_scan_record(conn, scan_id=scan_id, user_id=user["id"], provider="github", repository="org/chat-app", branch="main")
        scan_result = {
            "debtScore": 75,
            "findingsCount": 1,
            "findings": [{
                "id": "find_chat_test",
                "ruleId": "SEC-HARDCODED-SECRET",
                "title": "Hardcoded Secret in Plaintext",
                "cwe": "CWE-798",
                "category": "security",
                "severity": "critical",
                "filePath": "config.js",
                "line": 10,
                "description": "Plaintext API key",
                "codeSnippet": {"beforeLines": [], "vulnerableLine": "const key = 'secret_12345';", "afterLines": []},
            }],
        }
        save_scan_completion(conn, scan_id=scan_id, scan_result=scan_result)

    # 1. Ask beginner question
    r1 = client.post("/api/findings/ai-chat", json={"finding_id": "find_chat_test", "question": "Explain this issue like I'm a beginner"}, headers=headers)
    assert r1.status_code == 200
    assert "Beginner" in r1.json()["answer"] or "key" in r1.json()["answer"]

    # 2. Ask priority question
    r2 = client.post("/api/findings/ai-chat", json={"scan_id": scan_id, "question": "Which issue should I fix first?"}, headers=headers)
    assert r2.status_code == 200
    assert "Critical" in r2.json()["answer"]

    # 3. Ask consequence question
    r3 = client.post("/api/findings/ai-chat", json={"finding_id": "find_chat_test", "question": "What are the consequences of ignoring this?"}, headers=headers)
    assert r3.status_code == 200
    assert "Consequences" in r3.json()["answer"] or "Impact" in r3.json()["answer"]


def test_repository_review_summary_and_trends(client):
    user, token = create_user_and_session(client, email="alice.summary@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    with get_db_connection() as conn:
        # Scan 1: initial scan
        s1 = f"scan_{uuid.uuid4().hex[:12]}"
        create_scan_record(conn, scan_id=s1, user_id=user["id"], provider="github", repository="org/trends", branch="main")
        r1 = {
            "debtScore": 70,
            "debtGrade": "C",
            "findingsCount": 5,
            "findings": [
                {"id": f"f_{i}", "ruleId": "MAINT-CONSOLE-LOG", "title": "Log", "category": "maintainability", "severity": "low", "filePath": f"file_{i}.js", "line": i}
                for i in range(1, 6)
            ],
        }
        save_scan_completion(conn, scan_id=s1, scan_result=r1)

        # Scan 2: subsequent scan with improvements
        s2 = f"scan_{uuid.uuid4().hex[:12]}"
        create_scan_record(conn, scan_id=s2, user_id=user["id"], provider="github", repository="org/trends", branch="main")
        r2 = {
            "debtScore": 88,
            "debtGrade": "B",
            "findingsCount": 2,
            "findings": [
                {"id": "f_sec", "ruleId": "SEC-AWS-KEY", "title": "AWS Key", "category": "security", "severity": "critical", "filePath": "deploy.sh", "line": 3},
                {"id": "f_rel", "ruleId": "REL-MUTABLE-DEFAULT-ARG", "title": "Mutable Arg", "category": "reliability", "severity": "medium", "filePath": "utils.py", "line": 8},
            ],
            "recommendedActions": ["Revoke and rotate AWS Key"],
        }
        save_scan_completion(conn, scan_id=s2, scan_result=r2)

    resp = client.get(f"/api/scans/{s2}/review-summary", headers=headers)
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["overallHealthScore"] == 88
    assert summary["debtGrade"] == "B"
    assert summary["totalFindings"] == 2
    assert summary["requiresReviewCount"] == 2
    assert len(summary["topSecurityIssues"]) == 1
    assert len(summary["topReliabilityIssues"]) == 1
    assert summary["changesSincePreviousScan"] is not None
    assert summary["changesSincePreviousScan"]["debtScoreDelta"] == 18
    assert summary["changesSincePreviousScan"]["findingsDelta"] == -3


def test_cross_user_isolation_for_ai_review(client):
    user_a, token_a = create_user_and_session(client, email="usera@isolation.com")
    user_b, token_b = create_user_and_session(client, email="userb@isolation.com")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    with get_db_connection() as conn:
        scan_a = f"scan_{uuid.uuid4().hex[:12]}"
        create_scan_record(conn, scan_id=scan_a, user_id=user_a["id"], provider="github", repository="usera/private", branch="main")
        save_scan_completion(conn, scan_id=scan_a, scan_result={
            "debtScore": 90,
            "findingsCount": 1,
            "findings": [{"id": "find_a_private", "ruleId": "SEC-AWS-KEY", "title": "Secret", "category": "security", "severity": "critical", "filePath": "main.py", "line": 1}],
        })

    # User B tries to access User A's file
    assert client.get(f"/api/scans/{scan_a}/file?path=main.py", headers=headers_b).status_code == 404
    # User B tries to explain User A's finding
    assert client.post("/api/findings/find_a_private/explain", headers=headers_b).status_code == 404
    # User B tries to review User A's finding
    assert client.post("/api/findings/find_a_private/review", json={"status": "approved"}, headers=headers_b).status_code == 404
    # User B tries to view review history
    assert client.get("/api/findings/find_a_private/history", headers=headers_b).status_code == 404
    # User B tries to apply fix
    assert client.post("/api/findings/find_a_private/apply-fix", headers=headers_b).status_code == 404
    # User B tries to get review summary
    assert client.get(f"/api/scans/{scan_a}/review-summary", headers=headers_b).status_code == 404
    # User B tries to get review summary
    assert client.get(f"/api/scans/{scan_a}/review-summary", headers=headers_b).status_code == 404
