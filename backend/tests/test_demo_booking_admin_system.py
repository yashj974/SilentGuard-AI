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


def _create_user(client: TestClient, full_name: str, email: str, password: str = "TestPass123!") -> tuple[dict, str]:
    res = client.post(
        "/api/auth/signup",
        json={"full_name": full_name, "email": email, "password": password},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    return data["user"], data["token"]


def _get_admin_token(client: TestClient) -> str:
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@silentguard.ai", "password": "Admin@SilentGuard2026!"},
    )
    assert res.status_code == 200, res.text
    return res.json()["token"]


def test_new_booking_creation_pending_default(client: TestClient):
    _, token = _create_user(client, "John Doe", "john@enterprise.com")
    res = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "full_name": "John Doe",
            "work_email": "john@enterprise.com",
            "company": "Enterprise Tech",
            "team_size": "20-50",
            "preferred_date": "2026-11-15",
            "preferred_time": "10:30",
            "timezone": "America/New_York",
            "message": "Focus on SARIF and container security.",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "received"
    booking = data["booking"]
    assert booking["status"] == "pending"
    assert booking["email_notification_status"] == "not_configured"
    assert len(booking["status_history"]) == 1
    first_hist = booking["status_history"][0]
    assert first_hist["new_status"] == "pending"
    assert first_hist["changed_at"] is not None
    assert first_hist["created_at"] is not None
    assert "Initial demo request" in first_hist["notes"]


def test_admin_confirm_booking(client: TestClient):
    _, user_token = _create_user(client, "Jane Dev", "jane@company.com")
    admin_token = _get_admin_token(client)

    # Submit booking
    book_res = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "full_name": "Jane Dev",
            "work_email": "jane@company.com",
            "company": "Company Inc",
            "preferred_date": "2026-11-20",
            "preferred_time": "14:00",
            "timezone": "Europe/London",
        },
    )
    b_id = book_res.json()["booking"]["id"]

    # Non-admin cannot confirm
    non_admin_res = client.post(
        f"/api/admin/bookings/{b_id}/confirm",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"meeting_url": "https://meet.google.com/xyz"},
    )
    assert non_admin_res.status_code == 403

    # Admin confirms booking
    confirm_res = client.post(
        f"/api/admin/bookings/{b_id}/confirm",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "confirmed_datetime": "2026-11-20 14:00 (Europe/London)",
            "meeting_url": "https://meet.google.com/sg-demo-123",
            "admin_notes": "Assigned Solutions Architect Dave M.",
        },
    )
    assert confirm_res.status_code == 200
    confirmed_b = confirm_res.json()["booking"]
    assert confirmed_b["status"] == "confirmed"
    assert confirmed_b["meeting_url"] == "https://meet.google.com/sg-demo-123"
    assert confirmed_b["confirmed_at"] is not None
    assert confirmed_b["confirmed_by_admin_id"] is not None
    assert "Dave M." in confirmed_b["admin_notes"]
    assert len(confirmed_b["status_history"]) == 2
    assert confirmed_b["status_history"][0]["new_status"] == "confirmed"

    # User sees confirmed details in /api/my/bookings/{id}
    my_res = client.get(
        f"/api/my/bookings/{b_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert my_res.status_code == 200
    my_b = my_res.json()["booking"]
    assert my_b["status"] == "confirmed"
    assert my_b["meeting_url"] == "https://meet.google.com/sg-demo-123"


def test_admin_reschedule_and_user_accept_decline(client: TestClient):
    _, user_token = _create_user(client, "Sam Architect", "sam@startup.io")
    admin_token = _get_admin_token(client)

    book_res = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "full_name": "Sam Architect",
            "work_email": "sam@startup.io",
            "preferred_date": "2026-11-22",
            "preferred_time": "09:00",
            "timezone": "UTC",
        },
    )
    b_id = book_res.json()["booking"]["id"]

    # Admin reschedules
    reschedule_res = client.post(
        f"/api/admin/bookings/{b_id}/reschedule",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "proposed_date": "2026-11-23",
            "proposed_time": "15:00",
            "reschedule_reason": "Conflict with engineering security summit.",
            "admin_notes": "Moved to next afternoon.",
        },
    )
    assert reschedule_res.status_code == 200
    rescheduled_b = reschedule_res.json()["booking"]
    assert rescheduled_b["status"] == "rescheduled"
    assert rescheduled_b["preferred_date"] == "2026-11-22"  # original untouched
    assert rescheduled_b["proposed_date"] == "2026-11-23"
    assert rescheduled_b["proposed_time"] == "15:00"
    assert rescheduled_b["reschedule_status"] == "pending_user_acceptance"

    # User accepts reschedule
    accept_res = client.post(
        f"/api/my/bookings/{b_id}/accept-reschedule",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert accept_res.status_code == 200
    accepted_b = accept_res.json()["booking"]
    assert accepted_b["status"] == "confirmed"
    assert accepted_b["reschedule_status"] == "accepted"
    assert accepted_b["preferred_date"] == "2026-11-23"
    assert accepted_b["preferred_time"] == "15:00"

    # Test decline workflow on a second booking
    book_res2 = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "full_name": "Sam Architect",
            "work_email": "sam@startup.io",
            "preferred_date": "2026-11-25",
            "preferred_time": "11:00",
            "timezone": "UTC",
        },
    )
    b2_id = book_res2.json()["booking"]["id"]

    client.post(
        f"/api/admin/bookings/{b2_id}/reschedule",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "proposed_date": "2026-11-28",
            "proposed_time": "16:00",
            "reschedule_reason": "Holiday on requested day.",
        },
    )

    decline_res = client.post(
        f"/api/my/bookings/{b2_id}/decline-reschedule",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"reason": "Proposed date does not work for our leadership team."},
    )
    assert decline_res.status_code == 200
    declined_b = decline_res.json()["booking"]
    assert declined_b["status"] == "cancelled"
    assert declined_b["reschedule_status"] == "declined"
    assert "leadership team" in (declined_b["cancellation_reason"] or "")


def test_admin_reject_booking(client: TestClient):
    _, user_token = _create_user(client, "Spam Requester", "spam@tempmail.com")
    admin_token = _get_admin_token(client)

    book_res = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "full_name": "Spam Requester",
            "work_email": "spam@tempmail.com",
            "preferred_date": "2026-11-18",
            "preferred_time": "10:00",
            "timezone": "UTC",
        },
    )
    b_id = book_res.json()["booking"]["id"]

    # Reject without reason fails
    res_bad = client.post(
        f"/api/admin/bookings/{b_id}/reject",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"rejection_reason": ""},
    )
    assert res_bad.status_code == 400

    # Reject with substantive reason
    res_ok = client.post(
        f"/api/admin/bookings/{b_id}/reject",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"rejection_reason": "Disposable email domain not supported for enterprise pilot."},
    )
    assert res_ok.status_code == 200
    rejected_b = res_ok.json()["booking"]
    assert rejected_b["status"] == "rejected"
    assert "Disposable email" in rejected_b["rejection_reason"]

    # User can see the rejection reason
    my_res = client.get(
        f"/api/my/bookings/{b_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert my_res.status_code == 200
    assert "Disposable email" in my_res.json()["booking"]["rejection_reason"]


def test_cancellation_user_and_admin(client: TestClient):
    _, user_a = _create_user(client, "User A", "usera@cancel.com")
    _, user_b = _create_user(client, "User B", "userb@cancel.com")
    admin_token = _get_admin_token(client)

    # User A booking
    book_a = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {user_a}"},
        json={
            "full_name": "User A",
            "work_email": "usera@cancel.com",
            "preferred_date": "2026-11-20",
            "preferred_time": "12:00",
            "timezone": "UTC",
        },
    ).json()["booking"]

    # User B cannot cancel User A's booking
    res_steal_cancel = client.post(
        f"/api/my/bookings/{book_a['id']}/cancel",
        headers={"Authorization": f"Bearer {user_b}"},
        json={"cancellation_reason": "Malicious attempt"},
    )
    assert res_steal_cancel.status_code == 403

    # User A cancels own booking
    res_user_cancel = client.post(
        f"/api/my/bookings/{book_a['id']}/cancel",
        headers={"Authorization": f"Bearer {user_a}"},
        json={"cancellation_reason": "No longer needed, budget delayed."},
    )
    assert res_user_cancel.status_code == 200
    cancelled_b = res_user_cancel.json()["booking"]
    assert cancelled_b["status"] == "cancelled"
    assert cancelled_b["cancelled_by"] == "user"
    assert "budget delayed" in cancelled_b["cancellation_reason"]

    # User A cannot cancel an already cancelled booking
    res_cancel_again = client.post(
        f"/api/my/bookings/{book_a['id']}/cancel",
        headers={"Authorization": f"Bearer {user_a}"},
    )
    assert res_cancel_again.status_code == 400

    # Admin cancellation test on a fresh booking
    book_b = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {user_b}"},
        json={
            "full_name": "User B",
            "work_email": "userb@cancel.com",
            "preferred_date": "2026-11-21",
            "preferred_time": "14:00",
            "timezone": "UTC",
        },
    ).json()["booking"]

    res_admin_cancel = client.post(
        f"/api/admin/bookings/{book_b['id']}/cancel",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"cancellation_reason": "Staffing emergency at SilentGuard."},
    )
    assert res_admin_cancel.status_code == 200
    admin_cancelled = res_admin_cancel.json()["booking"]
    assert admin_cancelled["status"] == "cancelled"
    assert admin_cancelled["cancelled_by"] == "admin"
    assert "Staffing emergency" in admin_cancelled["cancellation_reason"]


def test_admin_complete_booking(client: TestClient):
    _, user_token = _create_user(client, "Lead Engineer", "lead@company.com")
    admin_token = _get_admin_token(client)

    book = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "full_name": "Lead Engineer",
            "work_email": "lead@company.com",
            "preferred_date": "2026-11-20",
            "preferred_time": "15:00",
            "timezone": "UTC",
        },
    ).json()["booking"]

    # Cannot complete while pending
    res_early_complete = client.post(
        f"/api/admin/bookings/{book['id']}/complete",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_early_complete.status_code == 400

    # Confirm first
    client.post(
        f"/api/admin/bookings/{book['id']}/confirm",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Now mark completed
    res_complete = client.post(
        f"/api/admin/bookings/{book['id']}/complete",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"admin_notes": "Walkthrough conducted successfully with 8 engineers."},
    )
    assert res_complete.status_code == 200
    completed_b = res_complete.json()["booking"]
    assert completed_b["status"] == "completed"
    assert completed_b["completed_at"] is not None

    # Cannot transition out of completed (terminal state)
    res_reconfirm = client.post(
        f"/api/admin/bookings/{book['id']}/confirm",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_reconfirm.status_code == 400


def test_admin_search_and_filters_and_kpis(client: TestClient):
    admin_token = _get_admin_token(client)
    _, t1 = _create_user(client, "Acme User", "acme@acme.com")
    _, t2 = _create_user(client, "Beta User", "beta@beta.com")

    # Create Acme booking
    b1 = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {t1}"},
        json={
            "full_name": "Acme User",
            "work_email": "acme@acme.com",
            "company": "Acme Widgets",
            "preferred_date": "2026-11-10",
            "preferred_time": "10:00",
            "timezone": "UTC",
        },
    ).json()["booking"]

    # Create Beta booking
    b2 = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {t2}"},
        json={
            "full_name": "Beta User",
            "work_email": "beta@beta.com",
            "company": "Beta Soft",
            "preferred_date": "2026-11-12",
            "preferred_time": "14:00",
            "timezone": "UTC",
        },
    ).json()["booking"]

    # Confirm Acme booking
    client.post(
        f"/api/admin/bookings/{b1['id']}/confirm",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # 1. Check KPI counts
    res_all = client.get(
        "/api/admin/bookings",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_all.status_code == 200
    counts = res_all.json()["counts"]
    assert counts["total"] >= 2
    assert counts["confirmed"] >= 1
    assert counts["pending"] >= 1

    # 2. Filter by status=confirmed
    res_conf = client.get(
        "/api/admin/bookings?status=confirmed",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_conf.status_code == 200
    for b in res_conf.json()["bookings"]:
        assert b["status"] == "confirmed"

    # 3. Filter by organization=Acme
    res_org = client.get(
        "/api/admin/bookings?organization=Acme",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_org.status_code == 200
    assert any(b["id"] == b1["id"] for b in res_org.json()["bookings"])
    assert not any(b["id"] == b2["id"] for b in res_org.json()["bookings"])

    # 4. Filter by email=beta@beta.com
    res_email = client.get(
        "/api/admin/bookings?email=beta@beta.com",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_email.status_code == 200
    assert len(res_email.json()["bookings"]) == 1
    assert res_email.json()["bookings"][0]["id"] == b2["id"]

    # 5. Filter by date=2026-11-10
    res_date = client.get(
        "/api/admin/bookings?date=2026-11-10",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_date.status_code == 200
    assert len(res_date.json()["bookings"]) == 1
    assert res_date.json()["bookings"][0]["id"] == b1["id"]


def test_email_notifications_all_events_and_graceful_fallback(client: TestClient):
    _, user_token = _create_user(client, "Notification User", "notif@user.com")
    admin_token = _get_admin_token(client)

    # When SMTP is configured, test send calls
    os.environ["SMTP_HOST"] = "smtp.test.com"
    os.environ["ADMIN_NOTIFICATION_EMAIL"] = "admin@silentguard.ai"

    with patch("smtplib.SMTP") as mock_smtp:
        inst = MagicMock()
        mock_smtp.return_value.__enter__.return_value = inst

        # 1. Received
        r1 = client.post(
            "/api/demo-requests",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "full_name": "Notification User",
                "work_email": "notif@user.com",
                "preferred_date": "2026-11-20",
                "preferred_time": "10:00",
                "timezone": "UTC",
            },
        )
        assert r1.status_code == 200
        assert r1.json()["email_notification_status"] == "sent"
        b_id = r1.json()["booking"]["id"]

        # 2. Confirmed
        r2 = client.post(
            f"/api/admin/bookings/{b_id}/confirm",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"meeting_url": "https://meet.jit.si/sg-demo"},
        )
        assert r2.status_code == 200
        assert r2.json()["email_notification_status"] == "sent"

        # 3. Rescheduled
        r3 = client.post(
            f"/api/admin/bookings/{b_id}/reschedule",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"proposed_date": "2026-11-22", "proposed_time": "16:00"},
        )
        assert r3.status_code == 200
        assert r3.json()["email_notification_status"] == "sent"

        # 4. Cancelled by user
        r4 = client.post(
            f"/api/my/bookings/{b_id}/cancel",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"cancellation_reason": "No longer needed."},
        )
        assert r4.status_code == 200
        assert r4.json()["email_notification_status"] == "sent"

    # Now test when SMTP is NOT configured: must succeed with status 'not_configured'
    os.environ.pop("SMTP_HOST", None)
    r_unconf = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "full_name": "Notification User",
            "work_email": "notif@user.com",
            "preferred_date": "2026-11-25",
            "preferred_time": "11:00",
            "timezone": "UTC",
        },
    )
    assert r_unconf.status_code == 200
    assert r_unconf.json()["email_notification_status"] == "not_configured"


def test_audit_trail_timestamps_and_fallbacks(client: TestClient):
    _, user_token = _create_user(client, "Audit Tester", "audit@test.com")
    admin_token = _get_admin_token(client)

    res = client.post(
        "/api/demo-requests",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "full_name": "Audit Tester",
            "work_email": "audit@test.com",
            "preferred_date": "2026-11-20",
            "preferred_time": "10:00",
            "timezone": "America/New_York",
        },
    )
    b_id = res.json()["booking"]["id"]

    # History item must have both changed_at and created_at and notes
    hist = res.json()["booking"]["status_history"]
    assert len(hist) >= 1
    for h in hist:
        assert h["changed_at"] is not None
        assert h["created_at"] is not None
        assert h["changed_at"] == h["created_at"]
        assert "Initial demo request" in (h.get("notes") or h.get("note") or "")

    # Perform an update
    client.post(
        f"/api/admin/bookings/{b_id}/confirm",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"meeting_url": "https://meet.google.com/test"},
    )

    get_res = client.get(
        f"/api/my/bookings/{b_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    hist2 = get_res.json()["booking"]["status_history"]
    assert len(hist2) == 2
    for h in hist2:
        assert h["changed_at"] is not None
        assert h["created_at"] is not None
        assert h["new_status"] in ("pending", "confirmed")

