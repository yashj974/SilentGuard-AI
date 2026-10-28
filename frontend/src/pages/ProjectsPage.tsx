import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  GitBranch,
  Plus,
  Wand2,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Code2,
  Terminal,
  X,
} from 'lucide-react';
import { DEMO_PROJECTS, DEMO_OVERVIEW_DATA } from '../data/demoData';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';
import { RepositoryIntegrationsPanel } from '../components/integrations/RepositoryIntegrationsPanel';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedProject,
    setSelectedProjectKey,
    uiState,
    setUiState,
  } = useWorkspace();

  const [showConnectModal, setShowConnectModal] = useState(false);

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  const totalMonitoredLoc = DEMO_PROJECTS.reduce((acc, p) => acc + p.totalLoc, 0);
  const totalFindings = DEMO_PROJECTS.reduce((acc, p) => acc + p.findingsCount, 0);

  return (
    <div className="space-y-5">
      {/* Top 4 Portfolio Summary Bento KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monitored Projects"
          value={DEMO_PROJECTS.length}
          trend="stable"
          changeDelta="Sample Set"
          subtitle="4 repositories loaded"
          icon={<FolderGit2 className="h-4 w-4 text-[#FF5722]" />}
        />
        <MetricCard
          title="Total Monitored LOC"
          value={totalMonitoredLoc.toLocaleString()}
          trend="improving"
          changeDelta="Python / TS"
          subtitle="Across 4 sample repos"
          icon={<Code2 className="h-4 w-4 text-emerald-400" />}
        />
        <MetricCard
          title="Active Portfolio Findings"
          value={totalFindings}
          trend="degrading"
          changeDelta="+3 recent"
          subtitle="Across sample branches"
          icon={<AlertCircle className="h-4 w-4 text-amber-400" />}
          onClick={() => navigate('/findings')}
        />
        <MetricCard
          title="Selected Project Posture"
          value={selectedProject.debtScore}
          grade={selectedProject.grade}
          trend="improving"
          changeDelta={selectedProject.key}
          subtitle={`Branch: ${selectedProject.branch}`}
          icon={<Terminal className="h-4 w-4 text-[#FF5722]" />}
          onClick={() => navigate('/project-details')}
        />
      </div>

      {/* Live Source Control Integrations Panel (GitHub, GitLab, Bitbucket) */}
      <div id="repository-integrations-panel">
        <RepositoryIntegrationsPanel redirectPath="/projects" />
      </div>

      {/* Optional Quick Info Modal when Connect Repository is clicked */}
      {showConnectModal && (
        <div className="bento-card animate-bento-in border border-[#FF5722]/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  Verified Provider Authorization Required Before Scanning
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                  Live OAuth &amp; API Verification
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                Use the <strong>GitHub, GitLab &amp; Bitbucket Repository Connections</strong> panel above to authorize via official OAuth 2.0 or verify an access token on the backend. Once connected and verified against the provider API, click <strong>Scan</strong> next to any accessible repository to run <code className="font-mono text-emerald-300">POST /api/repositories/scan</code>.
              </p>
            </div>
            <button
              onClick={() => setShowConnectModal(false)}
              className="rounded-lg bg-white/[0.06] p-1.5 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Repository Grid */}
      <div className="bento-card animate-bento-in p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold tracking-tight text-white">
                Projects &amp; Repository Intelligence
              </h1>
              <Badge variant="demo" size="sm" />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Click any project to switch the active workspace context or open file-level module intelligence.
            </p>
          </div>

          <button
            onClick={() => navigate('/integrations')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_-4px_rgba(255,87,34,0.5)] hover:brightness-110 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Connect Repository</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {DEMO_PROJECTS.map((proj) => {
            const isSelected = selectedProject.key === proj.key;
            return (
              <div
                key={proj.key}
                onClick={() => setSelectedProjectKey(proj.key)}
                className={`bento-inner-card cursor-pointer p-5 transition-all ${
                  isSelected ? 'ring-1 ring-[#FF5722]/60 bg-white/[0.05]' : ''
                }`}
              >
                {/* Top Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">{proj.name}</h3>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5722]/20 border border-[#FF5722]/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#FF5722]">
                          <CheckCircle2 className="h-3 w-3" /> Active Context
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-400">
                      <span>{proj.repo}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-zinc-300">
                        <GitBranch className="h-3 w-3 text-[#FF5722]" />
                        {proj.branch} ({proj.latestCommit})
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xl font-bold text-white">
                      {proj.debtScore}{' '}
                      <span className="text-xs font-normal text-zinc-400">
                        /100 (Grade {proj.grade})
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300">Sample Dataset</span>
                  </div>
                </div>

                {/* Language Breakdown Bar & Monitored LOC */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>
                      Monitored LOC: <strong className="font-mono text-white">{proj.totalLoc.toLocaleString()}</strong> • AI Authored: <strong className="font-mono text-[#FF5722]">{proj.aiRatio}%</strong>
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      {proj.languages.map((lang) => (
                        <span key={lang.name} className="flex items-center gap-1 text-zinc-300">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: lang.color }}
                          />
                          {lang.name} {lang.percentage}% ({lang.loc} LOC)
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-black/50">
                    {proj.languages.map((lang) => (
                      <div
                        key={lang.name}
                        style={{
                          width: `${lang.percentage}%`,
                          backgroundColor: lang.color,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Category Mini-Summary */}
                <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-black/35 p-2.5 border border-white/[0.05] text-center font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-zinc-500">Security</div>
                    <div className="font-semibold text-white">
                      {proj.categories.security.score} ({proj.categories.security.grade})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Reliability</div>
                    <div className="font-semibold text-white">
                      {proj.categories.reliability.score} ({proj.categories.reliability.grade})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Maintain.</div>
                    <div className="font-semibold text-white">
                      {proj.categories.maintainability.score} ({proj.categories.maintainability.grade})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Architect.</div>
                    <div className="font-semibold text-white">
                      {proj.categories.architectural.score} ({proj.categories.architectural.grade})
                    </div>
                  </div>
                </div>

                <div className="my-3 border-t border-white/[0.06]" />

                {/* Connection Status & Drilldown Link */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Wand2 className="h-3.5 w-3.5 shrink-0 text-[#FF5722]" />
                    <span>
                      {proj.findingsCount} active findings • Last scan: {proj.lastScan}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProjectKey(proj.key);
                      navigate('/project-details');
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/[0.08] px-3 py-1.5 font-mono text-xs font-semibold text-white hover:bg-[#FF5722] transition-colors"
                  >
                    <span>Open Project Details</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Portfolio Scan History */}
      <div className="bento-card animate-bento-in p-6">
        <h2 className="text-base font-semibold text-white">
          Repository Scan History (Sample Telemetry)
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Historical scan executions across monitored repositories and branches.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {DEMO_OVERVIEW_DATA.recentScans.map((scan) => (
            <div key={scan.id} className="bento-inner-card flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#FF5722]">
                    {scan.projectKey}
                  </span>
                  <span className="font-mono text-xs text-white">{scan.commitHash}</span>
                  <Badge variant="status" status={scan.status} size="sm" />
                </div>
                <p className="mt-1 text-xs text-zinc-300">{scan.commitMessage}</p>
                <p className="mt-1 font-mono text-[10px] text-zinc-500">
                  Branch: {scan.branch} • {scan.timestamp} • {scan.triggeredBy}
                </p>
              </div>
              <div className="text-right font-mono shrink-0 pl-3">
                <div className="text-sm font-bold text-white">{scan.debtScore}/100</div>
                <div
                  className={`text-[10px] ${
                    scan.findingsDelta > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {scan.findingsDelta > 0 ? `+${scan.findingsDelta}` : scan.findingsDelta} delta
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
