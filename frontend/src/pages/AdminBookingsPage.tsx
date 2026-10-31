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
  Video,
  Ban,
  XCircle,
  Calendar,
  X,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import type { DemoBookingRecord } from './MyBookingsPage';
import { formatBookingDateTime } from '../utils/dateUtils';

interface BookingCounts {
  total: number;
  pending: number;
  confirmed: number;
  rescheduled: number;
  completed: number;
  cancelled: number;
  rejected: number;
  cancelled_or_rejected: number;
}

const STATUS_FILTER_OPTIONS = [
  { value: 'All', label: 'All Requests' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
];

export const AdminBookingsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<DemoBookingRecord[]>([]);
  const [counts, setCounts] = useState<BookingCounts>({
    total: 0,
    pending: 0,
    confirmed: 0,
    rescheduled: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    cancelled_or_rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter controls
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [organizationFilter, setOrganizationFilter] = useState<string>('');
  const [emailFilter, setEmailFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  const [selectedBooking, setSelectedBooking] = useState<DemoBookingRecord | null>(null);
  const [activeActionTab, setActiveActionTab] = useState<
    'confirm' | 'reschedule' | 'reject' | 'cancel' | 'complete'
  >('confirm');

  // Form states for Admin Actions
  // Confirm
  const [confirmDatetime, setConfirmDatetime] = useState<string>('');
  const [confirmMeetingUrl, setConfirmMeetingUrl] = useState<string>('');
  const [confirmNotes, setConfirmNotes] = useState<string>('');

  // Reschedule
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('14:00');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [rescheduleNotes, setRescheduleNotes] = useState<string>('');
  const [rescheduleMeetingUrl, setRescheduleMeetingUrl] = useState<string>('');

  // Reject
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectNotes, setRejectNotes] = useState<string>('');

  // Cancel
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelNotes, setCancelNotes] = useState<string>('');

  // Complete
  const [completeNotes, setCompleteNotes] = useState<string>('');

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSelectBooking = useCallback((booking: DemoBookingRecord) => {
    setSelectedBooking(booking);
    setActionFeedback(null);

    // Populate confirm tab defaults
    setConfirmDatetime(
      booking.confirmed_datetime ||
        `${booking.preferred_date} at ${booking.preferred_time} (${booking.timezone})`
    );
    setConfirmMeetingUrl(booking.meeting_url || '');
    setConfirmNotes(booking.admin_notes || '');

    // Populate reschedule defaults
    setRescheduleDate(booking.proposed_date || booking.preferred_date);
    setRescheduleTime(booking.proposed_time || booking.preferred_time);
    setRescheduleReason(booking.reschedule_reason || '');
    setRescheduleNotes(booking.admin_notes || '');
    setRescheduleMeetingUrl(booking.meeting_url || '');

    // Reset other action fields
    setRejectReason(booking.rejection_reason || '');
    setRejectNotes(booking.admin_notes || '');
    setCancelReason(booking.cancellation_reason || '');
    setCancelNotes(booking.admin_notes || '');
    setCompleteNotes(booking.admin_notes || '');

    // Auto switch action tab based on status
    const st = (booking.status || 'pending').toLowerCase();
    if (st === 'confirmed') {
      setActiveActionTab('complete');
    } else if (st === 'pending' || st === 'rescheduled') {
      setActiveActionTab('confirm');
    }
  }, []);

  const fetchAdminBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') {
        params.set('status', statusFilter.toLowerCase());
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      if (organizationFilter.trim()) {
        params.set('organization', organizationFilter.trim());
      }
      if (emailFilter.trim()) {
        params.set('email', emailFilter.trim());
      }
      if (dateFilter.trim()) {
        params.set('date', dateFilter.trim());
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
      if (data.counts) {
        setCounts(data.counts);
      }

      if (selectedBooking) {
        const refreshed = loaded.find((b) => b.id === selectedBooking.id);
        if (refreshed) {
          setSelectedBooking(refreshed);
        }
      } else if (loaded.length > 0) {
        handleSelectBooking(loaded[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch admin demo requests.');
    } finally {
      setLoading(false);
    }
  }, [
    token,
    statusFilter,
    searchQuery,
    organizationFilter,
    emailFilter,
    dateFilter,
    selectedBooking,
    handleSelectBooking,
  ]);

  useEffect(() => {
    void fetchAdminBookings();
  }, [fetchAdminBookings]);

  const clearAllFilters = () => {
    setStatusFilter('All');
    setSearchQuery('');
    setOrganizationFilter('');
    setEmailFilter('');
    setDateFilter('');
  };

  // --------------------------------------------------------------------------
  // Admin Action Handlers
  // --------------------------------------------------------------------------

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !token) return;
    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(selectedBooking.id)}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmed_datetime: confirmDatetime.trim() || undefined,
          meeting_url: confirmMeetingUrl.trim() || undefined,
          admin_notes: confirmNotes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Failed to confirm booking.');

      setActionFeedback({
        type: 'success',
        text: `Demo request ${selectedBooking.id} has been confirmed. Confirmation email status: ${data.email_notification_status}.`,
      });
      await fetchAdminBookings();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Confirmation action failed.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !token) return;
    if (!rescheduleDate || !rescheduleTime) {
      setActionFeedback({
        type: 'error',
        text: 'Both proposed date and time are required.',
      });
      return;
    }

    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/bookings/${encodeURIComponent(selectedBooking.id)}/reschedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            proposed_date: rescheduleDate.trim(),
            proposed_time: rescheduleTime.trim(),
            reschedule_reason: rescheduleReason.trim() || undefined,
            admin_notes: rescheduleNotes.trim() || undefined,
            meeting_url: rescheduleMeetingUrl.trim() || undefined,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Failed to reschedule booking.');

      setActionFeedback({
        type: 'success',
        text: `Proposed reschedule to ${rescheduleDate} at ${rescheduleTime} dispatched to user for acceptance.`,
      });
      await fetchAdminBookings();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Reschedule action failed.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !token) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 3) {
      setActionFeedback({
        type: 'error',
        text: 'A substantive rejection reason is required (at least 3 characters).',
      });
      return;
    }

    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(selectedBooking.id)}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rejection_reason: rejectReason.trim(),
          admin_notes: rejectNotes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Failed to reject booking.');

      setActionFeedback({
        type: 'success',
        text: `Demo request ${selectedBooking.id} rejected. Reason is visible to user in their dashboard.`,
      });
      await fetchAdminBookings();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Rejection action failed.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !token) return;
    if (!cancelReason.trim()) {
      setActionFeedback({
        type: 'error',
        text: 'A cancellation reason is required.',
      });
      return;
    }

    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(selectedBooking.id)}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cancellation_reason: cancelReason.trim(),
          admin_notes: cancelNotes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Failed to cancel booking.');

      setActionFeedback({
        type: 'success',
        text: `Demo booking ${selectedBooking.id} cancelled. Audit history recorded.`,
      });
      await fetchAdminBookings();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Cancellation action failed.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !token) return;
    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(selectedBooking.id)}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          admin_notes: completeNotes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Failed to mark demo completed.');

      setActionFeedback({
        type: 'success',
        text: `Demo walkthrough ${selectedBooking.id} marked as Completed.`,
      });
      await fetchAdminBookings();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Complete action failed.',
      });
    } finally {
      setIsActionLoading(false);
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

  const isTerminal = (status: string) => {
    const s = status.toLowerCase();
    return s === 'completed' || s === 'cancelled' || s === 'rejected';
  };

  const activeFiltersCount =
    (statusFilter !== 'All' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (organizationFilter.trim() ? 1 : 0) +
    (emailFilter.trim() ? 1 : 0) +
    (dateFilter.trim() ? 1 : 0);

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5722]/15 border border-[#FF5722]/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#FF5722]">
              <ShieldCheck className="h-3 w-3" />
              ADMINISTRATION PORTAL
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              Admin: {user?.email}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Demo Requests
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Review incoming customer walkthrough requests, coordinate scheduling slots, record
            coordinator notes, manage reschedules, and maintain audit trails.
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

      {/* KPI Summary Cards (All 6 Metric Dimensions) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bento-card rounded-2xl p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            Total Requests
          </span>
          <div className="mt-1 text-2xl font-bold text-white">{counts.total}</div>
          <span className="text-[10px] text-zinc-500">All submissions</span>
        </div>

        <div className="bento-card rounded-2xl p-4 border-amber-500/20">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
            Pending
          </span>
          <div className="mt-1 text-2xl font-bold text-amber-300">{counts.pending}</div>
          <span className="text-[10px] text-zinc-500">Awaiting triage</span>
        </div>

        <div className="bento-card rounded-2xl p-4 border-emerald-500/20">
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300">
            Confirmed
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-300">{counts.confirmed}</div>
          <span className="text-[10px] text-zinc-500">Scheduled slots</span>
        </div>

        <div className="bento-card rounded-2xl p-4 border-sky-500/20">
          <span className="font-mono text-[10px] uppercase tracking-wider text-sky-300">
            Rescheduled
          </span>
          <div className="mt-1 text-2xl font-bold text-sky-300">{counts.rescheduled}</div>
          <span className="text-[10px] text-zinc-500">Proposed adjustment</span>
        </div>

        <div className="bento-card rounded-2xl p-4 border-indigo-500/20">
          <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-300">
            Completed
          </span>
          <div className="mt-1 text-2xl font-bold text-indigo-300">{counts.completed}</div>
          <span className="text-[10px] text-zinc-500">Demos conducted</span>
        </div>

        <div className="bento-card rounded-2xl p-4 border-rose-500/20">
          <span className="font-mono text-[10px] uppercase tracking-wider text-rose-300">
            Cancelled / Rejected
          </span>
          <div className="mt-1 text-2xl font-bold text-rose-300">{counts.cancelled_or_rejected}</div>
          <span className="text-[10px] text-zinc-500">
            {counts.cancelled} canc. / {counts.rejected} rej.
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bento-card rounded-3xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main search query */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by requester name, email, company, notes, or booking ID..."
              className="bento-pill-input w-full h-10 rounded-xl pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
            />
          </div>

          {/* Quick Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTER_OPTIONS.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setStatusFilter(st.value)}
                className={`rounded-xl px-3 py-1.5 font-mono text-[11px] transition-all cursor-pointer ${
                  statusFilter === st.value
                    ? 'bg-[#FF5722] text-white font-semibold shadow-xs'
                    : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Granular Filters (Organization, Email, Requested Date) */}
        <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-center">
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              placeholder="Filter by organization..."
              className="bento-pill-input w-full h-8 rounded-lg pl-8.5 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
            />
          </div>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Filter by email..."
              className="bento-pill-input w-full h-8 rounded-lg pl-8.5 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
            />
          </div>

          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bento-pill-input w-full h-8 rounded-lg pl-8.5 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] px-2.5 py-1 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Reset Filters ({activeFiltersCount})</span>
              </button>
            )}
            <span className="font-mono text-[11px] text-zinc-500">
              Showing {bookings.length} {bookings.length === 1 ? 'match' : 'matches'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bento-card rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Request List */}
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
                Try clearing search terms or resetting filters to review all requests.
              </p>
            </div>
          ) : (
            bookings.map((booking) => {
              const isSelected = selectedBooking?.id === booking.id;
              const normStatus = (booking.status || 'pending').toLowerCase();
              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => handleSelectBooking(booking)}
                  className={`bento-card w-full text-left rounded-3xl p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-1 ring-[#FF5722] bg-[#FF5722]/[0.05]'
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
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold capitalize ${getStatusBadgeStyle(
                        normStatus
                      )}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {normStatus}
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
                        {booking.company || 'No Organization'} • {booking.team_size || 'N/A'}
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

                  {booking.meeting_url && (
                    <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <Video className="h-3 w-3" />
                      <span className="truncate">Room: {booking.meeting_url}</span>
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-zinc-500">
                    <span>
                      Submitted: {formatBookingDateTime(booking.created_at, booking.timezone)}
                    </span>
                    <span>
                      Alert:{' '}
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

        {/* Right: Detailed Booking View & Action Drawer */}
        <div className="lg:col-span-5">
          {selectedBooking ? (
            <div className="bento-card rounded-3xl p-6 space-y-5 sticky top-6">
              {/* Header */}
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
                  className={`rounded-full border px-3 py-0.5 font-mono text-[11px] font-semibold capitalize ${getStatusBadgeStyle(
                    selectedBooking.status
                  )}`}
                >
                  {selectedBooking.status}
                </span>
              </div>

              {/* Action Feedback Alert */}
              {actionFeedback && (
                <div
                  className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
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

              {/* Booking Specifications */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Organization / Team:</span>
                  <span className="font-medium text-white">
                    {selectedBooking.company || 'Not specified'} ({selectedBooking.team_size || 'N/A'})
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
                  <span className="text-zinc-400">Submitted Timestamp:</span>
                  <span className="font-mono text-zinc-300">
                    {formatBookingDateTime(selectedBooking.created_at, selectedBooking.timezone)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">User Account ID:</span>
                  <span className="font-mono text-zinc-400">
                    {selectedBooking.user_id || 'Guest / Unauthenticated'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Email Notification Status:</span>
                  <span
                    className={`font-mono font-semibold ${
                      selectedBooking.email_notification_status === 'sent'
                        ? 'text-emerald-400'
                        : selectedBooking.email_notification_status === 'failed'
                        ? 'text-red-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {selectedBooking.email_notification_status}
                  </span>
                </div>
              </div>

              {/* Additional Requirements / Message */}
              {selectedBooking.message && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    <MessageSquare className="h-3 w-3 text-[#FF5722]" />
                    <span>Requester Requirements &amp; Notes</span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">{selectedBooking.message}</p>
                </div>
              )}

              {/* Specific State Banners (Confirmed, Rescheduled, Rejection, Cancellation) */}
              {selectedBooking.confirmed_datetime && (
                <div className="rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/30 p-3 text-xs space-y-1">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCheck className="h-3.5 w-3.5" />
                    Confirmed Slot: {selectedBooking.confirmed_datetime}
                  </span>
                  {selectedBooking.meeting_url && (
                    <a
                      href={selectedBooking.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-200 hover:underline pt-0.5"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>{selectedBooking.meeting_url}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {selectedBooking.confirmed_at && (
                    <p className="text-[10px] font-mono text-zinc-400">
                      Confirmed at {formatBookingDateTime(selectedBooking.confirmed_at, selectedBooking.timezone)} by Admin {selectedBooking.confirmed_by_admin_id || ''}
                    </p>
                  )}
                </div>
              )}

              {selectedBooking.proposed_date && (
                <div className="rounded-2xl bg-sky-500/[0.08] border border-sky-500/30 p-3 text-xs space-y-1">
                  <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Proposed Reschedule: {selectedBooking.proposed_date} at {selectedBooking.proposed_time} ({selectedBooking.timezone})
                  </span>
                  <p className="text-zinc-300">
                    Reason: {selectedBooking.reschedule_reason || 'Coordinator schedule change'}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-400">
                    User Acceptance Status: <strong className="text-sky-200">{selectedBooking.reschedule_status || 'pending'}</strong>
                  </p>
                </div>
              )}

              {selectedBooking.rejection_reason && (
                <div className="rounded-2xl bg-rose-500/[0.08] border border-rose-500/30 p-3 text-xs space-y-1">
                  <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                    <Ban className="h-3.5 w-3.5" />
                    Rejection Reason
                  </span>
                  <p className="text-zinc-300">{selectedBooking.rejection_reason}</p>
                </div>
              )}

              {selectedBooking.cancellation_reason && (
                <div className="rounded-2xl bg-red-500/[0.06] border border-red-500/30 p-3 text-xs space-y-1">
                  <span className="font-semibold text-red-300 flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    Cancelled by {selectedBooking.cancelled_by === 'admin' ? 'Administrator' : 'User'}
                  </span>
                  <p className="text-zinc-300">{selectedBooking.cancellation_reason}</p>
                </div>
              )}

              {/* Admin Action Tabs */}
              <div className="border-t border-white/[0.06] pt-4 space-y-3">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Administrative Actions</span>
                </div>

                <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('confirm')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      activeActionTab === 'confirm'
                        ? 'bg-[#FF5722] text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('reschedule')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      activeActionTab === 'reschedule'
                        ? 'bg-[#FF5722] text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('complete')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      activeActionTab === 'complete'
                        ? 'bg-[#FF5722] text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('cancel')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      activeActionTab === 'cancel'
                        ? 'bg-[#FF5722] text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('reject')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      activeActionTab === 'reject'
                        ? 'bg-[#FF5722] text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Reject
                  </button>
                </div>

                {/* Form: Confirm */}
                {activeActionTab === 'confirm' && (
                  <form onSubmit={handleConfirmSubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Confirmed Appointment Slot
                      </label>
                      <input
                        type="text"
                        value={confirmDatetime}
                        onChange={(e) => setConfirmDatetime(e.target.value)}
                        placeholder="e.g. 2026-11-20 at 14:00 (Europe/London)"
                        className="bento-pill-input w-full h-8 rounded-lg px-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Meeting URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={confirmMeetingUrl}
                        onChange={(e) => setConfirmMeetingUrl(e.target.value)}
                        placeholder="https://meet.google.com/xyz or Zoom link"
                        className="bento-pill-input w-full h-8 rounded-lg px-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Coordinator Notes
                      </label>
                      <textarea
                        rows={2}
                        value={confirmNotes}
                        onChange={(e) => setConfirmNotes(e.target.value)}
                        placeholder="Assigned engineer, security topics, preparation notes..."
                        className="bento-pill-input w-full rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isActionLoading || isTerminal(selectedBooking.status)}
                      className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isActionLoading ? 'Saving Confirmation...' : 'Confirm Demo & Send Notification'}
                    </button>
                  </form>
                )}

                {/* Form: Reschedule */}
                {activeActionTab === 'reschedule' && (
                  <form onSubmit={handleRescheduleSubmit} className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                          Proposed Date
                        </label>
                        <input
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="bento-pill-input w-full h-8 rounded-lg px-2.5 text-xs text-white focus:border-[#FF5722] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                          Proposed Time
                        </label>
                        <input
                          type="text"
                          value={rescheduleTime}
                          onChange={(e) => setRescheduleTime(e.target.value)}
                          placeholder="e.g. 15:30"
                          className="bento-pill-input w-full h-8 rounded-lg px-2.5 text-xs text-white focus:border-[#FF5722] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Reschedule Reason (Sent to User)
                      </label>
                      <input
                        type="text"
                        value={rescheduleReason}
                        onChange={(e) => setRescheduleReason(e.target.value)}
                        placeholder="e.g. Lead engineer is presenting at security conference"
                        className="bento-pill-input w-full h-8 rounded-lg px-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Optional Meeting URL
                      </label>
                      <input
                        type="url"
                        value={rescheduleMeetingUrl}
                        onChange={(e) => setRescheduleMeetingUrl(e.target.value)}
                        placeholder="https://..."
                        className="bento-pill-input w-full h-8 rounded-lg px-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Coordinator Notes
                      </label>
                      <textarea
                        rows={2}
                        value={rescheduleNotes}
                        onChange={(e) => setRescheduleNotes(e.target.value)}
                        placeholder="Internal coordinator notes..."
                        className="bento-pill-input w-full rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isActionLoading || isTerminal(selectedBooking.status)}
                      className="w-full h-9 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isActionLoading ? 'Dispatching...' : 'Send Reschedule Proposal to Requester'}
                    </button>
                  </form>
                )}

                {/* Form: Reject */}
                {activeActionTab === 'reject' && (
                  <form onSubmit={handleRejectSubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Rejection Reason (Required &amp; Visible to User)
                      </label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Ineligible organization domain, capacity constrained"
                        className="bento-pill-input w-full h-8 rounded-lg px-3 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Coordinator Notes
                      </label>
                      <textarea
                        rows={2}
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="Internal notes..."
                        className="bento-pill-input w-full rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isActionLoading || isTerminal(selectedBooking.status)}
                      className="w-full h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isActionLoading ? 'Rejecting...' : 'Reject Demo Request'}
                    </button>
                  </form>
                )}

                {/* Form: Cancel */}
                {activeActionTab === 'cancel' && (
                  <form onSubmit={handleCancelSubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Cancellation Reason (Required)
                      </label>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="e.g. Schedule cancellation requested via email"
                        className="bento-pill-input w-full h-8 rounded-lg px-3 text-xs text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Coordinator Notes
                      </label>
                      <textarea
                        rows={2}
                        value={cancelNotes}
                        onChange={(e) => setCancelNotes(e.target.value)}
                        placeholder="Internal notes..."
                        className="bento-pill-input w-full rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isActionLoading || isTerminal(selectedBooking.status)}
                      className="w-full h-9 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isActionLoading ? 'Cancelling...' : 'Cancel Demo Booking'}
                    </button>
                  </form>
                )}

                {/* Form: Complete */}
                {activeActionTab === 'complete' && (
                  <form onSubmit={handleCompleteSubmit} className="space-y-3 pt-1">
                    <p className="text-xs text-zinc-300">
                      Marking this walkthrough as completed records the completion timestamp and
                      preserves the final audit log.
                    </p>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Session Summary / Coordinator Notes
                      </label>
                      <textarea
                        rows={3}
                        value={completeNotes}
                        onChange={(e) => setCompleteNotes(e.target.value)}
                        placeholder="Conducted walkthrough with VP of Engineering, covered AST fixes..."
                        className="bento-pill-input w-full rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        isActionLoading ||
                        selectedBooking.status.toLowerCase() !== 'confirmed'
                      }
                      className="w-full h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isActionLoading ? 'Completing...' : 'Mark Walkthrough Completed'}
                    </button>
                    {selectedBooking.status.toLowerCase() !== 'confirmed' && (
                      <span className="block text-[10px] text-amber-300">
                        Note: Demo must be in &quot;confirmed&quot; status prior to being marked as completed.
                      </span>
                    )}
                  </form>
                )}
              </div>

              {/* Status Audit History Log */}
              {selectedBooking.status_history && selectedBooking.status_history.length > 0 && (
                <div className="border-t border-white/[0.06] pt-4 space-y-2">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Status Audit History
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedBooking.status_history.map((h) => {
                      const itemTime = h.changed_at || h.created_at;
                      const noteText = h.notes || h.note;
                      return (
                        <div
                          key={h.id}
                          className="rounded-xl bg-white/[0.02] border border-white/[0.05] px-3 py-2 text-[11px]"
                        >
                          <div className="flex items-center justify-between text-zinc-200 font-medium">
                            <span className="flex items-center gap-1.5 capitalize">
                              <Clock className="h-3 w-3 text-[#FF5722]" />
                              {h.previous_status
                                ? `${h.previous_status} → ${h.new_status}`
                                : `Created (${h.new_status})`}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500">
                              {formatBookingDateTime(itemTime, selectedBooking.timezone)}
                            </span>
                          </div>
                          <div className="mt-0.5 text-zinc-400">
                            By <span className="font-mono text-zinc-300">{h.changed_by_email}</span>
                            {noteText ? ` — ${noteText}` : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bento-card rounded-3xl p-8 text-center text-xs text-zinc-400">
              Select a demo request on the left to inspect details and perform administrative actions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookingsPage;
