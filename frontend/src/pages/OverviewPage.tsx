import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Activity,
  Wrench,
  Layers,
  Flame,
  Wand2,
  ArrowUpRight,
  GitBranch,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DEMO_OVERVIEW_DATA } from '../data/demoData';
import { MetricCard } from '../components/common/MetricCard';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedProject,
    uiState,
    setUiState,
    appliedScoreBonus,
    remediationStates,
  } = useWorkspace();

  const [scanTab, setScanTab] = useState<'all' | 'passed' | 'attention'>('all');

  if (uiState === 'loading') {
    return <LoadingSkeleton />;
  }

  if (uiState === 'empty') {
    return <EmptyState onAction={() => setUiState('demo')} />;
  }

  if (uiState === 'error') {
    return <ErrorState onRetry={() => setUiState('demo')} />;
  }

  const data = DEMO_OVERVIEW_DATA;
  const effectiveScore = Math.min(100, selectedProject.debtScore + appliedScoreBonus);
  const effectiveGrade =
    effectiveScore >= 85
      ? 'A'
      : effectiveScore >= 75
      ? 'B'
      : effectiveScore >= 65
      ? 'C'
      : 'D';

  const cats = selectedProject.categories;

  const filteredScans = data.recentScans.filter((scan) => {
    if (scanTab === 'passed') return scan.status === 'passed';
    if (scanTab === 'attention') return scan.status === 'warning' || scan.status === 'failed';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Row: Silent Debt Score + 4 Core Risk Dimensions (5 Compact Bento Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Composite Silent Debt Score & Grade */}
        <div
          onClick={() => navigate('/debt-explorer')}
          className="bento-card bento-card-interactive animate-bento-in flex flex-col justify-between p-5 cursor-pointer"
        >
          <ScoreGauge
            score={effectiveScore}
            grade={effectiveGrade}
            size={74}
            label="Silent Debt Score"
          />
          {appliedScoreBonus > 0 && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-mono text-[10px] text-emerald-300">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span>+{appliedScoreBonus} pts from Sandbox Fixes</span>
            </div>
          )}
        </div>

        {/* Card 2: Security Risk */}
        <MetricCard
          title="Security Risk"
          value={cats.security.score}
          grade={cats.security.grade}
          trend={cats.security.trend}
          changeDelta={cats.security.changeDelta}
          issuesCount={cats.security.issuesCount}
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
          onClick={() => navigate('/findings')}
        />

        {/* Card 3: Reliability Risk */}
        <MetricCard
          title="Reliability Risk"
          value={cats.reliability.score}
          grade={cats.reliability.grade}
          trend={cats.reliability.trend}
          changeDelta={cats.reliability.changeDelta}
          issuesCount={cats.reliability.issuesCount}
          icon={<Activity className="h-4 w-4 text-emerald-400" />}
          onClick={() => navigate('/findings')}
        />

        {/* Card 4: Maintainability Risk */}
        <MetricCard
          title="Maintainability"
          value={cats.maintainability.score}
          grade={cats.maintainability.grade}
          trend={cats.maintainability.trend}
          changeDelta={cats.maintainability.changeDelta}
          issuesCount={cats.maintainability.issuesCount}
          icon={<Wrench className="h-4 w-4 text-amber-400" />}
          onClick={() => navigate('/debt-explorer')}
        />

        {/* Card 5: Architectural Risk */}
        <MetricCard
          title="Architectural Risk"
          value={cats.architectural.score}
          grade={cats.architectural.grade}
          trend={cats.architectural.trend}
          changeDelta={cats.architectural.changeDelta}
          issuesCount={cats.architectural.issuesCount}
          icon={<Layers className="h-4 w-4 text-[#FF5722]" />}
          onClick={() => navigate('/change-impact')}
        />
      </div>

      {/* Main Asymmetric 2-Column Bento Split matching Reference Screenshot */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column (7 cols): Historical Risk Trend + Silent Debt Budget + Recent Scans */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* Top-Left Card: Historical Trends + Silent Debt Budget Strip */}
          <div className="bento-card animate-bento-in p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-semibold tracking-tight text-white">
                    Historical Risk &amp; Debt Trend
                  </h2>
                  <Badge variant="demo" size="sm" />
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  7-interval posture trajectory for <span className="font-mono text-zinc-200">{selectedProject.key}</span> ({selectedProject.aiRatio}% AI-assisted LOC)
                </p>
              </div>

              {/* Reference-Styled Square Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-[4px] bg-[#FF5722] shadow-[0_0_10px_rgba(255,87,34,0.7)]" />
                  <span>Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-[4px] bg-[#f472b6] shadow-[0_0_10px_rgba(244,114,182,0.7)]" />
                  <span>Architectural</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-[4px] bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  <span>Reliability</span>
                </div>
              </div>
            </div>

            {/* Smooth Glowing Area Chart */}
            <div className="mt-5 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.riskTrend}
                  margin={{ top: 10, right: 10, left: -26, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="overviewSecurityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5722" stopOpacity={0.36} />
                      <stop offset="70%" stopColor="#FF5722" stopOpacity={0.07} />
                      <stop offset="100%" stopColor="#FF5722" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="overviewArchFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#f472b6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <XAxis
                    dataKey="period"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis
                    domain={[45, 95]}
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 15, 18, 0.96)',
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                      borderRadius: '14px',
                      color: '#f4f4f5',
                      fontSize: '12px',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reliability"
                    name="Reliability Health"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="architectural"
                    name="Architectural Health"
                    stroke="#f472b6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#overviewArchFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="security"
                    name="Security Health"
                    stroke="#FF5722"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#overviewSecurityFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Silent Debt Budget & Remaining Budget Bar */}
            <div className="bento-inner-card mt-5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[#FF5722]" />
                  <span className="font-semibold text-white">
                    Silent Debt Budget ({data.debtBudget.sprintName})
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-zinc-300">
                    Consumed: <strong className="text-white">{data.debtBudget.consumedBudget} pts</strong> / {data.debtBudget.allocatedBudget} pts
                  </span>
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                    {data.debtBudget.remainingBudget} pts remaining ({data.debtBudget.burnRatePercentage}% burn)
                  </span>
                </div>
              </div>

              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF5722] via-amber-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${data.debtBudget.burnRatePercentage}%` }}
                />
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                <span>
                  Change Fragility Index: <strong className="text-zinc-200">{data.fragility.score}/100 ({data.fragility.level})</strong> • Blast radius: {data.fragility.blastRadius}
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    to="/debt-explorer"
                    className="inline-flex items-center gap-1 font-medium text-[#FF5722] hover:underline"
                  >
                    <span>Debt Explorer</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                  <Link
                    to="/risk-policies"
                    className="inline-flex items-center gap-1 font-medium text-zinc-300 hover:text-white"
                  >
                    <span>Quality Gates</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-Left Card: Recent Scan Status & Historical Commits */}
          <div className="bento-card animate-bento-in p-6 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-white">
                  Recent Scan Status &amp; Audit History
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Sample commit inspections and findings delta across monitored branches.
                </p>
              </div>
              <Link
                to="/reports"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#FF5722] hover:underline"
              >
                <span>Full Audit Reports</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Reference-Styled Segmented Pill Bar */}
            <div className="mt-4 grid grid-cols-3 rounded-2xl border border-white/[0.07] bg-black/40 p-1 text-xs">
              {(
                [
                  { id: 'all', label: 'All Scans (4)' },
                  { id: 'passed', label: 'Passed Gates' },
                  { id: 'attention', label: 'Warning / Failed' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setScanTab(tab.id)}
                  className={`rounded-xl py-2 font-medium transition-all ${
                    scanTab === tab.id
                      ? 'bento-nav-active text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Clean Scan History Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-medium text-zinc-500">
                    <th className="pb-2.5 pr-3 font-normal">Commit &amp; Branch</th>
                    <th className="pb-2.5 pr-3 font-normal">Commit Summary</th>
                    <th className="pb-2.5 pr-3 font-normal">Gate Status</th>
                    <th className="pb-2.5 text-right font-normal">Score &amp; Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredScans.map((scan) => (
                    <tr
                      key={scan.id}
                      onClick={() => navigate('/reports')}
                      className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white">
                          <span>{scan.commitHash}</span>
                        </div>
                        <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                          <GitBranch className="h-2.5 w-2.5" />
                          {scan.branch} • {scan.timestamp}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-medium text-zinc-200">{scan.commitMessage}</div>
                        <div className="mt-0.5 text-[10px] text-zinc-500">
                          {scan.triggeredBy} • {(scan.durationMs / 1000).toFixed(1)}s
                        </div>
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <Badge variant="status" status={scan.status} size="sm" />
                      </td>
                      <td className="py-3 text-right whitespace-nowrap font-mono">
                        <div className="text-xs font-bold text-white">{scan.debtScore}/100</div>
                        <div
                          className={`text-[10px] ${
                            scan.findingsDelta > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {scan.findingsDelta > 0
                            ? `+${scan.findingsDelta} issues`
                            : `${scan.findingsDelta} issues`}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Full-Height Highest-Priority Findings & Code X-Ray Links */}
        <div className="bento-card animate-bento-in flex flex-col justify-between p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-white">
                  Highest-Priority Findings
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Confirmed AST detections &amp; heuristic signals requiring attention.
                </p>
              </div>
              <Link
                to="/findings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF5722] hover:underline shrink-0"
              >
                <span>Code X-Ray</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-5 space-y-3.5">
              {data.highestPriorityFindings.map((finding) => {
                const remState = remediationStates[finding.id];
                const isApplied = remState === 'verified_applied';

                return (
                  <div
                    key={finding.id}
                    className="bento-inner-card p-4 transition-all"
                  >
                    {/* Header: Full Title + Severity Pill */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#FF5722]">
                            {finding.ruleId}
                          </span>
                          {finding.cwe && (
                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                              {finding.cwe}
                            </span>
                          )}
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                              finding.signalType === 'confirmed_ast'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                            }`}
                          >
                            {finding.signalType === 'confirmed_ast'
                              ? 'Confirmed AST'
                              : 'Heuristic Signal'}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white leading-snug">
                          {finding.title}
                        </h3>
                      </div>

                      <Badge variant="severity" severity={finding.severity} size="sm" />
                    </div>

                    {/* Plain-Language Explanation (Not Truncated) */}
                    <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                      {finding.description}
                    </p>

                    {/* Affected File & Line */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-zinc-400">
                      <span className="rounded-lg bg-black/40 border border-white/[0.06] px-2 py-0.5 text-zinc-200">
                        {finding.filePath}:{finding.line}
                      </span>
                      <span>AI Authorship Evidence: {finding.aiGeneratedConfidence}%</span>
                    </div>

                    <div className="my-3 border-t border-white/[0.06]" />

                    {/* Action Row matching Reference Screenshot's Orange Wand Insight */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Wand2 className="h-3.5 w-3.5 shrink-0 text-[#FF5722]" />
                        <span>
                          {isApplied
                            ? 'Fix verified & applied in demo simulation'
                            : finding.verifiedFixAvailable
                            ? `Suggested patch (+${finding.remediationDiff?.scoreImpactPts || 4} pts)`
                            : 'Manual architectural triage required'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to="/findings"
                          className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-white/[0.12] transition-colors"
                        >
                          X-Ray
                        </Link>
                        {finding.verifiedFixAvailable && (
                          <Link
                            to="/remediation-lab"
                            className="rounded-lg bg-[#FF5722]/20 border border-[#FF5722]/40 px-2.5 py-1 text-[11px] font-semibold text-[#FF5722] hover:bg-[#FF5722]/30 transition-colors"
                          >
                            {isApplied ? 'Applied' : 'Inspect Fix →'}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Quick Links to All Detailed Analysis Pages */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3.5 text-xs text-zinc-400">
            <span>Drill down into module evidence:</span>
            <div className="flex items-center gap-3">
              <Link to="/project-details" className="text-zinc-300 hover:text-white">
                Modules (5) →
              </Link>
              <Link to="/change-impact" className="text-zinc-300 hover:text-white">
                Blast Radius →
              </Link>
              <Link to="/remediation-lab" className="text-[#FF5722] font-semibold hover:underline">
                Remediation Lab →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
