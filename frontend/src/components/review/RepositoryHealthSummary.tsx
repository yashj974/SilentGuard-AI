import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  GitBranch,
  Layers,
  Flame,
  ArrowRight,
  Info,
} from 'lucide-react';

interface RepositoryHealthSummaryProps {
  healthScore: number;
  grade: string;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  requiresReviewCount: number;
  verifiedFixCount: number;
  topAction?: string | null;
  lastScanTimestamp?: string;
  repoFullName?: string;
  branchName?: string;
  isDemo?: boolean;
  onJumpToTopAction?: () => void;
}

export const RepositoryHealthSummary: React.FC<RepositoryHealthSummaryProps> = ({
  healthScore,
  grade,
  totalFindings,
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
  requiresReviewCount,
  verifiedFixCount,
  topAction,
  lastScanTimestamp,
  repoFullName,
  branchName,
  isDemo = false,
  onJumpToTopAction,
}) => {
  const gradeColor =
    grade === 'A'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : grade === 'B'
      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
      : grade === 'C'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  const scoreBarColor =
    healthScore >= 85
      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
      : healthScore >= 70
      ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
      : healthScore >= 50
      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
      : 'bg-gradient-to-r from-rose-500 to-red-600';

  return (
    <div className="space-y-4">
      {/* Top Banner: Repo Health & Key Metrics Grid */}
      <div className="bento-card animate-bento-in p-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF5722]/5 blur-3xl" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
          {/* Health Score & Grade */}
          <div className="lg:col-span-4 flex items-center gap-5 border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-6 lg:pb-0 lg:pr-6">
            <div
              className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border ${gradeColor} shadow-inner`}
            >
              <span className="font-mono text-2xl font-black tracking-tight">{grade}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Grade</span>
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Repository Health
                </span>
                <span className="font-mono text-lg font-bold text-white">
                  {healthScore}<span className="text-xs text-zinc-500">/100</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${scoreBarColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, healthScore))}%` }}
                />
              </div>
              <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-zinc-400">
                {repoFullName && (
                  <span className="flex items-center gap-1 text-zinc-300 truncate max-w-[160px]">
                    <GitBranch className="h-3 w-3 text-[#FF5722]" />
                    {repoFullName}
                  </span>
                )}
                {branchName && (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-zinc-400 text-[10px]">
                    {branchName}
                  </span>
                )}
                {isDemo && (
                  <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                    Sample Data
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Counts & Review Status */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {/* Total Findings */}
            <div className="bento-inner-card p-2.5 text-center">
              <div className="flex items-center justify-center text-zinc-400 mb-1">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div className="font-mono text-lg font-bold text-white">{totalFindings}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                Total
              </div>
            </div>

            {/* Critical */}
            <div className="bento-inner-card p-2.5 text-center border-rose-500/20 bg-rose-500/[0.03]">
              <div className="flex items-center justify-center text-rose-400 mb-1">
                <Flame className="h-3.5 w-3.5" />
              </div>
              <div className="font-mono text-lg font-bold text-rose-400">{criticalCount}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-rose-300/80">
                Critical
              </div>
            </div>

            {/* High */}
            <div className="bento-inner-card p-2.5 text-center border-orange-500/20 bg-orange-500/[0.03]">
              <div className="flex items-center justify-center text-orange-400 mb-1">
                <ShieldAlert className="h-3.5 w-3.5" />
              </div>
              <div className="font-mono text-lg font-bold text-orange-400">{highCount}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-orange-300/80">
                High
              </div>
            </div>

            {/* Medium */}
            <div className="bento-inner-card p-2.5 text-center border-amber-500/20 bg-amber-500/[0.03]">
              <div className="flex items-center justify-center text-amber-400 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <div className="font-mono text-lg font-bold text-amber-400">{mediumCount}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-amber-300/80">
                Medium
              </div>
            </div>

            {/* Low */}
            <div className="bento-inner-card p-2.5 text-center border-zinc-500/20 bg-zinc-500/[0.03]">
              <div className="flex items-center justify-center text-zinc-400 mb-1">
                <Info className="h-3.5 w-3.5" />
              </div>
              <div className="font-mono text-lg font-bold text-zinc-300">{lowCount}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                Low
              </div>
            </div>

            {/* Needs Review */}
            <div className="bento-inner-card p-2.5 text-center border-purple-500/20 bg-purple-500/[0.03]">
              <div className="flex items-center justify-center text-purple-400 mb-1">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div className="font-mono text-lg font-bold text-purple-300">{requiresReviewCount}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-purple-300/80">
                Review
              </div>
            </div>

            {/* Verified Fixes */}
            <div className="bento-inner-card p-2.5 text-center border-emerald-500/20 bg-emerald-500/[0.03]">
              <div className="flex items-center justify-center text-emerald-400 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="font-mono text-lg font-bold text-emerald-400">{verifiedFixCount}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-emerald-300/80">
                Fixes
              </div>
            </div>
          </div>
        </div>

        {/* Scan Timestamp Bar */}
        {lastScanTimestamp && (
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-zinc-400" />
              Last analyzed: {lastScanTimestamp}
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              AST &amp; Heuristic scanner verified
            </span>
          </div>
        )}
      </div>

      {/* Top Recommended Action Highlight Banner */}
      {topAction && (
        <div className="rounded-2xl border border-[#FF5722]/30 bg-gradient-to-r from-[#FF5722]/10 via-[#FF5722]/5 to-transparent p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF5722] text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FF5722]">
                Most Important Action to Take Now
              </div>
              <div className="text-xs font-semibold text-white mt-0.5">
                {topAction}
              </div>
            </div>
          </div>

          {onJumpToTopAction && (
            <button
              onClick={onJumpToTopAction}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] px-3 py-1.5 font-mono text-xs font-semibold text-white transition-all hover:scale-[1.02]"
            >
              <span>Address Issue</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#FF5722]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
