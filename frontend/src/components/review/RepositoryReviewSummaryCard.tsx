import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Wrench,
  Network,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from 'lucide-react';
import type { RepositoryReviewSummary, Finding } from '../../types';

interface RepositoryReviewSummaryCardProps {
  summary: RepositoryReviewSummary | null;
  onSelectFinding?: (findingId: string) => void;
}

export const RepositoryReviewSummaryCard: React.FC<RepositoryReviewSummaryCardProps> = ({
  summary,
  onSelectFinding,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'security' | 'reliability' | 'maintainability' | 'architectural'>('security');

  if (!summary) return null;

  const categories = [
    {
      id: 'security' as const,
      label: 'Security',
      icon: Shield,
      count: summary.topSecurityIssues.length,
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      issues: summary.topSecurityIssues,
    },
    {
      id: 'reliability' as const,
      label: 'Reliability',
      icon: Zap,
      count: summary.topReliabilityIssues.length,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      issues: summary.topReliabilityIssues,
    },
    {
      id: 'maintainability' as const,
      label: 'Maintainability',
      icon: Wrench,
      count: summary.topMaintainabilityIssues.length,
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
      issues: summary.topMaintainabilityIssues,
    },
    {
      id: 'architectural' as const,
      label: 'Architectural',
      icon: Network,
      count: summary.topArchitecturalIssues.length,
      color: 'text-purple-400',
      badgeBg: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
      issues: summary.topArchitecturalIssues,
    },
  ];

  const currentCategory = categories.find((c) => c.id === activeTab) || categories[0];

  return (
    <div className="bento-card animate-bento-in p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Repository Review Summary &amp; Recommendations
            </h2>
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
              Aggregated Intelligence
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            Categorized risk footprint with top recommended developer actions and scan trends.
          </p>
        </div>

        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <span>{isExpanded ? 'Collapse Summary' : 'View Full Breakdown'}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Comparative Scan Trend Strip */}
      {summary.changesSincePreviousScan && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.08] bg-black/40 px-4 py-2.5 text-xs">
          <span className="font-mono text-[11px] font-semibold uppercase text-zinc-400">
            Scan Comparative Trend:
          </span>
          <div className="flex items-center gap-1.5">
            {summary.changesSincePreviousScan.debtScoreDelta >= 0 ? (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                +{summary.changesSincePreviousScan.debtScoreDelta} Health Pts
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-rose-400">
                <TrendingDown className="h-3.5 w-3.5" />
                {summary.changesSincePreviousScan.debtScoreDelta} Health Pts
              </span>
            )}
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-semibold text-zinc-300">
              {summary.changesSincePreviousScan.findingsDelta <= 0
                ? `${summary.changesSincePreviousScan.findingsDelta} Findings Resolved`
                : `+${summary.changesSincePreviousScan.findingsDelta} New Findings`}
            </span>
          </div>
        </div>
      )}

      {/* Expanded Category Tabs & Findings */}
      {isExpanded && (
        <div className="mt-5 space-y-4 border-t border-white/[0.08] pt-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#FF5722] text-white shadow-md'
                      : 'bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                      isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Issue List for Category */}
          <div className="bento-inner-card p-4 space-y-2.5">
            {currentCategory.issues.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-center text-xs text-zinc-400 justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>No high-priority {currentCategory.label.toLowerCase()} issues detected in this scan!</span>
              </div>
            ) : (
              currentCategory.issues.map((f: Finding) => (
                <div
                  key={f.id}
                  onClick={() => onSelectFinding?.(f.id)}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/30 p-3 hover:border-white/20 hover:bg-black/50 transition-all cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#FF5722]">
                        {f.ruleId}
                      </span>
                      {f.cwe && (
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                          {f.cwe}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-zinc-400">
                        {f.filePath}:{f.line}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-white">{f.title}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-white/[0.06] px-2 py-1 font-mono text-[10px] text-zinc-300">
                      {f.reviewStatus || 'open'}
                    </span>
                    <button className="rounded-lg bg-[#FF5722]/15 border border-[#FF5722]/30 px-2.5 py-1 text-[11px] font-semibold text-[#FF5722] hover:bg-[#FF5722] hover:text-white transition-colors">
                      Inspect &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Top 3 Action Checklist */}
          {summary.topRecommendedActions && summary.topRecommendedActions.length > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#FF5722]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  Recommended Action Plan
                </span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300">
                {summary.topRecommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF5722]/20 font-mono text-[10px] font-bold text-[#FF5722]">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
