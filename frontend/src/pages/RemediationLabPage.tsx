import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Wrench,
  RotateCcw,
  AlertTriangle,
  Wand2,
  Check,
} from 'lucide-react';
import { DEMO_OVERVIEW_DATA } from '../data/demoData';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';

export const RemediationLabPage: React.FC = () => {
  const {
    selectedProject,
    uiState,
    setUiState,
    remediationStates,
    approveRemediation,
    applyRemediation,
    resetRemediations,
    appliedScoreBonus,
  } = useWorkspace();

  const [queueFilter, setQueueFilter] = useState<'all' | 'proposed' | 'approved' | 'verified_applied'>('all');

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  const findings = DEMO_OVERVIEW_DATA.highestPriorityFindings;
  const baselineScore = selectedProject.debtScore;
  const afterScore = Math.min(100, baselineScore + appliedScoreBonus);

  const proposedCount = Object.values(remediationStates).filter((s) => s === 'proposed').length;
  const approvedCount = Object.values(remediationStates).filter((s) => s === 'approved').length;
  const appliedCount = Object.values(remediationStates).filter(
    (s) => s === 'verified_applied'
  ).length;

  const filteredQueue = findings.filter((f) => {
    const state = remediationStates[f.id];
    if (queueFilter === 'all') return true;
    return state === queueFilter;
  });

  return (
    <div className="space-y-5">
      {/* Top 4 Before / After Re-Analysis & Queue KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Before / After Debt Score"
          value={`${baselineScore} → ${afterScore}`}
          trend="improving"
          changeDelta={appliedScoreBonus > 0 ? `+${appliedScoreBonus} pts` : '0 pts applied'}
          subtitle="Simulated re-analysis"
          icon={<Sparkles className="h-4 w-4 text-[#FF5722]" />}
        />
        <MetricCard
          title="Proposed Fixes (Unapplied)"
          value={proposedCount}
          trend="stable"
          changeDelta="Awaiting Review"
          subtitle="Requires explicit approval"
          icon={<Wrench className="h-4 w-4 text-amber-400" />}
        />
        <MetricCard
          title="Approved for Merge"
          value={approvedCount}
          trend="improving"
          changeDelta="Ready to Apply"
          subtitle="Human-reviewed patches"
          icon={<Check className="h-4 w-4 text-emerald-400" />}
        />
        <MetricCard
          title="Applied & Re-Analyzed"
          value={appliedCount}
          trend="improving"
          changeDelta="Verified in Demo"
          subtitle="Test suite validated"
          icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
        />
      </div>

      {/* Before / After Re-Analysis Comparison Panel */}
      <div className="bento-card animate-bento-in p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold tracking-tight text-white">
                Remediation Lab &amp; Before/After Re-Analysis
              </h1>
              <Badge variant="demo" size="sm" />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Inspect suggested diffs, explicitly approve patches, and run before/after score re-analysis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Queue Status Filter */}
            <div className="flex items-center gap-1 rounded-2xl border border-white/[0.07] bg-black/40 p-1 text-xs">
              {(
                [
                  { id: 'all', label: 'All Queue (4)' },
                  { id: 'proposed', label: `Proposed (${proposedCount})` },
                  { id: 'approved', label: `Approved (${approvedCount})` },
                  { id: 'verified_applied', label: `Applied (${appliedCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setQueueFilter(tab.id)}
                  className={`rounded-xl px-3 py-1.5 font-medium transition-all ${
                    queueFilter === tab.id
                      ? 'bento-nav-active text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {appliedCount > 0 || approvedCount > 0 ? (
              <button
                onClick={resetRemediations}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.12] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Queue</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Before vs After Comparison Strip */}
        <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-white/[0.07] bg-black/40 p-4 md:grid-cols-3 font-mono text-xs">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
            <span className="text-zinc-400">Composite Debt Score:</span>
            <div>
              <span className="text-zinc-400 line-through mr-2">{baselineScore}/100</span>
              <span className="text-base font-bold text-emerald-400">{afterScore}/100</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
            <span className="text-zinc-400">Open Critical/High Issues:</span>
            <div>
              <span className="text-zinc-400 line-through mr-2">3</span>
              <span className="text-base font-bold text-white">
                {Math.max(0, 3 - appliedCount)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
            <span className="text-zinc-400">Quality Gate Status:</span>
            <span
              className={`font-bold ${
                afterScore >= 80 ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {afterScore >= 80 ? 'PASSED (>= 80)' : 'WARNING (< 80)'}
            </span>
          </div>
        </div>
      </div>

      {/* Prioritized Remediation Queue */}
      <div className="space-y-4">
        {filteredQueue.map((item) => {
          const state = remediationStates[item.id];
          const diff = item.remediationDiff;

          return (
            <div key={item.id} className="bento-card animate-bento-in p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="severity" severity={item.severity} size="sm" />
                    <span className="font-mono text-xs font-bold text-[#FF5722]">
                      {item.ruleId}
                    </span>
                    {item.cwe && (
                      <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                        {item.cwe}
                      </span>
                    )}

                    {/* Explicit Fix State Badge */}
                    {state === 'proposed' && (
                      <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
                        Proposed Fix (Awaiting Approval)
                      </span>
                    )}
                    {state === 'approved' && (
                      <span className="rounded-full bg-sky-500/20 border border-sky-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
                        Approved by Reviewer (Ready to Apply)
                      </span>
                    )}
                    {state === 'verified_applied' && (
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                        Applied &amp; Verified (Demo Re-Analysis)
                      </span>
                    )}
                    {state === 'manual_only' && (
                      <span className="rounded-full bg-white/[0.08] border border-white/[0.12] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-300">
                        Manual Remediation Required
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-semibold text-white">{item.title}</h2>
                  <p className="font-mono text-xs text-zinc-400">
                    Target Location: <span className="text-zinc-200">{item.filePath}:{item.line}</span>
                  </p>
                </div>

                {/* Explicit Two-Step Approval & Application Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {state === 'proposed' && (
                    <button
                      onClick={() => approveRemediation(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#FF5722]/50 bg-[#FF5722]/15 px-4 py-2.5 text-xs font-semibold text-[#FF5722] hover:bg-[#FF5722] hover:text-white transition-all"
                    >
                      <Check className="h-4 w-4" />
                      <span>1. Approve Patch</span>
                    </button>
                  )}

                  {state === 'approved' && (
                    <button
                      onClick={() => applyRemediation(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-4px_rgba(255,87,34,0.5)] hover:brightness-110 transition-all"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>2. Apply &amp; Re-Analyze (+{diff?.scoreImpactPts || 4} pts)</span>
                    </button>
                  )}

                  {state === 'verified_applied' && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Applied (+{diff?.scoreImpactPts || 4} pts)</span>
                    </span>
                  )}

                  {state === 'manual_only' && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] px-3.5 py-2 text-xs text-zinc-400">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      <span>Requires Architect Sign-off</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Code Diff & Validation Evidence */}
              {diff && (
                <div className="mt-4 space-y-3">
                  <div className="bento-inner-card p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
                    {diff.removedLines.map((line) => (
                      <div key={line} className="text-rose-400">
                        {line}
                      </div>
                    ))}
                    {diff.addedLines.map((line) => (
                      <div key={line} className="text-emerald-400">
                        {line}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Wand2 className="h-3.5 w-3.5 shrink-0 text-[#FF5722]" />
                      <span>{diff.explanation}</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-400">
                      Validation: {diff.testSuiteResult}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
