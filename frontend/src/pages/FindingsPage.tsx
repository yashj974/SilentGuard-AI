import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Sparkles,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { DEMO_OVERVIEW_DATA } from '../data/demoData';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';
import type { DebtCategory, Severity, SignalType, ReviewStatus, Finding, RepositoryReviewSummary, FindingReviewHistoryItem } from '../types';
import {
  RepositoryHealthSummary,
  RepositoryReviewSummaryCard,
  InlineCodeXRayViewer,
  FindingAuditTimeline,
  AskSilentGuardAssistant,
} from '../components/review';

export const FindingsPage: React.FC = () => {
  const {
    selectedProject,
    uiState,
    setUiState,
    globalSearch,
    setGlobalSearch,
    remediationStates,
    findings: allFindings,
    isDemoData,
    hasRealScans,
    selectedRepo,
    activeScanId,
    fetchSourceFile,
    explainFinding,
    suggestFix,
    updateFindingReview,
    applyFindingFix,
    askFindingAssistant,
    fetchFindingHistory,
    fetchReviewSummary,
  } = useWorkspace();

  // Filters
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | DebtCategory>('all');
  const [signalFilter, setSignalFilter] = useState<'all' | SignalType>('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | ReviewStatus>('all');

  // Active Finding & Selection
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantFinding, setAssistantFinding] = useState<Finding | null>(null);

  // Review Summary & Audit History Data
  const [reviewSummary, setReviewSummary] = useState<RepositoryReviewSummary | null>(null);
  const [findingHistory, setFindingHistory] = useState<FindingReviewHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Source findings
  const sourceFindings = useMemo(() => {
    if (!isDemoData && hasRealScans && allFindings.length > 0) {
      return allFindings;
    }
    return DEMO_OVERVIEW_DATA.highestPriorityFindings;
  }, [isDemoData, hasRealScans, allFindings]);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return sourceFindings.filter((f) => {
      const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
      const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
      const matchesSignal = signalFilter === 'all' || f.signalType === signalFilter;
      const matchesStatus =
        reviewStatusFilter === 'all' ||
        (f.reviewStatus || 'open') === reviewStatusFilter;

      const q = globalSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        f.title.toLowerCase().includes(q) ||
        f.filePath.toLowerCase().includes(q) ||
        f.ruleId.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.cwe && f.cwe.toLowerCase().includes(q));

      return matchesSeverity && matchesCategory && matchesSignal && matchesStatus && matchesSearch;
    });
  }, [sourceFindings, severityFilter, categoryFilter, signalFilter, reviewStatusFilter, globalSearch]);

  // Set default selected finding if none selected or if selection out of bounds
  useEffect(() => {
    if (filteredFindings.length > 0) {
      if (!selectedFindingId || !filteredFindings.some((f) => f.id === selectedFindingId)) {
        setSelectedFindingId(filteredFindings[0].id);
      }
    } else {
      setSelectedFindingId(null);
    }
  }, [filteredFindings, selectedFindingId]);

  // Load Review Summary from backend
  useEffect(() => {
    let isCancelled = false;
    const loadSummary = async () => {
      if (!fetchReviewSummary) return;
      try {
        const sum = await fetchReviewSummary();
        if (!isCancelled && sum) {
          setReviewSummary(sum);
        } else if (!isCancelled) {
          // Synthesize fallback review summary for sample data
          const critical = sourceFindings.filter((f) => f.severity === 'critical');
          const high = sourceFindings.filter((f) => f.severity === 'high');
          const medium = sourceFindings.filter((f) => f.severity === 'medium');
          const low = sourceFindings.filter((f) => f.severity === 'low');

          const synth: RepositoryReviewSummary = {
            status: 'success',
            scan_id: activeScanId || 'demo_scan',
            repository: selectedRepo?.repo_full_name || selectedProject.repo,
            branch: selectedRepo?.default_branch || selectedProject.branch,
            completed_at: selectedProject.lastScan || new Date().toISOString(),
            overallHealthScore: selectedProject.debtScore,
            debtGrade: selectedProject.grade,
            totalFindings: sourceFindings.length,
            severityCounts: {
              critical: critical.length,
              high: high.length,
              medium: medium.length,
              low: low.length,
              info: 0,
            },
            requiresReviewCount: sourceFindings.filter((f) => !f.reviewStatus || f.reviewStatus === 'open' || f.reviewStatus === 'under_review').length,
            topSecurityIssues: sourceFindings.filter((f) => f.category === 'security').slice(0, 3),
            topReliabilityIssues: sourceFindings.filter((f) => f.category === 'reliability').slice(0, 3),
            topMaintainabilityIssues: sourceFindings.filter((f) => f.category === 'maintainability').slice(0, 3),
            topArchitecturalIssues: sourceFindings.filter((f) => f.category === 'architectural').slice(0, 3),
            topRecommendedActions: [
              'Replace raw SQL concatenations with parameterized bindings to mitigate SQL injection.',
              'Extract hardcoded secret credentials and JWT keys into secure environment variables.',
              'Add comprehensive error boundaries and input validation to unhandled endpoints.',
            ],
            changesSincePreviousScan: {
              previousScanId: 'prev_scan_01',
              previousTimestamp: 'Scan 2 days ago',
              debtScoreDelta: 4,
              findingsDelta: -2,
            },
          };
          setReviewSummary(synth);
        }
      } catch {
        // ignore
      }
    };

    loadSummary();
    return () => {
      isCancelled = true;
    };
  }, [fetchReviewSummary, activeScanId, sourceFindings, selectedRepo, selectedProject]);

  // Load audit history when selected finding changes
  const activeFinding = useMemo(() => {
    return sourceFindings.find((f) => f.id === selectedFindingId) || null;
  }, [sourceFindings, selectedFindingId]);

  const loadHistory = useCallback(async () => {
    if (!fetchFindingHistory || !activeFinding) {
      setFindingHistory([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const hist = await fetchFindingHistory(activeFinding.id);
      setFindingHistory(hist);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [fetchFindingHistory, activeFinding]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Status update handler
  const handleStatusChange = async (newStatus: ReviewStatus, note?: string) => {
    if (!updateFindingReview || !activeFinding) return;
    const ok = await updateFindingReview(activeFinding.id, newStatus, note);
    if (ok) {
      await loadHistory();
    }
  };

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  // Metrics for Top Health Summary
  const criticalCount = sourceFindings.filter((f) => f.severity === 'critical').length;
  const highCount = sourceFindings.filter((f) => f.severity === 'high').length;
  const mediumCount = sourceFindings.filter((f) => f.severity === 'medium').length;
  const lowCount = sourceFindings.filter((f) => f.severity === 'low').length;
  const requiresReviewCount = sourceFindings.filter(
    (f) => !f.reviewStatus || f.reviewStatus === 'open' || f.reviewStatus === 'under_review'
  ).length;
  const verifiedFixCount = sourceFindings.filter((f) => f.verifiedFixAvailable).length;

  const topPriorityIssue =
    sourceFindings.find((f) => f.severity === 'critical') ||
    sourceFindings.find((f) => f.severity === 'high') ||
    sourceFindings[0];

  const topActionMessage = topPriorityIssue
    ? `Fix ${topPriorityIssue.ruleId} in ${topPriorityIssue.filePath}:${topPriorityIssue.line} (${topPriorityIssue.title})`
    : null;

  // Findings sharing the same file as active finding
  const findingsInActiveFile = activeFinding
    ? sourceFindings.filter((f) => f.filePath === activeFinding.filePath)
    : [];

  return (
    <div className="space-y-6">
      {/* SECTION A: REPOSITORY HEALTH & TRIAGE SUMMARY */}
      <RepositoryHealthSummary
        healthScore={selectedProject.debtScore}
        grade={selectedProject.grade}
        totalFindings={sourceFindings.length}
        criticalCount={criticalCount}
        highCount={highCount}
        mediumCount={mediumCount}
        lowCount={lowCount}
        requiresReviewCount={requiresReviewCount}
        verifiedFixCount={verifiedFixCount}
        topAction={topActionMessage}
        lastScanTimestamp={selectedProject.lastScan}
        repoFullName={selectedRepo?.repo_full_name || selectedProject.repo}
        branchName={selectedRepo?.default_branch || selectedProject.branch}
        isDemo={isDemoData}
        onJumpToTopAction={() => {
          if (topPriorityIssue) {
            setSelectedFindingId(topPriorityIssue.id);
            setSeverityFilter('all');
            setCategoryFilter('all');
            setReviewStatusFilter('all');
          }
        }}
      />

      {/* SECTION B: REPOSITORY REVIEW SUMMARY & RECOMMENDATIONS */}
      <RepositoryReviewSummaryCard
        summary={reviewSummary}
        onSelectFinding={(id) => {
          setSelectedFindingId(id);
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
      />

      {/* SECTION C: FINDINGS FILTER & SEARCH STATION */}
      <div className="bento-card animate-bento-in p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Filter className="h-4 w-4 text-[#FF5722]" />
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Findings Triage &amp; Code Inspection
            </h2>
            <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 font-mono text-[10px] text-zinc-300">
              Showing {filteredFindings.length} of {sourceFindings.length}
            </span>
          </div>

          {/* Confirmed vs Heuristic Signal Toggle */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-black/40 p-1 text-xs">
            {(
              [
                { id: 'all', label: 'All Signals' },
                { id: 'confirmed_ast', label: 'Confirmed AST' },
                { id: 'heuristic_signal', label: 'Heuristic Signals' },
              ] as const
            ).map((sig) => (
              <button
                key={sig.id}
                onClick={() => setSignalFilter(sig.id)}
                className={`rounded-xl px-3 py-1 font-medium transition-all ${
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

        {/* Search & Filter Rows */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center">
          {/* Search bar */}
          <div className="relative lg:col-span-4">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search rule ID, CWE, file path, description..."
              className="bento-pill-input w-full rounded-2xl py-2 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-white/25 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5 lg:col-span-5">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'security', label: 'Security' },
                { id: 'reliability', label: 'Reliability' },
                { id: 'maintainability', label: 'Maintainability' },
                { id: 'architectural', label: 'Architectural' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-[#FF5722] text-white font-semibold shadow-md'
                    : 'bg-white/[0.04] border border-white/[0.07] text-zinc-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-1.5 lg:col-span-3">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`rounded-xl px-2.5 py-1.5 font-mono text-[10px] uppercase font-bold transition-all ${
                  severityFilter === sev
                    ? 'bg-white text-zinc-950'
                    : 'bg-white/[0.04] border border-white/[0.07] text-zinc-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Review Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.06]">
          <span className="font-mono text-[10px] uppercase text-zinc-500 mr-1">Status:</span>
          {(
            [
              { id: 'all', label: 'All Reviews' },
              { id: 'open', label: 'Open' },
              { id: 'under_review', label: 'Under Review' },
              { id: 'fix_proposed', label: 'Fix Proposed' },
              { id: 'approved', label: 'Approved' },
              { id: 'applied', label: 'Fix Applied' },
              { id: 'verified_resolved', label: 'Verified Resolved' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              onClick={() => setReviewStatusFilter(st.id)}
              className={`rounded-lg px-2 py-1 font-mono text-[11px] transition-all ${
                reviewStatusFilter === st.id
                  ? 'bg-zinc-200 text-zinc-950 font-semibold'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION D & E: ACTIVE FINDINGS LIST + INLINE CODE X-RAY + AUDIT TIMELINE */}
      {filteredFindings.length === 0 ? (
        <div className="bento-card p-12 text-center space-y-3">
          <div className="flex justify-center text-zinc-500">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Findings Match Your Filters</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Try adjusting your search query, signal verification toggle, category, or severity filter to inspect other findings.
          </p>
          <button
            onClick={() => {
              setGlobalSearch('');
              setSeverityFilter('all');
              setCategoryFilter('all');
              setSignalFilter('all');
              setReviewStatusFilter('all');
            }}
            className="rounded-xl bg-white/[0.08] hover:bg-white/[0.15] px-4 py-2 text-xs font-semibold text-white transition-all"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Compact Finding Cards Queue */}
          <div className="lg:col-span-5 space-y-3 max-h-[850px] overflow-y-auto pr-1">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 px-1">
              Select Finding to Inspect ({filteredFindings.length})
            </div>

            {filteredFindings.map((f) => {
              const isSelected = f.id === selectedFindingId;
              const remState = remediationStates[f.id];

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFindingId(f.id)}
                  className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-[#FF5722] bg-[#FF5722]/[0.08] shadow-lg shadow-[#FF5722]/5 scale-[1.01]'
                      : 'border-white/[0.08] bg-black/40 hover:border-white/20 hover:bg-black/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="severity" severity={f.severity} size="sm" />
                      <span className="font-mono text-xs font-bold text-[#FF5722]">
                        {f.ruleId}
                      </span>
                      {f.cwe && (
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                          {f.cwe}
                        </span>
                      )}
                    </div>

                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                      {f.reviewStatus || 'open'}
                    </span>
                  </div>

                  <h3 className="mt-2 text-xs font-semibold text-white leading-snug line-clamp-2">
                    {f.title}
                  </h3>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="truncate max-w-[200px] text-zinc-300">
                      {f.filePath}:{f.line}
                    </span>
                    <span className="text-zinc-500">{f.aiGeneratedConfidence}% Conf.</span>
                  </div>

                  {f.verifiedFixAvailable && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <Sparkles className="h-3 w-3" />
                      <span>
                        {remState === 'verified_applied' ? 'Fix Applied' : 'Verified Fix Available'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Code X-Ray Viewer & Audit Timeline */}
          <div className="lg:col-span-7 space-y-6">
            {activeFinding ? (
              <>
                {/* Active Finding Inline Code X-Ray with Embedded Bot Card */}
                <InlineCodeXRayViewer
                  finding={activeFinding}
                  allFindingsInFile={findingsInActiveFile}
                  activeScanId={activeScanId}
                  onSelectFinding={(id) => setSelectedFindingId(id)}
                  fetchSourceFile={fetchSourceFile}
                  explainFinding={explainFinding}
                  suggestFix={suggestFix}
                  updateFindingReview={updateFindingReview}
                  applyFindingFix={applyFindingFix}
                  onOpenAssistant={(f) => {
                    setAssistantFinding(f);
                    setIsAssistantOpen(true);
                  }}
                />

                {/* Audit & Review History Timeline */}
                <div className="bento-card p-5">
                  <FindingAuditTimeline
                    history={findingHistory}
                    currentStatus={activeFinding.reviewStatus || 'open'}
                    onStatusChange={handleStatusChange}
                    isLoading={isLoadingHistory}
                  />
                </div>
              </>
            ) : (
              <div className="bento-card p-12 text-center text-zinc-400 text-xs">
                Select a finding on the left to inspect inline code and reviews.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION F: GROUNDED ASK SILENTGUARD AI ASSISTANT DRAWER */}
      <AskSilentGuardAssistant
        finding={assistantFinding || activeFinding}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onAsk={async (question, findingId) => {
          return await askFindingAssistant(question, findingId);
        }}
      />
    </div>
  );
};
