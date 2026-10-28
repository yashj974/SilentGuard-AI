import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="bento-canvas flex h-screen w-screen items-center justify-center text-zinc-300">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-xs font-mono">
          <span className="h-4 w-4 rounded-full border-2 border-[#FF5722]/30 border-t-[#FF5722] animate-spin" />
          <span>Verifying session with SilentGuard Auth...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-zinc-300">
        <span className="h-4 w-4 rounded-full border-2 border-[#FF5722]/30 border-t-[#FF5722] animate-spin mr-2" />
        <span className="text-xs font-mono">Verifying administrator privileges...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="bento-card animate-bento-in mx-auto max-w-xl p-8 text-center my-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-white">
          403 — Administrator Authorization Required
        </h1>
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
          Your current account (<span className="font-mono text-zinc-200">{user.email}</span>, role:{' '}
          <span className="font-mono text-amber-300">{user.role}</span>) does not have permission to view or manage organization-wide demo requests.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            to="/my-bookings"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] px-4 py-2 text-xs font-semibold text-white hover:bg-white/[0.14] transition-colors"
          >
            <span>View My Demo Bookings</span>
          </Link>
          <Link
            to="/workspace"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] px-4 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Workspace</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
