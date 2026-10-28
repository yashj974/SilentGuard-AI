import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Building2,
  Briefcase,
  ShieldCheck,
  Calendar,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogOut,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [company, setCompany] = useState(user?.company ?? '');
  const [jobTitle, setJobTitle] = useState(user?.job_title ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!user) {
    return null;
  }

  const initials = user.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SG';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setStatusMessage({
        type: 'error',
        text: 'Full name must be at least 2 characters.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        company: company.trim() || null,
        job_title: jobTitle.trim() || null,
      });
      setStatusMessage({
        type: 'success',
        text: 'Profile updated and saved to the SilentGuard database.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF5722]">
              ACCOUNT MANAGEMENT
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="font-mono text-[11px] text-zinc-400">ID: {user.id}</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            My Profile
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            View your authenticated SilentGuard identity and update permitted profile attributes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/my-bookings"
            className="bento-pill-input inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-white/20 hover:text-white transition-all"
          >
            <CalendarClock className="h-3.5 w-3.5 text-[#FF5722]" />
            <span>My Demo Bookings</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Identity Card */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bento-card rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#ff7043] text-xl font-bold text-white shadow-[0_8px_24px_-4px_rgba(255,87,34,0.5)]">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white truncate">{user.full_name}</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                      user.role === 'admin'
                        ? 'bg-[#FF5722]/20 border border-[#FF5722]/40 text-[#FF5722]'
                        : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-400 truncate">{user.email}</p>
                <p className="mt-1 font-mono text-[11px] text-zinc-500">
                  Account ID: <span className="text-zinc-300">{user.id}</span>
                </p>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-zinc-400">
                  <KeyRound className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>User Identifier</span>
                </span>
                <span className="font-mono font-semibold text-white">{user.id}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Mail className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Verified Email</span>
                </span>
                <span className="font-mono text-zinc-200">{user.email}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Building2 className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Organization</span>
                </span>
                <span className="text-zinc-200">
                  {user.company || <span className="italic text-zinc-500">Not specified</span>}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Briefcase className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Role / Title</span>
                </span>
                <span className="text-zinc-200">
                  {user.job_title || <span className="italic text-zinc-500">Not specified</span>}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-zinc-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Access Level</span>
                </span>
                <span className="font-mono uppercase text-zinc-200">{user.role}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-zinc-400">
                  <KeyRound className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Connected Sign-In Provider</span>
                </span>
                <span className="rounded-md bg-white/[0.06] border border-white/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-300">
                  {user.auth_provider || 'email'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Calendar className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Member Since</span>
                </span>
                <span className="font-mono text-[11px] text-zinc-300">
                  {formatDate(user.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Security Posture Note */}
          <div className="bento-card rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Session &amp; Credential Protection</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Your session is authenticated via a server-managed bearer token stored in the SQLite{' '}
              <code className="font-mono text-zinc-300">sessions</code> table. Password hashes and
              session secrets are never exposed by the profile API.
            </p>
          </div>
        </div>

        {/* Right Edit Profile Form */}
        <div className="lg:col-span-7">
          <div className="bento-card rounded-3xl p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">Edit Account Details</h2>
              <p className="mt-1 text-xs text-zinc-400">
                Update your display name, company/organization, and engineering title. Email address
                and account role are managed by system policy.
              </p>
            </div>

            {statusMessage && (
              <div
                className={`mb-5 flex items-start gap-2.5 rounded-2xl border p-3.5 text-xs ${
                  statusMessage.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-red-500/30 bg-red-500/10 text-red-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              {/* Read-only Email & Account ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Account Email (Read-only)
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full h-11 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 text-xs text-zinc-400 font-mono cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    User ID (Read-only)
                  </label>
                  <input
                    type="text"
                    value={user.id}
                    disabled
                    className="w-full h-11 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 text-xs text-zinc-400 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Editable Full Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-200 mb-1.5">
                  Full Name <span className="text-[#FF5722]">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="bento-pill-input w-full h-11 rounded-xl pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Editable Company */}
              <div>
                <label className="block text-xs font-medium text-zinc-200 mb-1.5">
                  Company or Organization
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Payments Inc."
                    className="bento-pill-input w-full h-11 rounded-xl pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Editable Job Title */}
              <div>
                <label className="block text-xs font-medium text-zinc-200 mb-1.5">
                  Job Title / Engineering Role
                </label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Staff Security Engineer"
                    className="bento-pill-input w-full h-11 rounded-xl pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                <span className="font-mono text-[11px] text-zinc-500">
                  Last updated: {formatDate(user.updated_at)}
                </span>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-xl bg-[#FF5722] hover:bg-[#e64a19] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-4px_rgba(255,87,34,0.5)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
