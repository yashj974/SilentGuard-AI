import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileCode2,
  GitBranch,
  ShieldAlert,
  Code2,
  GitFork,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { DEMO_OVERVIEW_DATA } from '../data/demoData';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';

export const ProjectDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedProject, uiState, setUiState, isDemoData, overviewData } = useWorkspace();

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  const modules = overviewData?.highestRiskModules && overviewData.highestRiskModules.length > 0
    ? overviewData.highestRiskModules
    : (isDemoData ? DEMO_OVERVIEW_DATA.highestRiskModules : []);

  return (
    <div className="space-y-5">
      {/* Top Repository Context Card */}
      <div className="bento-card animate-bento-in p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-lg font-bold text-white">
                {selectedProject.name} ({selectedProject.key})
              </h1>
              {isDemoData ? (
                <Badge variant="demo" size="sm" />
              ) : (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                  REAL REPOSITORY SCAN
                </span>
              )}
              <Badge
                variant="status"
                status={selectedProject.debtScore >= 80 ? 'passed' : 'warning'}
                size="sm"
              />
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-xs text-zinc-400">
              <span>Repo: {selectedProject.repo}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-zinc-200">
                <GitBranch className="h-3.5 w-3.5 text-[#FF5722]" />
                Branch: {selectedProject.branch}
              </span>
              <span>•</span>
              <span>Commit: {selectedProject.latestCommit}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/findings"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/[0.14] transition-colors"
            >
              <span>Inspect Findings ({selectedProject.findingsCount})</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/change-impact"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110 transition-all"
            >
              <span>Blast Radius &amp; CFI</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Honest Connection Status Notice */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-black/35 px-4 py-2.5 text-xs text-zinc-300">
          <Info className="h-4 w-4 shrink-0 text-[#FF5722]" />
          <span>{selectedProject.connectionNote}</span>
        </div>
      </div>

      {/* 4 Project-Level KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Silent Debt Score"
          value={selectedProject.debtScore}
          grade={selectedProject.grade}
          trend="improving"
          changeDelta="Threshold: 80"
          subtitle="Composite posture"
          icon={<ShieldAlert className="h-4 w-4 text-[#FF5722]" />}
        />
        <MetricCard
          title="Monitored Lines of Code"
          value={selectedProject.totalLoc.toLocaleString()}
          trend="stable"
          changeDelta={`${selectedProject.languages.length} Languages`}
          subtitle={selectedProject.languages.map((l) => `${l.name} ${l.percentage}%`).join(' • ')}
          icon={<Code2 className="h-4 w-4 text-emerald-400" />}
        />
        <MetricCard
          title="AI Code Contribution"
          value={`${selectedProject.aiRatio}%`}
          trend="stable"
          changeDelta="Commit Heuristic"
          subtitle="Estimated LLM-assisted LOC"
          icon={<FileCode2 className="h-4 w-4 text-amber-400" />}
        />
        <MetricCard
          title="Change Fragility (CFI)"
          value={overviewData?.fragility?.score ?? DEMO_OVERVIEW_DATA.fragility.score}
          trend="degrading"
          changeDelta={overviewData?.fragility?.level ?? DEMO_OVERVIEW_DATA.fragility.level}
          subtitle={overviewData?.fragility?.blastRadius ?? DEMO_OVERVIEW_DATA.fragility.blastRadius}
          icon={<GitFork className="h-4 w-4 text-[#FF5722]" />}
          onClick={() => navigate('/change-impact')}
        />
      </div>

      {/* File-Level Module Inventory & Risk Breakdown */}
      <div className="bento-card animate-bento-in p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">
              Monitored File &amp; Module Inventory
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              File-level risk scores, LOC, AI authorship ratio, and downstream blast radius.
            </p>
          </div>
          {isDemoData ? (
            <Badge variant="demo" size="sm" />
          ) : (
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
              {modules.length} MODULES
            </span>
          )}
        </div>

        {modules.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/40 p-8 text-center">
            <p className="font-mono text-xs text-zinc-400">
              No high-risk modules identified. All analyzed source files meet architectural boundaries.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {modules.map((mod) => (
              <div key={mod.id} className="bento-inner-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold text-white">
                      {mod.path}
                    </span>
                    <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                      {mod.language} • {mod.linesOfCode} LOC
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
                        mod.riskScore > 80
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      Risk Score: {mod.riskScore}/100
                    </span>
                  </div>
                  {mod.regressionReason && (
                    <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                      {mod.regressionReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 font-mono text-xs shrink-0">
                  <div>
                    <div className="text-[10px] text-zinc-500">AI Ratio</div>
                    <div className="font-bold text-white">{mod.aiCodeRatio}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Fragility</div>
                    <div className="font-bold text-amber-300">{mod.fragilityIndex}/100</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Findings</div>
                    <div className="font-bold text-[#FF5722]">{mod.findingsCount}</div>
                  </div>
                </div>
              </div>

              {mod.blastRadiusEndpoints && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    Affected Endpoints:
                  </span>
                  {mod.blastRadiusEndpoints.map((ep) => (
                    <span
                      key={ep}
                      className="rounded-md bg-black/40 border border-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-zinc-300"
                    >
                      {ep}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};
