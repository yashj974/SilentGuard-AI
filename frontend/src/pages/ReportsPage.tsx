import React, { useState } from 'react';
import {
  Download,
  FileText,
  CheckCircle2,
  GitBranch,
  Wand2,
  ShieldAlert,
  Sparkles,
  Clock,
} from 'lucide-react';
import { DEMO_OVERVIEW_DATA } from '../data/demoData';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';

export const ReportsPage: React.FC = () => {
  const {
    selectedProject,
    uiState,
    setUiState,
    remediationStates,
    appliedScoreBonus,
  } = useWorkspace();

  const [lifecycleTab, setLifecycleTab] = useState<'all' | 'newly_detected' | 'recurring' | 'resolved'>('all');
  const [lastExported, setLastExported] = useState<string | null>(null);

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  const data = DEMO_OVERVIEW_DATA;
  const findings = data.highestPriorityFindings;

  const resolvedCount = Object.values(remediationStates).filter(
    (s) => s === 'verified_applied'
  ).length;
  const newlyDetectedCount = findings.filter((f) => f.lifecycle === 'newly_detected').length;
  const recurringCount = findings.filter((f) => f.lifecycle === 'recurring').length;
  const openCount = Math.max(0, findings.length - resolvedCount);

  const filteredLifecycleFindings = findings.filter((f) => {
    const isResolved = remediationStates[f.id] === 'verified_applied';
    if (lifecycleTab === 'resolved') return isResolved;
    if (lifecycleTab === 'newly_detected') return f.lifecycle === 'newly_detected' && !isResolved;
    if (lifecycleTab === 'recurring') return f.lifecycle === 'recurring' && !isResolved;
    return true;
  });

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLastExported(filename);
  };

  const handleExportSarif = () => {
    const sarifPayload = {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'SilentGuard AI (Sample Dataset Export)',
              version: '2.4.0',
              rules: findings.map((f) => ({
                id: f.ruleId,
                name: f.title,
                shortDescription: { text: f.description },
                properties: { cwe: f.cwe, category: f.category, signalType: f.signalType },
              })),
            },
          },
          results: findings.map((f) => ({
            ruleId: f.ruleId,
            level: f.severity === 'critical' || f.severity === 'high' ? 'error' : 'warning',
            message: { text: f.description },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: f.filePath },
                  region: { startLine: f.line },
                },
              },
            ],
            properties: {
              remediationState: remediationStates[f.id],
              aiGeneratedConfidence: f.aiGeneratedConfidence,
            },
          })),
        },
      ],
    };
    downloadFile(
      `silentguard-${selectedProject.key}-report.sarif.json`,
      JSON.stringify(sarifPayload, null, 2),
      'application/json'
    );
  };

  const handleExportMarkdown = () => {
    const effectiveScore = Math.min(100, selectedProject.debtScore + appliedScoreBonus);
    const md = `# SilentGuard AI — Executive Risk & Audit Report (Sample Dataset)

- **Project**: ${selectedProject.name} (\`${selectedProject.key}\`)
- **Repository**: \`${selectedProject.repo}\` (Branch: \`${selectedProject.branch}\`, Commit: \`${selectedProject.latestCommit}\`)
- **Silent Debt Score**: ${effectiveScore} / 100 (Baseline: ${selectedProject.debtScore} / 100)
- **Sprint Debt Budget**: ${data.debtBudget.consumedBudget} / ${data.debtBudget.allocatedBudget} pts (${data.debtBudget.burnRatePercentage}% burn)

## Findings & Remediation Traceability

${findings
  .map(
    (f) =>
      `### [${f.severity.toUpperCase()}] ${f.ruleId}: ${f.title}
- **Location**: \`${f.filePath}:${f.line}\` (${f.cwe || 'N/A'})
- **Signal Type**: ${f.signalType}
- **Remediation Status**: ${remediationStates[f.id]}
- **Explanation**: ${f.description}`
  )
  .join('\n\n')}
`;
    downloadFile(
      `silentguard-${selectedProject.key}-audit.md`,
      md,
      'text/markdown'
    );
  };

  return (
    <div className="space-y-5">
      {/* Top 4 Findings Lifecycle KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Open Findings"
          value={openCount}
          trend="degrading"
          changeDelta="Active"
          subtitle="Unresolved in sample set"
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
        />
        <MetricCard
          title="Newly Detected"
          value={newlyDetectedCount}
          trend="stable"
          changeDelta="Latest Sprint"
          subtitle="Introduced in recent commits"
          icon={<Clock className="h-4 w-4 text-amber-400" />}
        />
        <MetricCard
          title="Recurring Patterns"
          value={recurringCount}
          trend="degrading"
          changeDelta="Fingerprints"
          subtitle="Repeated LLM anti-patterns"
          icon={<FileText className="h-4 w-4 text-[#FF5722]" />}
        />
        <MetricCard
          title="Resolved in Lab"
          value={resolvedCount}
          trend="improving"
          changeDelta={`+${appliedScoreBonus} pts`}
          subtitle="Verified in demo session"
          icon={<Sparkles className="h-4 w-4 text-emerald-400" />}
        />
      </div>

      {/* Report Generation & Real Export Formats */}
      <div className="bento-card animate-bento-in p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold tracking-tight text-white">
                Reports, Exports &amp; Audit History ({selectedProject.key})
              </h1>
              <Badge variant="demo" size="sm" />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Generate and download real SARIF v2.1.0 and Markdown audit reports reflecting your current workspace and Remediation Lab state.
            </p>
          </div>

          {lastExported && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 font-mono text-xs text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Downloaded: {lastExported}
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bento-inner-card flex flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    OWASP &amp; CWE SARIF v2.1.0 Security Bundle
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                    Format: .sarif.json • Compatible with GitHub Code Scanning
                  </p>
                </div>
                <button
                  onClick={handleExportSarif}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110 transition-all shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download SARIF</span>
                </button>
              </div>
              <p className="mt-3 text-xs text-zinc-300 leading-relaxed">
                Exports all {findings.length} sample findings with exact file/line locations, CWE mappings, AST signal types, and current Remediation Lab status.
              </p>
            </div>
            <div className="mt-3 border-t border-white/[0.06] pt-2.5 flex items-center gap-2 text-xs text-zinc-400">
              <Wand2 className="h-3.5 w-3.5 text-[#FF5722]" />
              <span>Includes live session remediation states ({resolvedCount} resolved).</span>
            </div>
          </div>

          <div className="bento-inner-card flex flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Executive Markdown Governance Audit
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                    Format: .md • Human-readable engineering &amp; judge summary
                  </p>
                </div>
                <button
                  onClick={handleExportMarkdown}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/[0.14] transition-colors shrink-0"
                >
                  <Download className="h-3.5 w-3.5 text-[#FF5722]" />
                  <span>Download Markdown</span>
                </button>
              </div>
              <p className="mt-3 text-xs text-zinc-300 leading-relaxed">
                Generates a complete markdown audit document summarizing Silent Debt Score changes, Sprint 24 budget consumption, and finding explanations.
              </p>
            </div>
            <div className="mt-3 border-t border-white/[0.06] pt-2.5 flex items-center gap-2 text-xs text-zinc-400">
              <Wand2 className="h-3.5 w-3.5 text-[#FF5722]" />
              <span>Ready to attach to pull requests or architecture review tickets.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Split: Findings Lifecycle Breakdown & Historical Scan Audit Log */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left 6 cols: Findings Lifecycle & Remediation Traceability */}
        <div className="bento-card animate-bento-in p-6 lg:col-span-6">
          <h2 className="text-base font-semibold text-white">
            Findings Lifecycle &amp; Remediation Outcomes
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Filter findings by newly detected, recurring, or resolved state.
          </p>

          <div className="mt-4 grid grid-cols-4 rounded-2xl border border-white/[0.07] bg-black/40 p-1 text-xs">
            {(
              [
                { id: 'all', label: 'All (4)' },
                { id: 'newly_detected', label: 'New (2)' },
                { id: 'recurring', label: 'Recurring (2)' },
                { id: 'resolved', label: `Resolved (${resolvedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLifecycleTab(tab.id)}
                className={`rounded-xl py-1.5 font-medium transition-all ${
                  lifecycleTab === tab.id
                    ? 'bento-nav-active text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {filteredLifecycleFindings.length > 0 ? (
              filteredLifecycleFindings.map((f) => {
                const state = remediationStates[f.id];
                return (
                  <div key={f.id} className="bento-inner-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#FF5722]">
                        {f.ruleId} • {f.title}
                      </span>
                      <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 font-mono text-[10px] text-zinc-200">
                        {state === 'verified_applied' ? 'resolved' : f.lifecycle}
                      </span>
                    </div>
                    <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                      {f.filePath}:{f.line} • Detected {f.detectedAt}
                    </p>
                    <div className="mt-2 text-xs text-zinc-300">
                      Outcome:{' '}
                      <strong className="text-white">
                        {state === 'verified_applied'
                          ? `Verified & applied (+${f.remediationDiff?.scoreImpactPts || 4} pts)`
                          : state === 'approved'
                          ? 'Approved by reviewer — ready to apply'
                          : 'Open — awaiting remediation'}
                      </strong>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-white/[0.1] p-6 text-center text-xs text-zinc-400">
                No findings in this lifecycle state yet. Approve and apply a fix in Remediation Lab to see resolved outcomes here.
              </div>
            )}
          </div>
        </div>

        {/* Right 6 cols: Historical Scan & Score Delta Log */}
        <div className="bento-card animate-bento-in p-6 lg:col-span-6">
          <h2 className="text-base font-semibold text-white">
            Historical Scan &amp; Score Delta Log
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Traceable history of commit inspections, durations, and findings deltas.
          </p>

          <div className="mt-4 space-y-3">
            {data.recentScans.map((scan) => (
              <div
                key={scan.id}
                className="bento-inner-card flex items-center justify-between p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">
                      {scan.commitHash}
                    </span>
                    <Badge variant="status" status={scan.status} size="sm" />
                    <span className="font-mono text-[11px] text-zinc-400">
                      {scan.projectKey}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-200">{scan.commitMessage}</p>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                    <GitBranch className="h-3 w-3" />
                    <span>{scan.branch}</span>
                    <span>•</span>
                    <span>{scan.timestamp}</span>
                    <span>•</span>
                    <span>{(scan.durationMs / 1000).toFixed(2)}s</span>
                  </div>
                </div>

                <div className="text-right font-mono shrink-0 pl-3">
                  <div className="text-sm font-bold text-white">{scan.debtScore}/100</div>
                  <div
                    className={`text-[10px] ${
                      scan.findingsDelta > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {scan.findingsDelta > 0
                      ? `+${scan.findingsDelta} findings`
                      : `${scan.findingsDelta} findings`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
