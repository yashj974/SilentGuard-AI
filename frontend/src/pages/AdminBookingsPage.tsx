import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  CalendarClock,
  Mail,
  Building2,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import type { DemoBookingRecord } from './MyBookingsPage';

const STATUS_OPTIONS: Array<DemoBookingRecord['status']> = [
  'Pending',
  'Confirmed',
  'Rescheduled',
  'Cancelled',
  'Completed',
];

export const AdminBookingsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<DemoBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedBooking, setSelectedBooking] = useState<DemoBookingRecord | null>(null);
  const [editStatus, setEditStatus] = useState<DemoBookingRecord['status']>('Pending');
  const [editConfirmedDatetime, setEditConfirmedDatetime] = useState<string>('');
  const [editAdminNotes, setEditAdminNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchAdminBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') {
        params.set('status', statusFilter);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      const queryString = params.toString();
      const url = `/api/admin/bookings${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to load bookings (HTTP ${res.status})`);
      }
      const data = await res.json();
      const loaded: DemoBookingRecord[] = data.bookings || [];
      setBookings(loaded);

      if (selectedBooking) {
        const refreshed = loaded.find((b) => b.id === selectedBooking.id);
        if (refreshed) {
          setSelectedBooking(refreshed);
        }
      } else if (loaded.length > 0) {
        const first = loaded[0];
        setSelectedBooking(first);
        setEditStatus(first.status);
        setEditConfirmedDatetime(first.confirmed_datetime ?? '');
        setEditAdminNotes(first.admin_notes ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch admin demo requests.');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, searchQuery, selectedBooking]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const loadBookings = async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'All') {
          params.set('status', statusFilter);
        }
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }
        const queryString = params.toString();
        const url = `/api/admin/bookings${queryString ? `?${queryString}` : ''}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!isMounted) return;
        if (!res.ok) {
          setError(data.detail || `Failed to load bookings (HTTP ${res.status})`);
        } else {
          const loaded: DemoBookingRecord[] = data.bookings || [];
          setBookings(loaded);
          setSelectedBooking((prev) => {
            if (prev) {
              const refreshed = loaded.find((b) => b.id === prev.id);
              if (refreshed) return refreshed;
            }
            if (loaded.length > 0) {
              const first = loaded[0];
              setEditStatus(first.status);
              setEditConfirmedDatetime(first.confirmed_datetime ?? '');
              setEditAdminNotes(first.admin_notes ?? '');
              return first;
            }
            return null;
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to fetch admin demo requests.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    void loadBookings();
    return () => {
      isMounted = false;
    };
  }, [token, statusFilter, searchQuery]);

  const handleSelectBooking = (booking: DemoBookingRecord) => {
    setSelectedBooking(booking);
    setEditStatus(booking.status);
    setEditConfirmedDatetime(booking.confirmed_datetime ?? '');
    setEditAdminNotes(booking.admin_notes ?? '');
    setUpdateFeedback(null);
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !token) return;
    setIsUpdating(true);
    setUpdateFeedback(null);

    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(selectedBooking.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: editStatus,
          confirmed_datetime: editConfirmedDatetime.trim() || null,
          admin_notes: editAdminNotes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update demo booking.');
      }

      const updated: DemoBookingRecord = data.booking;
      setSelectedBooking(updated);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setUpdateFeedback({
        type: 'success',
        text: `Booking ${updated.id} updated to "${updated.status}" and saved to database.`,
      });
    } catch (err) {
      setUpdateFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update booking.',
      });
    } finally {
      setIsUpdating(false);
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

  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'Pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const completedOrRescheduledCount = bookings.filter(
    (b) => b.status === 'Completed' || b.status === 'Rescheduled'
  ).length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5722]/15 border border-[#FF5722]/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#FF5722]">
              <ShieldCheck className="h-3 w-3" />
              ADMINISTRATION CONSOLE
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              Signed in as {user?.email}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Incoming Demo Requests
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Review incoming customer walkthrough requests, coordinate scheduling slots, record
            coordinator notes, and update booking statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchAdminBookings()}
          className="bento-pill-input self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#FF5722]' : ''}`} />
          <span>Refresh Requests</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card rounded-3xl p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            Matching Requests
          </span>
          <div className="mt-1 text-2xl font-bold text-white">{totalCount}</div>
          <span className="text-[11px] text-zinc-500">Persisted in SQLite database</span>
        </div>
        <div className="bento-card rounded-3xl p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
            Pending Review
          </span>
          <div className="mt-1 text-2xl font-bold text-amber-300">{pendingCount}</div>
          <span className="text-[11px] text-zinc-500">Awaiting slot confirmation</span>
        </div>
        <div className="bento-card rounded-3xl p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300">
            Confirmed Appointments
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-300">{confirmedCount}</div>
          <span className="text-[11px] text-zinc-500">Scheduled with engineering</span>
        </div>
        <div className="bento-card rounded-3xl p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-sky-300">
            Rescheduled / Completed
          </span>
          <div className="mt-1 text-2xl font-bold text-sky-300">{completedOrRescheduledCount}</div>
          <span className="text-[11px] text-zinc-500">Updated lifecycle states</span>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="bento-card rounded-3xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by requester name, email, company, or booking ID..."
            className="bento-pill-input w-full h-10 rounded-xl pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', ...STATUS_OPTIONS] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 font-mono text-[11px] transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-[#FF5722] text-white font-semibold shadow-xs'
                  : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bento-card rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Master-Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Requests */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="bento-card rounded-3xl p-10 text-center space-y-3">
              <div className="mx-auto h-7 w-7 rounded-full border-2 border-[#FF5722]/30 border-t-[#FF5722] animate-spin" />
              <p className="font-mono text-xs text-zinc-400">Loading demo requests...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bento-card rounded-3xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-white">No matching demo requests</p>
              <p className="text-xs text-zinc-400">
                Try clearing the search query or switching the status filter to &ldquo;All&rdquo;.
              </p>
            </div>
          ) : (
            bookings.map((booking) => {
              const isSelected = selectedBooking?.id === booking.id;
              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => handleSelectBooking(booking)}
                  className={`bento-card w-full text-left rounded-3xl p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-1 ring-[#FF5722] bg-[#FF5722]/[0.04]'
                      : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#FF5722]">
                        {booking.id}
                      </span>
                      <span className="text-sm font-bold text-white">{booking.full_name}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${getStatusBadgeStyle(
                        booking.status
                      )}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {booking.status}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate text-zinc-300">{booking.work_email}</span>
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <Building2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">
                        {booking.company || 'No org'} • {booking.team_size}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-[#FF5722] shrink-0" />
                      <span className="text-zinc-200 font-medium">
                        {booking.preferred_date} @ {booking.preferred_time}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Globe className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{booking.timezone}</span>
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-zinc-500">
                    <span>Submitted: {new Date(booking.created_at).toLocaleString()}</span>
                    <span>
                      Email Alert:{' '}
                      <strong
                        className={
                          booking.email_notification_status === 'sent'
                            ? 'text-emerald-400'
                            : booking.email_notification_status === 'failed'
                            ? 'text-red-400'
                            : 'text-amber-300'
                        }
                      >
                        {booking.email_notification_status}
                      </strong>
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Request Inspector & Status Management Panel */}
        <div className="lg:col-span-5">
          {selectedBooking ? (
            <div className="bento-card rounded-3xl p-6 space-y-5 sticky top-6">
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[11px] font-bold text-[#FF5722]">
                    {selectedBooking.id}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    {selectedBooking.full_name}
                  </h2>
                  <p className="text-xs text-zinc-400">{selectedBooking.work_email}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-0.5 font-mono text-[11px] font-semibold ${getStatusBadgeStyle(
                    selectedBooking.status
                  )}`}
                >
                  {selectedBooking.status}
                </span>
              </div>

              {/* Request Metadata */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Organization / Team:</span>
                  <span className="font-medium text-white">
                    {selectedBooking.company || 'Not specified'} ({selectedBooking.team_size})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Requested Slot:</span>
                  <span className="font-mono font-semibold text-white">
                    {selectedBooking.preferred_date} {selectedBooking.preferred_time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Timezone:</span>
                  <span className="font-mono text-zinc-200">{selectedBooking.timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Associated User ID:</span>
                  <span className="font-mono text-zinc-300">
                    {selectedBooking.user_id || 'Guest Submission'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Admin Email Notification:</span>
                  <span className="font-mono text-zinc-200">
                    {selectedBooking.email_notification_status}
                  </span>
                </div>
              </div>

              {selectedBooking.message && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    <MessageSquare className="h-3 w-3 text-[#FF5722]" />
                    <span>Requester Message</span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">{selectedBooking.message}</p>
                </div>
              )}

              {/* Admin Update Form */}
              <form
                onSubmit={handleUpdateBooking}
                className="border-t border-white/[0.06] pt-4 space-y-4"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Update Status &amp; Coordinator Notes</span>
                </div>

                {updateFeedback && (
                  <div
                    className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
                      updateFeedback.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-red-500/30 bg-red-500/10 text-red-200'
                    }`}
                  >
                    {updateFeedback.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    )}
                    <span>{updateFeedback.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Booking Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as DemoBookingRecord['status'])
                    }
                    className="bento-pill-input w-full h-10 rounded-xl px-3.5 text-xs text-white focus:border-[#FF5722] focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st} className="bg-[#121215] text-white">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Confirmed Appointment Slot (Optional)
                  </label>
                  <input
                    type="text"
                    value={editConfirmedDatetime}
                    onChange={(e) => setEditConfirmedDatetime(e.target.value)}
                    placeholder="e.g. 2026-11-15 14:30 UTC (Zoom Link Sent)"
                    className="bento-pill-input w-full h-10 rounded-xl px-3.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Coordinator / Admin Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    placeholder="Add scheduling confirmation, meeting link, or internal triage notes..."
                    className="bento-pill-input w-full rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full h-10 rounded-xl bg-[#FF5722] hover:bg-[#e64a19] text-xs font-semibold text-white shadow-[0_8px_20px_-4px_rgba(255,87,34,0.5)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? 'Saving Status Update...' : 'Save Status & Notify Requester View'}
                </button>
              </form>

              {/* Status History Log */}
              {selectedBooking.status_history && selectedBooking.status_history.length > 0 && (
                <div className="border-t border-white/[0.06] pt-4 space-y-2">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Status Audit History
                  </span>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {selectedBooking.status_history.map((h) => (
                      <div
                        key={h.id}
                        className="rounded-xl bg-white/[0.02] border border-white/[0.05] px-3 py-2 text-[11px]"
                      >
                        <div className="flex items-center justify-between text-zinc-200 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-[#FF5722]" />
                            {h.previous_status
                              ? `${h.previous_status} → ${h.new_status}`
                              : `Created (${h.new_status})`}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            {new Date(h.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-0.5 text-zinc-400">
                          By <span className="font-mono text-zinc-300">{h.changed_by_email}</span>
                          {h.note ? ` — ${h.note}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bento-card rounded-3xl p-8 text-center text-xs text-zinc-400">
              Select a demo request on the left to inspect details and update its status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookingsPage;
