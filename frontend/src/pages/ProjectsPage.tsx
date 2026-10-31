import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  GitBranch,
  Play,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Code2,
  Terminal,
  RefreshCw,
  Lock,
  Globe,
} from 'lucide-react';
import { DEMO_PROJECTS } from '../data/demoData';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';
import { useAuth } from '../context/useAuth';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const {
    selectedProject,
    setSelectedProjectKey,
    uiState,
    setUiState,
    selectedRepo,
    hasRealScans,
    scanProgress,
    startRepositoryScan,
    changeRepositoryBranch,
    findings,
    isDemoData,
    setIsDemoData,
  } = useWorkspace();

  const [availableBranches, setAvailableBranches] = useState<string[]>(['main']);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);

  // Fetch branches for selected repo
  useEffect(() => {
    if (!token || !selectedRepo) return;
    let isMounted = true;
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const res = await fetch(
          `/api/integrations/${selectedRepo.provider}/branches?repo=${encodeURIComponent(
            selectedRepo.repo_full_name
          )}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json().catch(() => ({}));
        if (isMounted && res.ok && Array.isArray(data.branches)) {
          setAvailableBranches(data.branches);
        }
      } catch {
        // Fallback to default
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    };
    void fetchBranches();
    return () => {
      isMounted = false;
    };
  }, [token, selectedRepo]);

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  const isScanning = scanProgress.status === 'running';

  const handleBranchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedRepo) return;
    const newBranch = e.target.value;
    await changeRepositoryBranch(selectedRepo.provider, selectedRepo.repo_full_name, newBranch);
  };

  const handleStartScan = async () => {
    const success = await startRepositoryScan();
    if (success) {
      setIsDemoData(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Target Repository & Real Code Scan Control (Hero Bento Card) */}
      <div className="bento-card animate-bento-in p-6 border border-[#FF5722]/35 bg-gradient-to-br from-white/[0.04] to-transparent">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FF5722] flex items-center gap-1.5">
                <FolderGit2 className="h-3.5 w-3.5" />
                ACTIVE SOURCE REPOSITORY
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              {hasRealScans ? (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Real Scan Verified &amp; Saved
                </span>
              ) : selectedRepo ? (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/35 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Connected • Pending First Scan
                </span>
              ) : (
                <span className="rounded-full bg-zinc-500/15 border border-zinc-500/30 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400">
                  No Repository Selected
                </span>
              )}
            </div>

            {selectedRepo ? (
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{selectedRepo.repo_full_name}</span>
                  {selectedRepo.private ? (
                    <span title="Private Repository">
                      <Lock className="h-4 w-4 text-amber-400" />
                    </span>
                  ) : (
                    <span title="Public Repository">
                      <Globe className="h-4 w-4 text-emerald-400" />
                    </span>
                  )}
                </h1>
                <p className="mt-1 text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  Authorized via official{' '}
                  <strong className="text-zinc-200">{selectedRepo.provider.toUpperCase()}</strong>{' '}
                  integration. When you trigger a scan, SilentGuard downloads real source files and
                  runs multi-language AST inspection for security vulnerabilities, reliability concerns,
                  and technical debt.
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  No Repository Selected
                </h1>
                <p className="mt-1 text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  Connect your GitHub, GitLab, or Bitbucket account in Integrations and choose a
                  repository to inspect with SilentGuard AI.
                </p>
              </div>
            )}
          </div>

          {/* Right Controls: Branch Switcher & Scan Action */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedRepo && (
              <div className="flex flex-col">
                <label className="font-mono text-[10px] uppercase text-zinc-400 mb-1 flex items-center gap-1">
                  <GitBranch className="h-3 w-3 text-[#FF5722]" />
                  <span>Target Branch {loadingBranches ? '(Loading...)' : ''}</span>
                </label>
                <select
                  value={selectedRepo.branch}
                  onChange={handleBranchChange}
                  disabled={isScanning}
                  className="h-10 rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-xs text-white focus:border-[#FF5722] focus:outline-none cursor-pointer"
                >
                  {availableBranches.map((br) => (
                    <option key={br} value={br} className="bg-zinc-900 text-white">
                      {br}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedRepo ? (
              <div className="flex flex-col self-end">
                <button
                  type="button"
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] px-5 text-xs font-semibold text-white shadow-[0_8px_20px_-4px_rgba(255,87,34,0.5)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{scanProgress.step}...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>{hasRealScans ? 'Re-Scan Branch' : 'Start Code Scan'}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/integrations')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] px-5 text-xs font-semibold text-white shadow-[0_8px_20px_-4px_rgba(255,87,34,0.5)] hover:brightness-110 transition-all cursor-pointer"
              >
                <FolderGit2 className="h-4 w-4" />
                <span>Go to Integrations</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Scan Lifecycle Progress & Output */}
        {scanProgress.status === 'running' && (
          <div className="mt-5 rounded-2xl border border-[#FF5722]/40 bg-black/45 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-semibold text-white flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#FF5722]" />
                {scanProgress.message}
              </span>
              <span className="font-mono text-xs font-bold text-[#FF5722]">
                {scanProgress.percent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#FF5722] to-amber-400 transition-all duration-300"
                style={{ width: `${scanProgress.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400">
              <span>Step: {scanProgress.step}</span>
              <span>Scanning live repository contents without third-party exposure</span>
            </div>
          </div>
        )}

        {/* Scan Success Summary Card */}
        {scanProgress.status === 'completed' && (
          <div className="mt-5 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">{scanProgress.message}</p>
                <p className="font-mono text-[10px] text-emerald-300 mt-0.5">
                  Silent Debt Score: {selectedProject.debtScore}/100 (Grade {selectedProject.grade}) •{' '}
                  {findings.length} findings available for inspection.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/overview')}
                className="rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-200 transition-colors cursor-pointer"
              >
                View Overview
              </button>
              <button
                type="button"
                onClick={() => navigate('/findings')}
                className="rounded-lg bg-[#FF5722] hover:bg-[#e64a19] px-3 py-1.5 font-mono text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                View Findings X-Ray
              </button>
            </div>
          </div>
        )}

        {/* Scan Error Banner */}
        {scanProgress.status === 'failed' && (
          <div className="mt-5 rounded-2xl border border-rose-500/35 bg-rose-500/10 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Scan Execution Failed</p>
                <p className="text-xs text-rose-200 mt-0.5">{scanProgress.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartScan}
              className="rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-3 py-1.5 font-mono text-xs font-semibold text-rose-200 transition-colors shrink-0 cursor-pointer"
            >
              Retry Scan
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Portfolio Metrics Bento Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monitored Projects"
          value={hasRealScans ? '1 Real + 4 Demo' : '4 Demo'}
          trend="stable"
          changeDelta={hasRealScans ? 'Active Real Repo' : 'Sample Set'}
          subtitle={selectedProject.key}
          icon={<FolderGit2 className="h-4 w-4 text-[#FF5722]" />}
        />
        <MetricCard
          title="Monitored LOC"
          value={selectedProject.totalLoc.toLocaleString()}
          trend="improving"
          changeDelta={`${selectedProject.languages[0]?.name || 'Code'}`}
          subtitle={`Across active ${selectedProject.branch} branch`}
          icon={<Code2 className="h-4 w-4 text-emerald-400" />}
        />
        <MetricCard
          title="Active Detected Findings"
          value={findings.length}
          trend={findings.length > 5 ? 'degrading' : 'stable'}
          changeDelta={hasRealScans ? 'Real findings' : 'Sample findings'}
          subtitle={`Across ${selectedProject.key}`}
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
          onClick={() => navigate('/overview')}
        />
      </div>

      {/* 3. Real Monitored Repositories vs Demo Projects Matrix */}
      <div className="bento-card animate-bento-in p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold tracking-tight text-white">
                Repositories &amp; Monitored Projects
              </h1>
              {isDemoData ? (
                <Badge variant="demo" size="sm" />
              ) : (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-300">
                  Real Code Analysis
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Select any project card below to switch the active workspace context and inspect code risk metrics.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/integrations')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <span>Manage Integrations</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Real Connected Repository Card (if present) */}
        {selectedRepo && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-zinc-400 px-1">
              <span>Connected Provider Repository (Live)</span>
              <span className="text-[10px] text-emerald-400">Authorized Source Control</span>
            </div>
            <div
              onClick={() => {
                setSelectedProjectKey(selectedRepo.repo_full_name);
                if (hasRealScans) setIsDemoData(false);
              }}
              className={`bento-inner-card cursor-pointer p-5 transition-all rounded-2xl border ${
                selectedProject.key === selectedRepo.repo_full_name
                  ? 'ring-2 ring-[#FF5722] bg-[#FF5722]/[0.08] border-[#FF5722]/50'
                  : 'border-white/[0.08] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedRepo.repo_full_name}</h3>
                    {selectedProject.key === selectedRepo.repo_full_name && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5722]/20 border border-[#FF5722]/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#FF5722]">
                        <CheckCircle2 className="h-3 w-3" /> Active Context
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-400">
                    <span className="text-zinc-300 font-semibold uppercase">
                      {selectedRepo.provider}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-zinc-200">
                      <GitBranch className="h-3.5 w-3.5 text-[#FF5722]" />
                      branch: {selectedRepo.branch}
                    </span>
                    <span>•</span>
                    <span>{hasRealScans ? 'Scanned' : 'Pending Scan'}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xl font-bold text-white">
                    {hasRealScans ? (
                      <>
                        {selectedProject.debtScore}{' '}
                        <span className="text-xs font-normal text-zinc-400">
                          /100 (Grade {selectedProject.grade})
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-normal text-amber-300">Unscanned</span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-400">
                    {hasRealScans ? `${findings.length} findings detected` : 'Ready for scan'}
                  </span>
                </div>
              </div>

              {/* Action row */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  {hasRealScans
                    ? `Last scan completed: ${selectedProject.lastScan}`
                    : 'Click "Start Code Scan" above to analyze this repository'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleStartScan();
                    }}
                    className="rounded-lg bg-[#FF5722] hover:bg-[#e64a19] px-3 py-1 font-mono text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    {hasRealScans ? 'Re-Scan' : 'Scan Now'}
                  </button>
                  {hasRealScans && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDemoData(false);
                        navigate('/findings');
                      }}
                      className="rounded-lg bg-white/[0.08] hover:bg-white/[0.15] px-3 py-1 font-mono text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Inspect Findings</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Projects Section */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-zinc-400 px-1">
            <span>Demo Sample Projects (For Benchmarking &amp; Exploration)</span>
            <Badge variant="demo" size="sm" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {DEMO_PROJECTS.map((proj) => {
              const isSelected = selectedProject.key === proj.key;
              return (
                <div
                  key={proj.key}
                  onClick={() => {
                    setSelectedProjectKey(proj.key);
                    setIsDemoData(true);
                  }}
                  className={`bento-inner-card cursor-pointer p-5 transition-all rounded-2xl border ${
                    isSelected && isDemoData
                      ? 'ring-1 ring-[#FF5722]/60 bg-white/[0.05] border-[#FF5722]/40'
                      : 'border-white/[0.06] hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{proj.name}</h3>
                        {isSelected && isDemoData && (
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
                          {proj.branch}
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

                  <div className="my-3 border-t border-white/[0.06]" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      {proj.findingsCount} findings • {proj.totalLoc.toLocaleString()} LOC
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProjectKey(proj.key);
                        setIsDemoData(true);
                        navigate('/project-details');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/[0.08] px-2.5 py-1 font-mono text-xs font-semibold text-white hover:bg-[#FF5722] transition-colors"
                    >
                      <span>Project Details</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
