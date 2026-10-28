import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  Calendar,
  Clock,
  Globe,
  LogOut,
  CalendarClock,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { SentinelWidget } from '../components/sentinel/SentinelWidget';
import { useAuth } from '../context/useAuth';

interface DemoFormData {
  fullName: string;
  workEmail: string;
  companyName: string;
  developerCount: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  message: string;
}

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

function detectDefaultTimezone(): string {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return resolved || 'UTC';
  } catch {
    return 'UTC';
  }
}

export const BookDemoPage: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<DemoFormData>(() => ({
    fullName: user?.full_name || '',
    workEmail: user?.email || '',
    companyName: user?.company || '',
    developerCount: '11-50 developers',
    preferredDate: '2026-11-15',
    preferredTime: '14:00',
    timezone: detectDefaultTimezone(),
    message: '',
  }));

  const effectiveFullName = formData.fullName || user?.full_name || '';
  const effectiveWorkEmail = formData.workEmail || user?.email || '';
  const effectiveCompanyName = formData.companyName || user?.company || '';

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    status: 'success' | 'error';
    requestId?: string;
    bookingStatus?: string;
    emailNotificationStatus?: string;
    preferredSlot?: string;
    message: string;
  } | null>(null);

  const timezoneOptions = COMMON_TIMEZONES.includes(formData.timezone)
    ? COMMON_TIMEZONES
    : [formData.timezone, ...COMMON_TIMEZONES];

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!effectiveFullName.trim() || effectiveFullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name (at least 2 characters)';
    }

    if (!effectiveWorkEmail.trim()) {
      newErrors.workEmail = 'Please enter your work email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveWorkEmail.trim())) {
      newErrors.workEmail = 'Please enter a valid work email address';
    }

    if (!effectiveCompanyName.trim()) {
      newErrors.companyName = 'Please enter your company or organization';
    }

    if (!formData.developerCount) {
      newErrors.developerCount = 'Please select number of developers';
    }

    if (!formData.preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(formData.preferredDate)) {
      newErrors.preferredDate = 'Please select a preferred date';
    }

    if (!formData.preferredTime || !/^\d{2}:\d{2}$/.test(formData.preferredTime)) {
      newErrors.preferredTime = 'Please select a preferred time';
    }

    if (!formData.timezone.trim()) {
      newErrors.timezone = 'Please select a timezone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionResult(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/demo-requests', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          full_name: effectiveFullName.trim(),
          work_email: effectiveWorkEmail.trim(),
          company: effectiveCompanyName.trim(),
          team_size: formData.developerCount,
          preferred_date: formData.preferredDate,
          preferred_time: formData.preferredTime,
          timezone: formData.timezone,
          message: formData.message.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSubmissionResult({
          status: 'success',
          requestId: data.request_id,
          bookingStatus: data.booking?.status || 'Pending',
          emailNotificationStatus: data.booking?.email_notification_status || 'not_configured',
          preferredSlot: `${formData.preferredDate} at ${formData.preferredTime} (${formData.timezone})`,
          message:
            data.message ||
            'Your walkthrough request has been saved and is currently Pending Review. This is a received request — a SilentGuard coordinator will confirm your final appointment slot.',
        });
      } else {
        setSubmissionResult({
          status: 'error',
          message:
            data.detail ||
            'Unable to submit your demo booking request. Please verify your inputs and try again.',
        });
      }
    } catch (err) {
      setSubmissionResult({
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Network error while connecting to the SilentGuard booking service.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-[#08080a] text-white font-sans selection:bg-indigo-600 selection:text-white flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between border-b border-white/[0.06]">
        <Link to="/" title="SilentGuard AI" className="group">
          <BrandLogo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/workspace" className="hover:text-white transition-colors">
            Workspace
          </Link>
          {user && (
            <Link to="/my-bookings" className="hover:text-white transition-colors">
              My Demo Bookings
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin/bookings" className="text-[#FF5722] hover:text-[#ff7043] transition-colors">
              Admin Demo Requests
            </Link>
          )}
        </nav>

        {/* Right Actions: Authenticated User Info or Login/Signup */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/profile"
                className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 hover:border-white/20 transition-all"
              >
                <UserIcon className="h-3.5 w-3.5 text-[#FF5722]" />
                <span className="font-semibold text-white">{user.full_name}</span>
                <span className="font-mono text-[10px] text-slate-400">({user.id})</span>
              </Link>
              <Link
                to="/my-bookings"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] px-3 py-1.5 text-xs font-semibold text-white transition-all"
              >
                <CalendarClock className="h-3.5 w-3.5 text-[#FF5722]" />
                <span>My Bookings</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-white hover:bg-slate-100 px-4 py-2 text-xs font-semibold text-black shadow-sm transition-all"
              >
                Get a free trial
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Split Section */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 py-12 lg:py-16 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-5 text-left space-y-6 pt-2">
            <div className="text-xs font-mono font-bold tracking-wider text-[#FF5722] uppercase">
              [CONTACT &amp; WALKTHROUGH]
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.12]">
              <span className="text-white block">Book Your</span>
              <span className="text-[#FF5722] block mt-1">Live Demo</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md font-normal">
              Curious how SilentGuard AI can help you ship secure code faster? Schedule a live
              technical walkthrough with our engineering team on your codebase.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-200">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">
                  ✓
                </span>
                <span>Real-time AST divergence &amp; silent debt detection</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-200">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">
                  ✓
                </span>
                <span>SOC 2, GDPR &amp; Zero-Trust compliant architecture</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-200">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">
                  ✓
                </span>
                <span>Persistent booking status tracking in My Demo Bookings</span>
              </div>
            </div>

            {user && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-[#FF5722]" />
                  <span>Signed-In Account Linked</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Submitting while signed in as{' '}
                  <span className="font-mono text-white">{user.email}</span> automatically links
                  this booking to your account so you can track confirmation updates under{' '}
                  <Link to="/my-bookings" className="text-[#FF5722] underline">
                    My Demo Bookings
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Form / Confirmation Panel */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#222226] bg-[#101012] p-8 sm:p-10 shadow-2xl text-left">
              {submissionResult?.status === 'success' ? (
                <div className="py-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-amber-300">
                        Status: {submissionResult.bookingStatus} (Request Received — Not Yet Confirmed)
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                        Walkthrough Request Received
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {submissionResult.message}
                  </p>

                  <div className="rounded-xl bg-[#16161a] border border-[#27272d] p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Booking Reference ID:</span>
                      <span className="font-mono font-bold text-white">
                        {submissionResult.requestId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Requested Date &amp; Time:</span>
                      <span className="font-mono text-slate-200">
                        {submissionResult.preferredSlot}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Appointment State:</span>
                      <span className="font-mono text-amber-300">
                        Pending Coordinator Confirmation
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Admin Email Alert:</span>
                      <span className="font-mono text-slate-300">
                        {submissionResult.emailNotificationStatus === 'sent'
                          ? 'Dispatched to Admin'
                          : submissionResult.emailNotificationStatus === 'failed'
                          ? 'Saved in DB (Email Delivery Failed)'
                          : 'Saved in DB (Admin Console Queue)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {user ? (
                      <Link
                        to="/my-bookings"
                        className="inline-flex items-center justify-center rounded-xl bg-[#FF5722] hover:bg-[#e64a19] px-5 py-3 text-xs font-semibold text-white shadow-sm transition-all"
                      >
                        View in My Demo Bookings
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center rounded-xl bg-[#FF5722] hover:bg-[#e64a19] px-5 py-3 text-xs font-semibold text-white shadow-sm transition-all"
                      >
                        Sign In to Track Your Booking
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setSubmissionResult(null)}
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-3 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submissionResult?.status === 'error' && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                      <span>{submissionResult.message}</span>
                    </div>
                  )}

                  {/* Full Name & Work Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white mb-1.5">
                        Full Name <span className="text-[#FF5722]">*</span>
                      </label>
                      <input
                        type="text"
                        value={effectiveFullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Enter your full name"
                        className={`w-full h-[44px] rounded-xl border bg-[#161618] px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                          errors.fullName
                            ? 'border-red-500/80 focus:border-red-500'
                            : 'border-[#26262b] focus:border-[#FF5722]'
                        }`}
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white mb-1.5">
                        Work Email <span className="text-[#FF5722]">*</span>
                      </label>
                      <input
                        type="email"
                        value={effectiveWorkEmail}
                        onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                        placeholder="name@company.com"
                        className={`w-full h-[44px] rounded-xl border bg-[#161618] px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                          errors.workEmail
                            ? 'border-red-500/80 focus:border-red-500'
                            : 'border-[#26262b] focus:border-[#FF5722]'
                        }`}
                      />
                      {errors.workEmail && (
                        <p className="mt-1 text-xs text-red-400">{errors.workEmail}</p>
                      )}
                    </div>
                  </div>

                  {/* Company & Team Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white mb-1.5">
                        Company or Organization <span className="text-[#FF5722]">*</span>
                      </label>
                      <input
                        type="text"
                        value={effectiveCompanyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Acme Engineering"
                        className={`w-full h-[44px] rounded-xl border bg-[#161618] px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                          errors.companyName
                            ? 'border-red-500/80 focus:border-red-500'
                            : 'border-[#26262b] focus:border-[#FF5722]'
                        }`}
                      />
                      {errors.companyName && (
                        <p className="mt-1 text-xs text-red-400">{errors.companyName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white mb-1.5">
                        Engineering Team Size <span className="text-[#FF5722]">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.developerCount}
                          onChange={(e) =>
                            setFormData({ ...formData, developerCount: e.target.value })
                          }
                          className={`w-full h-[44px] rounded-xl border bg-[#161618] px-3.5 pr-9 text-sm text-white appearance-none focus:outline-none transition-all ${
                            errors.developerCount
                              ? 'border-red-500/80 focus:border-red-500'
                              : 'border-[#26262b] focus:border-[#FF5722]'
                          }`}
                        >
                          <option value="1-10 developers" className="bg-[#161618] text-white">
                            1 - 10 developers
                          </option>
                          <option value="11-50 developers" className="bg-[#161618] text-white">
                            11 - 50 developers
                          </option>
                          <option value="51-200 developers" className="bg-[#161618] text-white">
                            51 - 200 developers
                          </option>
                          <option value="201-1000 developers" className="bg-[#161618] text-white">
                            201 - 1,000 developers
                          </option>
                          <option value="1000+ developers" className="bg-[#161618] text-white">
                            1,000+ developers
                          </option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      </div>
                      {errors.developerCount && (
                        <p className="mt-1 text-xs text-red-400">{errors.developerCount}</p>
                      )}
                    </div>
                  </div>

                  {/* Preferred Date, Preferred Time & Explicit Timezone */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-white mb-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#FF5722]" />
                        <span>Preferred Date *</span>
                      </label>
                      <input
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) =>
                          setFormData({ ...formData, preferredDate: e.target.value })
                        }
                        className={`w-full h-[44px] rounded-xl border bg-[#161618] px-3 text-xs text-white focus:outline-none transition-all ${
                          errors.preferredDate
                            ? 'border-red-500/80'
                            : 'border-[#26262b] focus:border-[#FF5722]'
                        }`}
                      />
                      {errors.preferredDate && (
                        <p className="mt-1 text-xs text-red-400">{errors.preferredDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-white mb-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#FF5722]" />
                        <span>Preferred Time *</span>
                      </label>
                      <input
                        type="time"
                        value={formData.preferredTime}
                        onChange={(e) =>
                          setFormData({ ...formData, preferredTime: e.target.value })
                        }
                        className={`w-full h-[44px] rounded-xl border bg-[#161618] px-3 text-xs text-white focus:outline-none transition-all ${
                          errors.preferredTime
                            ? 'border-red-500/80'
                            : 'border-[#26262b] focus:border-[#FF5722]'
                        }`}
                      />
                      {errors.preferredTime && (
                        <p className="mt-1 text-xs text-red-400">{errors.preferredTime}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-white mb-1.5">
                        <Globe className="h-3.5 w-3.5 text-[#FF5722]" />
                        <span>Timezone *</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.timezone}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="w-full h-[44px] rounded-xl border border-[#26262b] bg-[#161618] px-3 pr-8 text-xs text-white appearance-none focus:border-[#FF5722] focus:outline-none transition-all"
                        >
                          {timezoneOptions.map((tz) => (
                            <option key={tz} value={tz} className="bg-[#161618] text-white">
                              {tz}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-3.5 h-3.5 w-3.5 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  {/* Optional Message */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1.5">
                      Repository Stack / Specific Questions (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your primary languages, CI/CD setup, or architectural risk goals..."
                      className="w-full rounded-xl border border-[#26262b] bg-[#161618] p-3.5 text-xs text-white placeholder-slate-500 focus:border-[#FF5722] focus:outline-none transition-all"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-[48px] rounded-xl bg-[#FF5722] hover:bg-[#e64a19] text-white font-semibold text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Saving Demo Request...</span>
                        </div>
                      ) : (
                        <span>Request Live Demo</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-white/[0.06] gap-3">
        <span>© 2026 SilentGuard AI. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-slate-400 transition-colors">
            Home
          </Link>
          <Link to="/workspace" className="hover:text-slate-400 transition-colors">
            Workspace
          </Link>
          {user ? (
            <Link to="/my-bookings" className="hover:text-slate-400 transition-colors">
              My Demo Bookings
            </Link>
          ) : (
            <Link to="/login" className="hover:text-slate-400 transition-colors">
              Login
            </Link>
          )}
        </div>
      </footer>

      <SentinelWidget />
    </div>
  );
};

export default BookDemoPage;
