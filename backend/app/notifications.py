import os
import logging
import smtplib
from email.message import EmailMessage

logger = logging.getLogger("silentguard.notifications")


def send_admin_booking_notification(booking: dict) -> tuple[str, str]:
    """
    Notify the configured admin email address when a demo booking is created.
    Never exposes credentials. If SMTP is not configured, logs a warning and
    returns ('not_configured', ...).
    """
    smtp_host = os.environ.get("SMTP_HOST", "").strip()
    smtp_port = int(os.environ.get("SMTP_PORT", "587").strip() or "587")
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_password = os.environ.get("SMTP_PASSWORD", "").strip()
    smtp_from = os.environ.get("SMTP_FROM_EMAIL", smtp_user or "noreply@silentguard.ai").strip()
    admin_recipient = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "").strip()

    if not smtp_host or not admin_recipient:
        logger.warning(
            "Admin email notification skipped for booking %s: SMTP_HOST or ADMIN_NOTIFICATION_EMAIL is not configured. Booking is saved in the database and visible in Admin Demo Requests.",
            booking.get("id"),
        )
        return (
            "not_configured",
            "Booking saved in database and visible in Admin Demo Requests. Email notification skipped because SMTP_HOST / ADMIN_NOTIFICATION_EMAIL is not configured.",
        )

    msg = EmailMessage()
    msg["Subject"] = f"[SilentGuard AI] New Demo Booking Request ({booking.get('id')})"
    msg["From"] = smtp_from
    msg["To"] = admin_recipient
    msg.set_content(
        f"""A new demo booking request has been saved in SilentGuard AI.

Booking ID: {booking.get('id')}
Requester Name: {booking.get('full_name')}
Work Email: {booking.get('work_email')}
Organization: {booking.get('company') or 'N/A'}
Team Size: {booking.get('team_size') or 'N/A'}
Requested Date/Time: {booking.get('preferred_date')} at {booking.get('preferred_time')} ({booking.get('timezone')})
Status: {booking.get('status')}
Message: {booking.get('message') or 'None'}
Submitted At: {booking.get('created_at')}
"""
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            if smtp_port in (587, 2525):
                server.starttls()
                server.ehlo()
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(msg)

        logger.info(
            "Admin notification email sent to %s for booking %s",
            admin_recipient,
            booking.get("id"),
        )
        return ("sent", "Admin notification email delivered.")
    except Exception as exc:
        logger.error(
            "Failed to send admin notification email for booking %s: %s",
            booking.get("id"),
            str(exc),
        )
        return (
            "failed",
            "Booking saved in database and visible in Admin Demo Requests. Email delivery encountered an SMTP error (logged on server).",
        )
