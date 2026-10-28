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
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export interface BookingStatusHistoryItem {
  id: number;
  booking_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by_email: string;
  note: string | null;
  created_at: string;
}

export interface DemoBookingRecord {
  id: string;
  user_id: string | null;
  full_name: string;
  work_email: string;
  company: string | null;
  team_size: string;
  preferred_date: string;
  preferred_time: string;
  timezone: string;
  message: string | null;
  status: 'Pending' | 'Confirmed' | 'Rescheduled' | 'Cancelled' | 'Completed';
  admin_notes: string | null;
  confirmed_datetime: string | null;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Ownership verification lookup tool (demonstrates backend 403 Forbidden for another user's booking ID)
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
    if (!token) return;
    let isMounted = true;
    const loadInitial = async () => {
      try {
        const res = await fetch('/api/my/bookings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!isMounted) return;
        if (!res.ok) {
          setError(data.detail || 'Failed to load your demo bookings.');
        } else {
          setBookings(data.bookings || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to fetch demo bookings.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    void loadInitial();
    return () => {
      isMounted = false;
    };
  }, [token]);

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

  const getStatusBadgeStyle = (status: DemoBookingRecord['status']) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300';
      case 'Rescheduled':
        return 'bg-sky-500/15 border-sky-500/35 text-sky-300';
      case 'Completed':
        return 'bg-indigo-500/15 border-indigo-500/35 text-indigo-300';
      case 'Cancelled':
        return 'bg-red-500/15 border-red-500/35 text-red-300';
      case 'Pending':
      default:
        return 'bg-amber-500/15 border-amber-500/35 text-amber-300';
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
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
            Track the real-time status, confirmation details, and scheduling updates for your
            requested SilentGuard AI walkthroughs.
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

      {/* Error State */}
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
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isExpanded = expandedId === booking.id;
            return (
              <div key={booking.id} className="bento-card rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-white bg-white/[0.06] px-2.5 py-1 rounded-lg">
                        {booking.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-[11px] font-semibold ${getStatusBadgeStyle(
                          booking.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {booking.status === 'Pending'
                          ? 'Pending Review (Request Received)'
                          : booking.status}
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        Submitted {formatTimestamp(booking.created_at)}
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
                          {booking.company} ({booking.team_size})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                    className="bento-pill-input self-start inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Timeline & Notes'}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Confirmation / Rescheduling Banner */}
                {booking.confirmed_datetime || booking.admin_notes ? (
                  <div className="rounded-2xl border border-[#FF5722]/25 bg-[#FF5722]/[0.06] p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <CheckCircle2 className="h-4 w-4 text-[#FF5722]" />
                      <span>Scheduling &amp; Coordinator Update</span>
                    </div>
                    {booking.confirmed_datetime && (
                      <p className="text-xs text-zinc-200">
                        <span className="text-zinc-400">Confirmed Slot: </span>
                        <span className="font-mono font-semibold text-emerald-300">
                          {booking.confirmed_datetime}
                        </span>
                      </p>
                    )}
                    {booking.admin_notes && (
                      <p className="text-xs text-zinc-300">
                        <span className="text-zinc-400">Coordinator Note: </span>
                        {booking.admin_notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center justify-between text-xs text-zinc-400">
                    <span>
                      Status:{' '}
                      <strong className="text-zinc-200">
                        {booking.status === 'Pending'
                          ? 'Request received — awaiting coordinator confirmation'
                          : booking.status}
                      </strong>
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      Updated {formatTimestamp(booking.updated_at)}
                    </span>
                  </div>
                )}

                {/* Expandable Details & Audit History */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06] pt-4 space-y-4 text-xs">
                    {booking.message && (
                      <div>
                        <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                          Your Submitted Message / Notes
                        </span>
                        <p className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-zinc-300">
                          {booking.message}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-2">
                        Status Audit Trail
                      </span>
                      <div className="space-y-2">
                        {(booking.status_history || []).map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.02] border border-white/[0.05] px-3.5 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-[#FF5722]" />
                              <span className="font-semibold text-white">
                                {item.previous_status
                                  ? `${item.previous_status} → ${item.new_status}`
                                  : `Created (${item.new_status})`}
                              </span>
                              {item.note && (
                                <span className="text-zinc-400">— {item.note}</span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-zinc-500">
                              {formatTimestamp(item.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
              placeholder="Enter Booking ID (e.g. demo_...)"
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
              <strong>{lookupResult.booking.status}</strong> ({lookupResult.booking.preferred_date}{' '}
              {lookupResult.booking.preferred_time})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
