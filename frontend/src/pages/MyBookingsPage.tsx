import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Clock,
  Globe,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Search,
  Video,
  XCircle,
  Check,
  Ban,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { formatBookingDateTime } from '../utils/dateUtils';

export interface BookingStatusHistoryItem {
  id: string;
  booking_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by_user_id?: string | null;
  changed_by_email: string;
  notes?: string | null;
  note?: string | null;
  changed_at?: string;
  created_at?: string;
}

export interface DemoBookingRecord {
  id: string;
  user_id: string | null;
  full_name: string;
  work_email: string;
  company: string | null;
  team_size: string | null;
  preferred_date: string;
  preferred_time: string;
  timezone: string;
  message: string | null;
  status: 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'rejected' | 'completed' | string;
  admin_notes: string | null;
  confirmed_datetime: string | null;
  meeting_url: string | null;
  confirmed_by_admin_id: string | null;
  confirmed_at: string | null;
  proposed_date: string | null;
  proposed_time: string | null;
  reschedule_reason: string | null;
  reschedule_status: string | null;
  rejection_reason: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  email_notification_status: string;
  created_at: string;
  updated_at: string;
  status_history?: BookingStatusHistoryItem[];
}

export const MyBookingsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<DemoBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Cancellation modal state
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');

  // Decline reschedule modal state
  const [decliningBookingId, setDecliningBookingId] = useState<string | null>(null);
  const [declineReasonInput, setDeclineReasonInput] = useState<string>('');

  // Ownership verification lookup tool
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    httpCode?: number;
    message?: string;
    booking?: DemoBookingRecord;
  }>({ status: 'idle' });

  const fetchMyBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/my/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to load your demo bookings.');
      }
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch demo bookings.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchMyBookings();
  }, [fetchMyBookings]);

  const handleLookupById = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lookupId.trim();
    if (!trimmed || !token) return;

    setLookupResult({ status: 'loading' });
    try {
      const res = await fetch(`/api/my/bookings/${encodeURIComponent(trimmed)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLookupResult({
          status: 'error',
          httpCode: res.status,
          message: data.detail || `Access denied (HTTP ${res.status})`,
        });
        return;
      }
      setLookupResult({
        status: 'success',
        httpCode: res.status,
        booking: data.booking,
        message: `Verified ownership for booking ${data.booking.id}`,
      });
    } catch (err) {
      setLookupResult({
        status: 'error',
        message: err instanceof Error ? err.message : 'Request failed',
      });
    }
  };

  const handleUserCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBookingId || !token) return;

    setActionLoadingId(cancellingBookingId);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/my/bookings/${encodeURIComponent(cancellingBookingId)}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cancellation_reason: cancelReasonInput.trim() || 'Cancelled by user via portal.',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to cancel booking.');
      }
      setActionFeedback({
        type: 'success',
        text: `Booking ${cancellingBookingId} has been cancelled successfully.`,
      });
      setCancellingBookingId(null);
      setCancelReasonInput('');
      await fetchMyBookings();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Cancellation failed.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptReschedule = async (bookingId: string) => {
    if (!token) return;
    setActionLoadingId(bookingId);
    setActionFeedback(null);
    try {
      const res = await fetch(
        `/api/my/bookings/${encodeURIComponent(bookingId)}/accept-reschedule`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to accept reschedule.');
      }
      setActionFeedback({
        type: 'success',
        text: `Proposed reschedule accepted! Demo ${bookingId} is now confirmed.`,
      });
      await fetchMyBookings();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to accept reschedule.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decliningBookingId || !token) return;

    setActionLoadingId(decliningBookingId);
    setActionFeedback(null);
    try {
      const res = await fetch(
        `/api/my/bookings/${encodeURIComponent(decliningBookingId)}/decline-reschedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: declineReasonInput.trim() || 'User declined proposed reschedule time.',
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to decline reschedule.');
      }
      setActionFeedback({
        type: 'success',
        text: `Reschedule declined. Booking ${decliningBookingId} has been cancelled.`,
      });
      setDecliningBookingId(null);
      setDeclineReasonInput('');
      await fetchMyBookings();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to decline reschedule.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300';
      case 'rescheduled':
        return 'bg-sky-500/15 border-sky-500/35 text-sky-300';
      case 'completed':
        return 'bg-indigo-500/15 border-indigo-500/35 text-indigo-300';
      case 'cancelled':
        return 'bg-red-500/15 border-red-500/35 text-red-300';
      case 'rejected':
        return 'bg-rose-500/15 border-rose-500/35 text-rose-300';
      case 'pending':
      default:
        return 'bg-amber-500/15 border-amber-500/35 text-amber-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'Confirmed Appointment';
      case 'rescheduled':
        return 'Rescheduled (Pending Acceptance)';
      case 'completed':
        return 'Completed Walkthrough';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Request Rejected';
      case 'pending':
      default:
        return 'Pending Review (Request Received)';
    }
  };

  const canUserCancel = (status: string) => {
    const s = status.toLowerCase();
    return s === 'pending' || s === 'confirmed' || s === 'rescheduled';
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF5722]">
              WALKTHROUGH SCHEDULING
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="font-mono text-[11px] text-zinc-400">
              Account: {user?.email}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            My Demo Bookings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Track real-time status, join confirmed walkthrough sessions, manage reschedule requests,
            and review full audit history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void fetchMyBookings()}
            className="bento-pill-input inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#FF5722]' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/book-demo"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF5722] hover:bg-[#e64a19] px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_-4px_rgba(255,87,34,0.5)] transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Book New Demo</span>
          </Link>
        </div>
      </div>

      {/* Global Alerts & Feedback */}
      {actionFeedback && (
        <div
          className={`flex items-start gap-2.5 rounded-2xl border p-4 text-xs ${
            actionFeedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {error && (
        <div className="bento-card rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="bento-card rounded-3xl p-10 text-center space-y-3">
          <div className="mx-auto h-7 w-7 rounded-full border-2 border-[#FF5722]/30 border-t-[#FF5722] animate-spin" />
          <p className="font-mono text-xs text-zinc-400">Loading your demo bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bento-card rounded-3xl p-10 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF5722]/15 text-[#FF5722]">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">No Demo Bookings Yet</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              You haven&apos;t submitted a live walkthrough request under{' '}
              <span className="text-zinc-200 font-mono">{user?.email}</span> yet. Schedule a session
              to review your codebase with a SilentGuard engineer.
            </p>
          </div>
          <div>
            <Link
              to="/book-demo"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF5722] hover:bg-[#e64a19] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-4px_rgba(255,87,34,0.5)] transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Schedule Your First Demo</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => {
            const isExpanded = expandedId === booking.id;
            const normStatus = (booking.status || 'pending').toLowerCase();
            const isRescheduled = normStatus === 'rescheduled';
            const isConfirmed = normStatus === 'confirmed';
            const isCancelled = normStatus === 'cancelled';
            const isRejected = normStatus === 'rejected';
            const isCompleted = normStatus === 'completed';

            return (
              <div key={booking.id} className="bento-card rounded-3xl p-5 sm:p-6 space-y-4">
                {/* Top Info Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-white bg-white/[0.06] px-2.5 py-1 rounded-lg">
                        {booking.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-[11px] font-semibold ${getStatusBadgeStyle(
                          normStatus
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {getStatusLabel(normStatus)}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        Submitted {formatBookingDateTime(booking.created_at, booking.timezone)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-[#FF5722]" />
                        <span className="font-semibold text-white">
                          Requested: {booking.preferred_date} at {booking.preferred_time}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
                        <Globe className="h-3.5 w-3.5 text-zinc-500" />
                        {booking.timezone}
                      </span>
                      {booking.company && (
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                          {booking.company} ({booking.team_size || 'Team'})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top Right Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {canUserCancel(normStatus) && (
                      <button
                        type="button"
                        onClick={() => setCancellingBookingId(booking.id)}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition-all cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                      className="bento-pill-input inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Audit Trail' : 'View Audit Trail'}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Reschedule Proposal Banner with Accept / Decline Buttons */}
                {isRescheduled && (
                  <div className="rounded-2xl border border-sky-500/35 bg-sky-500/[0.08] p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-sky-200">
                      <Clock className="h-4 w-4 text-sky-400" />
                      <span>Proposed Reschedule Time Awaiting Your Response</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Our coordinator has proposed a new appointment slot for your demonstration:{' '}
                      <strong className="text-sky-300 font-mono text-xs">
                        {booking.proposed_date} at {booking.proposed_time} ({booking.timezone})
                      </strong>
                      .
                      {booking.reschedule_reason && (
                        <span className="block mt-1 text-zinc-400">
                          Reason: <span className="text-zinc-200">{booking.reschedule_reason}</span>
                        </span>
                      )}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={actionLoadingId === booking.id}
                        onClick={() => void handleAcceptReschedule(booking.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept Proposed Time</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === booking.id}
                        onClick={() => setDecliningBookingId(booking.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Decline Proposed Time</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmed Slot & Meeting URL Banner */}
                {isConfirmed && (
                  <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/[0.08] p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Walkthrough Confirmed</span>
                      </div>
                      {booking.confirmed_at && (
                        <span className="font-mono text-[10px] text-zinc-400">
                          Confirmed on {formatBookingDateTime(booking.confirmed_at, booking.timezone)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-400">Confirmed Appointment: </span>
                        <span className="font-mono font-semibold text-emerald-300">
                          {booking.confirmed_datetime ||
                            `${booking.preferred_date} at ${booking.preferred_time} (${booking.timezone})`}
                        </span>
                      </div>

                      {booking.meeting_url && (
                        <div>
                          <span className="text-zinc-400">Meeting Room: </span>
                          <a
                            href={booking.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-emerald-300 hover:underline"
                          >
                            <Video className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Join Demo Meeting</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {booking.admin_notes && (
                      <p className="text-xs text-zinc-300 pt-1 border-t border-emerald-500/20">
                        <span className="text-zinc-400">Coordinator Notes: </span>
                        {booking.admin_notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Rejection Alert */}
                {isRejected && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] p-4 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-rose-300">
                      <Ban className="h-4 w-4 text-rose-400" />
                      <span>Demo Request Rejected</span>
                    </div>
                    <p className="text-zinc-300">
                      <span className="text-zinc-400">Reason: </span>
                      {booking.rejection_reason || 'No specific reason provided.'}
                    </p>
                    {booking.admin_notes && (
                      <p className="text-zinc-400">
                        <span className="text-zinc-500">Coordinator Note: </span>
                        {booking.admin_notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Cancellation Alert */}
                {isCancelled && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold text-red-300">
                        <XCircle className="h-4 w-4 text-red-400" />
                        <span>Demo Cancelled</span>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400">
                        Cancelled by {booking.cancelled_by === 'admin' ? 'Administrator' : 'Requester'}
                      </span>
                    </div>
                    {booking.cancellation_reason && (
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Reason: </span>
                        {booking.cancellation_reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Completed Banner */}
                {isCompleted && (
                  <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.08] p-4 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-indigo-300">
                      <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                      <span>Demo Completed</span>
                    </div>
                    <p className="text-zinc-300">
                      This walkthrough session has been conducted. Thank you for evaluating SilentGuard AI!
                    </p>
                  </div>
                )}

                {/* Pending State Banner */}
                {normStatus === 'pending' && (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                    <span>
                      Status:{' '}
                      <strong className="text-amber-300">
                        Request received — awaiting coordinator review and slot confirmation
                      </strong>
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      Last Updated: {formatBookingDateTime(booking.updated_at, booking.timezone)}
                    </span>
                  </div>
                )}

                {/* Notification Delivery Notice */}
                {booking.email_notification_status === 'not_configured' && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3.5 py-2 flex items-center gap-2 text-[11px] text-zinc-400">
                    <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>
                      Email notification delivery is not configured on this server. Your booking updates are
                      reflected in real time directly inside this dashboard.
                    </span>
                  </div>
                )}

                {/* Expandable Details & Full Audit Trail */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06] pt-4 space-y-4 text-xs">
                    {booking.message && (
                      <div>
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                          Your Submitted Message / Additional Requirements
                        </span>
                        <p className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-zinc-300">
                          {booking.message}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-2">
                        Complete Status Audit Trail
                      </span>
                      <div className="space-y-2">
                        {(booking.status_history || []).map((item) => {
                          const itemTime = item.changed_at || item.created_at;
                          const noteText = item.notes || item.note;
                          return (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.02] border border-white/[0.05] px-3.5 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-[#FF5722]" />
                                <span className="font-semibold text-white capitalize">
                                  {item.previous_status
                                    ? `${item.previous_status} → ${item.new_status}`
                                    : `Created (${item.new_status})`}
                                </span>
                                {noteText && (
                                  <span className="text-zinc-400">— {noteText}</span>
                                )}
                              </div>
                              <span className="font-mono text-[11px] text-zinc-500">
                                {formatBookingDateTime(itemTime, booking.timezone)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* User Cancel Booking Dialog Modal */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bento-card w-full max-w-md rounded-3xl p-6 space-y-4 border border-white/10 bg-[#16161a]">
            <div className="flex items-center gap-2 text-sm font-bold text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span>Cancel Demo Booking</span>
            </div>
            <p className="text-xs text-zinc-300">
              Are you sure you want to cancel demo booking{' '}
              <strong className="text-white font-mono">{cancellingBookingId}</strong>? Please provide a
              reason so our team can follow up appropriately.
            </p>

            <form onSubmit={handleUserCancel} className="space-y-3 pt-1">
              <textarea
                rows={3}
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="Reason for cancellation (e.g. scheduling conflict, project postponed)..."
                className="bento-pill-input w-full rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancellingBookingId(null);
                    setCancelReasonInput('');
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === cancellingBookingId}
                  className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === cancellingBookingId ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Reschedule Modal */}
      {decliningBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bento-card w-full max-w-md rounded-3xl p-6 space-y-4 border border-white/10 bg-[#16161a]">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
              <XCircle className="h-4 w-4 text-[#FF5722]" />
              <span>Decline Proposed Reschedule</span>
            </div>
            <p className="text-xs text-zinc-300">
              Declining this proposed time slot will cancel booking{' '}
              <strong className="text-white font-mono">{decliningBookingId}</strong>. You may provide a
              note if you wish to suggest an alternative time in the future.
            </p>

            <form onSubmit={handleDeclineReschedule} className="space-y-3 pt-1">
              <textarea
                rows={3}
                value={declineReasonInput}
                onChange={(e) => setDeclineReasonInput(e.target.value)}
                placeholder="Optional reason or preferred availability..."
                className="bento-pill-input w-full rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDecliningBookingId(null);
                    setDeclineReasonInput('');
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === decliningBookingId}
                  className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === decliningBookingId ? 'Submitting...' : 'Decline & Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ownership Isolation Verification Panel */}
      <div className="bento-card rounded-3xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <ShieldAlert className="h-4 w-4 text-[#FF5722]" />
          <span>Booking ID Lookup &amp; Ownership Verification</span>
        </div>
        <p className="text-xs text-zinc-400">
          Look up a specific booking by ID via{' '}
          <code className="font-mono text-zinc-300">GET /api/my/bookings/&#123;id&#125;</code>. The
          backend enforces strict user ownership and returns <code className="font-mono">403 Forbidden</code>{' '}
          if you request another user&apos;s booking ID.
        </p>

        <form onSubmit={handleLookupById} className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Enter Booking ID (e.g. req_...)"
              className="bento-pill-input w-full h-10 rounded-xl pl-10 pr-4 text-xs text-white font-mono placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={lookupResult.status === 'loading'}
            className="rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            {lookupResult.status === 'loading' ? 'Verifying...' : 'Verify Booking ID'}
          </button>
        </form>

        {lookupResult.status === 'error' && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>
              {lookupResult.httpCode ? `[HTTP ${lookupResult.httpCode}] ` : ''}
              {lookupResult.message}
            </span>
          </div>
        )}

        {lookupResult.status === 'success' && lookupResult.booking && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-200 flex items-center justify-between">
            <span>
              {lookupResult.message} — Status:{' '}
              <strong className="capitalize">{lookupResult.booking.status}</strong> ({lookupResult.booking.preferred_date}{' '}
              {lookupResult.booking.preferred_time})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
