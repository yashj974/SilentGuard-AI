import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Wand2,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Code2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { DEMO_OVERVIEW_DATA } from '../data/demoData';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';
import type { DebtCategory, Severity, SignalType } from '../types';

export const FindingsPage: React.FC = () => {
  const {
    selectedProject,
    uiState,
    setUiState,
    globalSearch,
    setGlobalSearch,
    remediationStates,
  } = useWorkspace();

  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | DebtCategory>('all');
  const [signalFilter, setSignalFilter] = useState<'all' | SignalType>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'find-101': true,
  });

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const findings = DEMO_OVERVIEW_DATA.highestPriorityFindings.filter((f) => {
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesSignal = signalFilter === 'all' || f.signalType === signalFilter;
    const q = globalSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      f.title.toLowerCase().includes(q) ||
      f.filePath.toLowerCase().includes(q) ||
      f.ruleId.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      (f.cwe && f.cwe.toLowerCase().includes(q));
    return matchesSeverity && matchesCategory && matchesSignal && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Top Filter & Search Bento Panel */}
      <div className="bento-card animate-bento-in p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold tracking-tight text-white">
                Findings &amp; Code X-Ray ({selectedProject.key})
              </h1>
              <Badge variant="demo" size="sm" />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Inspect AST-confirmed vulnerabilities and heuristic signals with expandable source evidence and remediation diffs.
            </p>
          </div>

          {/* Signal Verification Filter (Confirmed vs Heuristic) */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/[0.07] bg-black/40 p-1 text-xs">
            {(
              [
                { id: 'all', label: 'All Signals' },
                { id: 'confirmed_ast', label: 'Confirmed AST (3)' },
                { id: 'heuristic_signal', label: 'Heuristic Signal (1)' },
              ] as const
            ).map((sig) => (
              <button
                key={sig.id}
                onClick={() => setSignalFilter(sig.id)}
                className={`rounded-xl px-3 py-1.5 font-medium transition-all ${
                  signalFilter === sig.id
                    ? 'bento-nav-active text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {sig.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search + Category + Severity Filter Row */}
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search rule ID, CWE, file path, or description..."
              className="bento-pill-input w-full rounded-2xl py-2.5 pl-11 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-white/25 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5 lg:col-span-4">
            {(
              [
                { id: 'all', label: 'All Categories' },
                { id: 'security', label: 'Security' },
                { id: 'reliability', label: 'Reliability' },
                { id: 'maintainability', label: 'Maintainability' },
                { id: 'architectural', label: 'Architectural' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`rounded-xl px-2.5 py-2 text-xs font-medium transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-[#FF5722] text-white font-semibold'
                    : 'bg-white/[0.04] border border-white/[0.07] text-zinc-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 lg:col-span-3">
            {(['all', 'critical', 'high', 'medium'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`rounded-xl px-2.5 py-2 font-mono text-[11px] uppercase transition-all ${
                  severityFilter === sev
                    ? 'bg-white text-zinc-950 font-bold'
                    : 'bg-white/[0.04] border border-white/[0.07] text-zinc-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Findings List with Expandable Code X-Ray */}
      <div className="space-y-4">
        {findings.map((f) => {
          const isExpanded = !!expandedIds[f.id];
          const remState = remediationStates[f.id];

          return (
            <div key={f.id} className="bento-card animate-bento-in p-6">
              {/* Top Row: Badges, Full Title, and Expand Button */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="severity" severity={f.severity} size="sm" />
                    <span className="font-mono text-xs font-bold text-[#FF5722]">
                      {f.ruleId}
                    </span>
                    {f.cwe && (
                      <span className="rounded-md bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 font-mono text-[11px] text-zinc-200">
                        {f.cwe}
                      </span>
                    )}
                    <Badge variant="category" category={f.category} size="sm" />

                    {/* Confirmed AST vs Heuristic Badge */}
                    {f.signalType === 'confirmed_ast' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                        <ShieldCheck className="h-3 w-3" />
                        Confirmed AST Finding
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        Heuristic / Unverified Signal
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-semibold text-white">{f.title}</h2>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => toggleExpand(f.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/[0.12] transition-colors"
                  >
                    <Code2 className="h-3.5 w-3.5 text-[#FF5722]" />
                    <span>{isExpanded ? 'Hide Code X-Ray' : 'Expand Code X-Ray'}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {f.verifiedFixAvailable && (
                    <Link
                      to="/remediation-lab"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {remState === 'verified_applied' ? 'Fix Applied' : 'Remediation Lab'}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Plain-Language Explanation & File Metadata */}
              <p className="mt-2.5 text-xs text-zinc-300 leading-relaxed">{f.description}</p>

              <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-xs text-zinc-400">
                <span className="rounded-lg bg-black/40 border border-white/[0.07] px-2.5 py-1 text-zinc-100">
                  File: {f.filePath}:{f.line}
                </span>
                <span>
                  AI Generation Confidence: <strong className="text-[#FF5722]">{f.aiGeneratedConfidence}%</strong>
                </span>
                <span>Status: {f.status}</span>
                <span>Detected: {f.detectedAt}</span>
              </div>

              {/* Expandable Technical Code X-Ray Details */}
              {isExpanded && (
                <div className="mt-5 space-y-4 border-t border-white/[0.08] pt-4">
                  {/* Evidence & AST Node Path */}
                  <div className="bento-inner-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#FF5722]">
                        Technical Evidence &amp; AST Node Trace
                      </span>
                      {f.astNodeType && (
                        <span className="rounded bg-black/50 px-2.5 py-0.5 font-mono text-[11px] text-zinc-300 border border-white/[0.07]">
                          AST Path: {f.astNodeType}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-zinc-200 leading-relaxed">
                      {f.aiEvidence}
                    </p>
                  </div>

                  {/* Two-Column Code X-Ray: Vulnerable Source vs Recommended Remediation */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {f.codeSnippet && (
                      <div className="bento-inner-card p-4">
                        <div className="mb-2.5 font-mono text-[11px] font-semibold text-rose-300">
                          Vulnerable Source ({f.filePath}:{f.line})
                        </div>
                        <div className="rounded-xl bg-black/60 border border-white/[0.07] p-3 font-mono text-xs space-y-1 overflow-x-auto">
                          {f.codeSnippet.beforeLines.map((line) => (
                            <div key={line} className="text-zinc-500">
                              {line}
                            </div>
                          ))}
                          <div className="rounded bg-rose-500/20 border-l-2 border-rose-400 px-2 py-0.5 text-rose-200 font-semibold">
                            {f.codeSnippet.vulnerableLine}
                          </div>
                          {f.codeSnippet.afterLines.map((line) => (
                            <div key={line} className="text-zinc-500">
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {f.remediationDiff && (
                      <div className="bento-inner-card p-4">
                        <div className="mb-2.5 flex items-center justify-between font-mono text-[11px]">
                          <span className="font-semibold text-emerald-300">
                            Recommended Remediation Diff
                          </span>
                          <span className="text-zinc-400">
                            +{f.remediationDiff.scoreImpactPts} Score Pts
                          </span>
                        </div>
                        <div className="rounded-xl bg-black/60 border border-white/[0.07] p-3 font-mono text-xs space-y-1 overflow-x-auto">
                          {f.remediationDiff.removedLines.map((line) => (
                            <div key={line} className="text-rose-400">
                              {line}
                            </div>
                          ))}
                          {f.remediationDiff.addedLines.map((line) => (
                            <div key={line} className="text-emerald-400">
                              {line}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-start gap-2 text-xs text-zinc-300">
                          <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF5722]" />
                          <span>{f.remediationDiff.explanation}</span>
                        </div>
                      </div>
                    )}
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
