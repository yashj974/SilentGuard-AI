import React from 'react';
import type { Severity, DebtCategory, ScanStatus } from '../../types';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, CheckCircle2, Sparkles, Wrench } from 'lucide-react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'severity' | 'status' | 'category' | 'verified' | 'demo' | 'outline' | 'custom';
  severity?: Severity;
  status?: ScanStatus;
  category?: DebtCategory;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'custom',
  severity,
  status,
  category,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px] font-medium' : 'px-2.5 py-0.5 text-xs font-semibold';

  if (variant === 'demo') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded border border-amber-500/35 bg-amber-500/10 text-amber-400 font-mono tracking-wider uppercase ${sizeClasses} ${className}`}
        title="Sample dataset loaded — connect live scanner for real repository results"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        DEMO DATA
      </span>
    );
  }

  if (variant === 'verified') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono font-medium ${sizeClasses} ${className}`}
      >
        <Sparkles className="w-3 h-3 text-emerald-400" />
        Verified Fix
      </span>
    );
  }

  if (variant === 'severity' && severity) {
    const config = {
      critical: {
        bg: 'bg-red-500/15',
        border: 'border-red-500/30',
        text: 'text-red-400',
        icon: ShieldAlert,
        label: 'Critical',
      },
      high: {
        bg: 'bg-[#FF5722]/15',
        border: 'border-[#FF5722]/35',
        text: 'text-[#FF5722]',
        icon: AlertTriangle,
        label: 'High',
      },
      medium: {
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        icon: AlertCircle,
        label: 'Medium',
      },
      low: {
        bg: 'bg-sky-500/15',
        border: 'border-sky-500/30',
        text: 'text-sky-400',
        icon: Info,
        label: 'Low',
      },
      info: {
        bg: 'bg-slate-500/15',
        border: 'border-slate-500/30',
        text: 'text-slate-400',
        icon: Info,
        label: 'Info',
      },
    }[severity];

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded border font-mono ${config.border} ${config.bg} ${config.text} ${sizeClasses} ${className}`}
      >
        <Icon className="w-3 h-3" />
        {children || config.label}
      </span>
    );
  }

  if (variant === 'status' && status) {
    const config = {
      passed: {
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        icon: CheckCircle2,
        label: 'Passed',
      },
      warning: {
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        icon: AlertTriangle,
        label: 'Warning',
      },
      failed: {
        bg: 'bg-red-500/15',
        border: 'border-red-500/30',
        text: 'text-red-400',
        icon: ShieldAlert,
        label: 'Failed',
      },
      in_progress: {
        bg: 'bg-[#FF5722]/15',
        border: 'border-[#FF5722]/30',
        text: 'text-[#FF5722]',
        icon: Wrench,
        label: 'In Progress',
      },
    }[status];

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded border font-mono ${config.border} ${config.bg} ${config.text} ${sizeClasses} ${className}`}
      >
        <Icon className="w-3 h-3" />
        {children || config.label}
      </span>
    );
  }

  if (variant === 'category' && category) {
    const config = {
      security: {
        bg: 'bg-red-500/10 text-red-400 border-red-500/25',
        label: 'Security',
      },
      reliability: {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        label: 'Reliability',
      },
      maintainability: {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
        label: 'Maintainability',
      },
      architectural: {
        bg: 'bg-[#FF5722]/10 text-[#FF5722] border-[#FF5722]/25',
        label: 'Architectural',
      },
    }[category];

    return (
      <span
        className={`inline-flex items-center rounded border font-mono capitalize ${config.bg} ${sizeClasses} ${className}`}
      >
        {children || config.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] font-mono text-[var(--text-secondary)] ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
