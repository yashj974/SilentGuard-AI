import os
import logging
import smtplib
from email.message import EmailMessage

logger = logging.getLogger("silentguard.notifications")


def _send_email(
    recipient: str,
    subject: str,
    body: str,
    booking_id: str,
    action_name: str,
) -> tuple[str, str]:
    smtp_host = os.environ.get("SMTP_HOST", "").strip()
    smtp_port = int(os.environ.get("SMTP_PORT", "587").strip() or "587")
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_password = os.environ.get("SMTP_PASSWORD", "").strip()
    smtp_from = os.environ.get("SMTP_FROM_EMAIL", smtp_user or "noreply@silentguard.ai").strip()

    if not smtp_host:
        logger.info(
            "Email notification skipped for booking %s (%s): SMTP_HOST is not configured. Dashboard reflects changes in real time.",
            booking_id,
            action_name,
        )
        return (
            "not_configured",
            f"Notification skipped: SMTP_HOST is not configured on this server. Status update for demo {booking_id} saved and visible in dashboard.",
        )

    if not recipient:
        return (
            "not_configured",
            f"Notification skipped: No recipient email address specified for booking {booking_id}.",
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp_from
    msg["To"] = recipient
    msg.set_content(body)

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
            "Email notification sent to %s for booking %s (%s)",
            recipient,
            booking_id,
            action_name,
        )
        return ("sent", f"Notification email delivered to {recipient}.")
    except Exception as exc:
        logger.error(
            "Failed to send %s notification email for booking %s to %s: %s",
            action_name,
            booking_id,
            recipient,
            str(exc),
        )
        return (
            "failed",
            f"Booking status saved in database, but email delivery encountered an SMTP error: {str(exc)}",
        )


def send_booking_received_notification(booking: dict) -> tuple[str, str]:
    """
    Notify both the user and administrator that a demo request was received.
    """
    admin_recipient = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "").strip()
    user_recipient = booking.get("work_email", "").strip()

    subject = f"[SilentGuard AI] Demo Request Received ({booking.get('id')})"
    body = f"""Hello {booking.get('full_name')},

Thank you for requesting a live demonstration of SilentGuard AI.

Booking ID: {booking.get('id')}
Requested Date: {booking.get('preferred_date')}
Requested Time: {booking.get('preferred_time')} ({booking.get('timezone')})
Organization: {booking.get('company') or 'N/A'}
Team Size: {booking.get('team_size') or 'N/A'}
Current Status: Pending Review

Please note: Your request has been received and saved. A SilentGuard coordinator will review your requested time slot and confirm or propose an alternate appointment shortly.

You can track your booking status directly in your SilentGuard dashboard under 'My Demo Bookings'.

Regards,
SilentGuard AI Team
"""
    # Send to user first (or admin if no user email)
    target = user_recipient or admin_recipient
    return _send_email(
        recipient=target,
        subject=subject,
        body=body,
        booking_id=booking.get("id", ""),
        action_name="received",
    )


def send_admin_booking_notification(booking: dict) -> tuple[str, str]:
    """Backward compatibility alias for booking creation notification."""
    return send_booking_received_notification(booking)


def send_booking_confirmed_notification(booking: dict) -> tuple[str, str]:
    user_recipient = booking.get("work_email", "").strip()
    confirmed_slot = (
        booking.get("confirmed_datetime")
        or f"{booking.get('preferred_date')} at {booking.get('preferred_time')} ({booking.get('timezone')})"
    )
    meeting_url = booking.get("meeting_url")
    notes = booking.get("admin_notes")

    subject = f"[SilentGuard AI] Demo Booking Confirmed ({booking.get('id')})"
    body = f"""Hello {booking.get('full_name')},

Great news! Your SilentGuard AI walkthrough has been confirmed.

Booking ID: {booking.get('id')}
Confirmed Slot: {confirmed_slot}
Organization: {booking.get('company') or 'N/A'}
{"Meeting URL: " + meeting_url if meeting_url else "Meeting Link: Will be provided in calendar invite"}
{"Coordinator Notes: " + notes if notes else ""}

Please have team members ready with any specific security and AST remediation questions.

Regards,
SilentGuard AI Team
"""
    return _send_email(
        recipient=user_recipient,
        subject=subject,
        body=body,
        booking_id=booking.get("id", ""),
        action_name="confirmed",
    )


def send_booking_rescheduled_notification(booking: dict) -> tuple[str, str]:
    user_recipient = booking.get("work_email", "").strip()
    orig_slot = f"{booking.get('preferred_date')} at {booking.get('preferred_time')} ({booking.get('timezone')})"
    proposed_slot = f"{booking.get('proposed_date')} at {booking.get('proposed_time')} ({booking.get('timezone')})"
    reason = booking.get("reschedule_reason") or booking.get("admin_notes") or "Schedule adjustment requested by coordinator."

    subject = f"[SilentGuard AI] Demo Booking Rescheduled ({booking.get('id')})"
    body = f"""Hello {booking.get('full_name')},

Your SilentGuard AI walkthrough request has been rescheduled.

Booking ID: {booking.get('id')}
Original Requested Slot: {orig_slot}
Proposed New Slot: {proposed_slot}
Reason: {reason}

Please log into your SilentGuard dashboard under 'My Demo Bookings' to accept or decline this proposed time.

Regards,
SilentGuard AI Team
"""
    return _send_email(
        recipient=user_recipient,
        subject=subject,
        body=body,
        booking_id=booking.get("id", ""),
        action_name="rescheduled",
    )


def send_booking_rejected_notification(booking: dict, reason: str) -> tuple[str, str]:
    user_recipient = booking.get("work_email", "").strip()
    subject = f"[SilentGuard AI] Update on Demo Request ({booking.get('id')})"
    body = f"""Hello {booking.get('full_name')},

Thank you for your interest in SilentGuard AI. Unfortunately, we are unable to accommodate your demo request at this time.

Booking ID: {booking.get('id')}
Reason: {reason}

If you have questions or would like to discuss enterprise custom engagements, please contact us.

Regards,
SilentGuard AI Team
"""
    return _send_email(
        recipient=user_recipient,
        subject=subject,
        body=body,
        booking_id=booking.get("id", ""),
        action_name="rejected",
    )


def send_booking_cancelled_notification(
    booking: dict, reason: str, cancelled_by: str
) -> tuple[str, str]:
    user_recipient = booking.get("work_email", "").strip()
    subject = f"[SilentGuard AI] Demo Booking Cancelled ({booking.get('id')})"
    body = f"""Hello {booking.get('full_name')},

Your demo booking ({booking.get('id')}) has been cancelled by {cancelled_by}.

Booking ID: {booking.get('id')}
Cancellation Reason: {reason or 'No reason provided.'}

If this was done in error or you wish to reschedule in the future, you may book a new demo at any time.

Regards,
SilentGuard AI Team
"""
    return _send_email(
        recipient=user_recipient,
        subject=subject,
        body=body,
        booking_id=booking.get("id", ""),
        action_name="cancelled",
    )
