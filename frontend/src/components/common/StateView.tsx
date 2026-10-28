import React from 'react';
import { AlertCircle, FolderArchive, RefreshCw } from 'lucide-react';

interface LoadingSkeletonProps {
  label?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  label = 'Loading risk intelligence data...',
}) => {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 rounded-full bg-[var(--border-strong)] animate-spin" />
        <span className="text-xs font-mono text-[var(--text-muted)]">{label}</span>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-28 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
          >
            <div className="h-3 w-20 rounded bg-[var(--bg-surface-elevated)]" />
            <div className="mt-3 h-7 w-14 rounded bg-[var(--bg-surface-elevated)]" />
            <div className="mt-3 h-3 w-full rounded bg-[var(--bg-surface-elevated)]" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 lg:col-span-2">
          <div className="h-4 w-32 rounded bg-[var(--bg-surface-elevated)]" />
          <div className="mt-6 h-60 w-full rounded bg-[var(--bg-surface-elevated)]" />
        </div>
        <div className="h-80 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="h-4 w-28 rounded bg-[var(--bg-surface-elevated)]" />
          <div className="mt-6 h-60 w-full rounded bg-[var(--bg-surface-elevated)]" />
        </div>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Code Scans Found',
  description = 'No repository risk telemetry has been captured for this project yet. Trigger a scan via CI/CD or CLI.',
  actionText = 'Connect Repository',
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] mb-4">
        {icon || <FolderArchive className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs text-[var(--text-muted)] leading-relaxed">
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-[var(--accent-main)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent-hover)] transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load telemetry',
  message = 'An unexpected network error occurred while communicating with the SilentGuard engine.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-red-400">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs text-[var(--text-muted)] leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
