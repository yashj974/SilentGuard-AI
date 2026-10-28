import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sliders,
  Wand2,
  Info,
  ArrowUpRight,
} from 'lucide-react';
import { DEMO_OVERVIEW_DATA } from '../data/demoData';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';

export const RiskPoliciesPage: React.FC = () => {
  const {
    selectedProject,
    uiState,
    setUiState,
    remediationStates,
    appliedScoreBonus,
  } = useWorkspace();

  const [minScoreThreshold, setMinScoreThreshold] = useState<number>(75);
  const [maxBudgetBurnPct, setMaxBudgetBurnPct] = useState<number>(80);

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  const data = DEMO_OVERVIEW_DATA;
  const effectiveScore = Math.min(100, selectedProject.debtScore + appliedScoreBonus);
  const ssrfFixed = remediationStates['find-101'] === 'verified_applied';
  const isolationFixed = remediationStates['find-103'] === 'verified_applied';

  const scoreGatePassed = effectiveScore >= minScoreThreshold;
  const budgetGatePassed = data.debtBudget.burnRatePercentage <= maxBudgetBurnPct;

  const policies = [
    {
      id: 'pol-1',
      name: 'Policy 1: Minimum Composite Silent Debt Score',
      thresholdLabel: `Required Score >= ${minScoreThreshold} / 100`,
      currentLabel: `Current Score: ${effectiveScore} / 100`,
      status: scoreGatePassed ? 'passed' : 'failed',
      enforcementMode: 'Evaluated against sample dataset (CI webhook not connected)',
      explanation: scoreGatePassed
        ? `Composite score (${effectiveScore}/100) satisfies the configured threshold (${minScoreThreshold}/100).`
        : `Composite score (${effectiveScore}/100) falls below the configured threshold (${minScoreThreshold}/100) due to Security (${selectedProject.categories.security.score}) and Architectural (${selectedProject.categories.architectural.score}) deductions.`,
      triggeringRules: ['SG-SEC-014 (-6 pts)', 'SG-ARCH-008 (-4 pts)'],
    },
    {
      id: 'pol-2',
      name: 'Policy 2: Zero-Tolerance for Critical SSRF / Injection (CWE-918)',
      thresholdLabel: 'Required: 0 Critical CWE-918 Findings',
      currentLabel: ssrfFixed ? 'Current: 0 Open (Remediated)' : 'Current: 1 Open Critical',
      status: ssrfFixed ? 'passed' : 'failed',
      enforcementMode: 'Evaluated against sample AST rules',
      explanation: ssrfFixed
        ? 'Rule SG-SEC-014 in services/auth/oauth_provider_agent.py:142 was remediated in Remediation Lab.'
        : 'Policy breached by Rule SG-SEC-014 (CWE-918: AI-Generated SSRF in Webhook Target Resolution) at services/auth/oauth_provider_agent.py:142.',
      triggeringRules: ['SG-SEC-014 (services/auth/oauth_provider_agent.py:142)'],
    },
    {
      id: 'pol-3',
      name: 'Policy 3: Sprint Silent Debt Budget Burn Safeguard',
      thresholdLabel: `Max Burn Allowed <= ${maxBudgetBurnPct}% (${data.debtBudget.allocatedBudget} pts allocated)`,
      currentLabel: `Current Burn: ${data.debtBudget.burnRatePercentage}% (${data.debtBudget.consumedBudget} pts consumed)`,
      status: budgetGatePassed ? 'passed' : 'warning',
      enforcementMode: 'Sprint governance threshold (Advisory)',
      explanation: budgetGatePassed
        ? `Sprint 24 debt burn (${data.debtBudget.burnRatePercentage}%) is within the ${maxBudgetBurnPct}% threshold.`
        : `Sprint 24 consumed ${data.debtBudget.consumedBudget} of ${data.debtBudget.allocatedBudget} pts (${data.debtBudget.burnRatePercentage}%), exceeding the ${maxBudgetBurnPct}% warning limit. Only ${data.debtBudget.remainingBudget} pts remain.`,
      triggeringRules: ['SG-ARCH-008 (api/routers/rag_document_indexer.py:87)', 'SG-MAINT-005 (services/auth/oauth_provider_agent.py:219)'],
    },
    {
      id: 'pol-4',
      name: 'Policy 4: No Hallucinated ORM / Database Schema Arguments',
      thresholdLabel: 'Required: 0 Confirmed SG-REL-022 Detections',
      currentLabel: isolationFixed ? 'Current: 0 Open (Remediated)' : 'Current: 1 Open High',
      status: isolationFixed ? 'passed' : 'failed',
      enforcementMode: 'Evaluated against TypeScript & Prisma AST definitions',
      explanation: isolationFixed
        ? 'Rule SG-REL-022 in workers/payment_reconciler_llm.ts:63 was remediated in Remediation Lab.'
        : 'Policy breached by Rule SG-REL-022 (CWE-662: Hallucinated Database Transaction Isolation Level) at workers/payment_reconciler_llm.ts:63.',
      triggeringRules: ['SG-REL-022 (workers/payment_reconciler_llm.ts:63)'],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Interactive Threshold & Debt-Budget Configuration Card */}
      <div className="bento-card animate-bento-in p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold tracking-tight text-white">
                Risk Policies &amp; Quality Gates ({selectedProject.key})
              </h1>
              <Badge variant="demo" size="sm" />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Configure risk thresholds and inspect which specific AST rules caused each quality gate to pass or fail.
            </p>
          </div>

          <Link
            to="/remediation-lab"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] px-4 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110 transition-all"
          >
            <span>Remediate Failing Rules</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Truthful Merge-Blocking Enforcement Disclosure */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-black/40 px-4 py-2.5 text-xs text-zinc-300">
          <Info className="h-4 w-4 shrink-0 text-[#FF5722]" />
          <span>
            <strong>Enforcement Truthfulness:</strong> Policy evaluations below are computed live in the workspace against the sample dataset and your Remediation Lab state. Live GitHub Actions / GitLab webhook PR-blocking is not yet wired in the FastAPI backend.
          </span>
        </div>

        {/* Interactive Threshold Sliders */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bento-inner-card p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold text-white">
                <Sliders className="h-3.5 w-3.5 text-[#FF5722]" />
                Minimum Silent Debt Score Threshold
              </span>
              <span className="font-mono text-sm font-bold text-[#FF5722]">
                {minScoreThreshold} / 100
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              value={minScoreThreshold}
              onChange={(e) => setMinScoreThreshold(Number(e.target.value))}
              className="mt-3 w-full accent-[#FF5722] cursor-pointer"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-500">
              <span>50 (Permissive)</span>
              <span>Current Project: {effectiveScore}/100</span>
              <span>95 (Strict)</span>
            </div>
          </div>

          <div className="bento-inner-card p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold text-white">
                <Scale className="h-3.5 w-3.5 text-[#FF5722]" />
                Max Sprint Debt Budget Burn Limit
              </span>
              <span className="font-mono text-sm font-bold text-[#FF5722]">
                {maxBudgetBurnPct}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={maxBudgetBurnPct}
              onChange={(e) => setMaxBudgetBurnPct(Number(e.target.value))}
              className="mt-3 w-full accent-[#FF5722] cursor-pointer"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-500">
              <span>50%</span>
              <span>Current Burn: {data.debtBudget.burnRatePercentage}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Evaluation Cards with Rule-Level Explanations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {policies.map((pol) => (
          <div key={pol.id} className="bento-card animate-bento-in flex flex-col justify-between p-6">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">{pol.name}</h2>
                {pol.status === 'passed' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300 shrink-0">
                    <CheckCircle2 className="h-3 w-3" /> Gate Passed
                  </span>
                ) : pol.status === 'warning' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300 shrink-0">
                    <AlertTriangle className="h-3 w-3" /> Gate Warning
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-rose-300 shrink-0">
                    <ShieldAlert className="h-3 w-3" /> Gate Failed
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="rounded-lg bg-black/40 border border-white/[0.06] px-2.5 py-1 text-zinc-300">
                  {pol.thresholdLabel}
                </span>
                <span className="rounded-lg bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 text-white font-semibold">
                  {pol.currentLabel}
                </span>
              </div>

              <p className="mt-3 text-xs text-zinc-300 leading-relaxed">{pol.explanation}</p>
            </div>

            <div>
              <div className="my-3.5 border-t border-white/[0.06]" />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Wand2 className="h-3.5 w-3.5 shrink-0 text-[#FF5722]" />
                  <span className="font-mono text-[11px]">
                    Evaluated Rules: {pol.triggeringRules.join(', ')}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500">{pol.enforcementMode}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
