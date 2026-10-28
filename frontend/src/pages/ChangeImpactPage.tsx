import React, { useState } from 'react';
import {
  GitFork,
  Activity,
  ShieldAlert,
  Layers,
  Wand2,
  ArrowRight,
} from 'lucide-react';
import { DEMO_OVERVIEW_DATA } from '../data/demoData';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';

export const ChangeImpactPage: React.FC = () => {
  const { selectedProject, uiState, setUiState } = useWorkspace();
  const [selectedModuleId, setSelectedModuleId] = useState<string>('mod-1');

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  const data = DEMO_OVERVIEW_DATA;
  const modules = data.highestRiskModules;
  const dependencies = data.moduleDependencies || [];

  const activeModule = modules.find((m) => m.id === selectedModuleId) || modules[0];
  const relatedEdges = dependencies.filter(
    (d) => d.fromModuleId === activeModule.id || d.toModuleId === activeModule.id
  );

  const getModuleName = (id: string) => {
    const found = modules.find((m) => m.id === id);
    return found ? found.path.split('/').pop() || found.path : id;
  };

  return (
    <div className="space-y-5">
      {/* Top 4 Change Fragility KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Change Fragility Index"
          value={data.fragility.score}
          trend="degrading"
          changeDelta={data.fragility.level}
          subtitle="Composite AST fan-out score"
          icon={<GitFork className="h-4 w-4 text-[#FF5722]" />}
        />
        <MetricCard
          title="Dependency Coupling"
          value={`${data.fragility.dependencyCoupling}%`}
          trend="degrading"
          changeDelta="Cross-service"
          subtitle={data.fragility.blastRadius}
          icon={<Layers className="h-4 w-4 text-amber-400" />}
        />
        <MetricCard
          title="Regression Sensitivity"
          value={`${data.fragility.aiRegressionRisk}%`}
          trend="degrading"
          changeDelta="High Risk"
          subtitle="In coupled AI modules"
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
        />
        <MetricCard
          title="Untested Branches"
          value={`${data.fragility.untestedBranchesCount}`}
          trend="stable"
          changeDelta="Paths"
          subtitle="Require unit coverage"
          icon={<Activity className="h-4 w-4 text-emerald-400" />}
        />
      </div>

      {/* Main Bento Split: Dependency Graph Visualization (7 cols) + CFI Reasoning & Blast Radius (5 cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left 7 cols: Interactive Module Dependency Graph based on actual sample data */}
        <div className="bento-card animate-bento-in p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-white">
                  Module Relationships &amp; Dependency Graph
                </h1>
                <Badge variant="demo" size="sm" />
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Derived from sample AST import &amp; RPC relationships in <span className="font-mono text-zinc-200">{selectedProject.key}</span>. Click any node to inspect its blast radius.
              </p>
            </div>
          </div>

          {/* Interactive Node Map */}
          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/45 p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => {
                const isSelected = mod.id === activeModule.id;
                const isConnected = relatedEdges.some(
                  (e) => e.fromModuleId === mod.id || e.toModuleId === mod.id
                );

                return (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`flex flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[#FF5722] bg-[#FF5722]/15 shadow-[0_0_25px_rgba(255,87,34,0.25)]'
                        : isConnected
                        ? 'border-white/20 bg-white/[0.06] hover:border-white/30'
                        : 'border-white/[0.06] bg-white/[0.02] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="rounded bg-black/50 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                        CFI: {mod.fragilityIndex}
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          mod.riskScore > 80 ? 'bg-rose-500' : 'bg-amber-400'
                        }`}
                      />
                    </div>
                    <div className="mt-2.5 font-mono text-xs font-bold text-white break-all">
                      {mod.path.split('/').pop()}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-zinc-400 truncate w-full">
                      {mod.path}
                    </div>
                    <div className="mt-3 flex w-full items-center justify-between border-t border-white/[0.06] pt-2 font-mono text-[10px] text-zinc-400">
                      <span>Fan-in: {mod.fanIn ?? 4}</span>
                      <span>Fan-out: {mod.fanOut ?? 5}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dependency Edges for Selected Module */}
            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                Active Coupling Edges for {activeModule.path.split('/').pop()} ({relatedEdges.length})
              </div>
              <div className="space-y-2">
                {relatedEdges.map((edge, idx) => (
                  <div
                    key={`${edge.fromModuleId}-${edge.toModuleId}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-white font-semibold">
                        {getModuleName(edge.fromModuleId)}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#FF5722]" />
                      <span className="rounded bg-[#FF5722]/15 border border-[#FF5722]/30 px-2 py-0.5 text-[10px] text-[#FF5722]">
                        {edge.relationship}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#FF5722]" />
                      <span className="text-white font-semibold">
                        {getModuleName(edge.toModuleId)}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400">
                      Coupling: <strong className="text-white">{edge.couplingWeight}%</strong>
                    </span>
                    <div className="w-full text-[11px] text-zinc-400 mt-0.5">
                      {edge.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Module Blast Radius Detail */}
          <div className="bento-inner-card mt-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-mono text-sm font-semibold text-white">
                Selected Component: {activeModule.path}
              </h3>
              <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-rose-300">
                Fragility Index: {activeModule.fragilityIndex}/100
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
              {activeModule.regressionReason}
            </p>
            {activeModule.blastRadiusEndpoints && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase text-zinc-400">
                  Downstream Blast Radius:
                </span>
                {activeModule.blastRadiusEndpoints.map((ep) => (
                  <span
                    key={ep}
                    className="rounded-lg bg-black/50 border border-white/[0.08] px-2.5 py-1 font-mono text-[11px] text-zinc-200"
                  >
                    {ep}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 cols: CFI Calculation Reasoning & Regression-Sensitive Components */}
        <div className="bento-card animate-bento-in flex flex-col justify-between p-6 lg:col-span-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">
              Change Fragility Reasoning
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              How the composite Change Fragility Index ({data.fragility.score}/100) is computed from structural evidence.
            </p>

            {/* Transparent Formula Breakdown */}
            <div className="bento-inner-card mt-4 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">1. Cross-Module Fan-In / Fan-Out Coupling</span>
                <span className="font-mono font-bold text-white">
                  {data.fragility.dependencyCoupling}% (Weight 0.40)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">2. Untested Branch Density (43 paths)</span>
                <span className="font-mono font-bold text-amber-300">
                  62% (Weight 0.35)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">3. Unverified AI Edit Concentration</span>
                <span className="font-mono font-bold text-[#FF5722]">
                  {data.fragility.aiRegressionRisk}% (Weight 0.25)
                </span>
              </div>
              <div className="border-t border-white/[0.06] pt-2.5 flex items-center justify-between font-mono">
                <span className="text-zinc-400">Composite CFI Score:</span>
                <span className="text-sm font-bold text-white">
                  {data.fragility.score} / 100 ({data.fragility.level})
                </span>
              </div>
            </div>

            {/* Regression-Sensitive Components List */}
            <h3 className="mt-6 text-sm font-semibold text-white">
              Regression-Sensitive Components
            </h3>
            <div className="mt-3 space-y-3">
              {modules.slice(0, 3).map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  className="bento-inner-card cursor-pointer p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-white">
                      {mod.path}
                    </span>
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
                      CFI {mod.fragilityIndex}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                    {mod.regressionReason}
                  </p>
                  <div className="my-2.5 border-t border-white/[0.06]" />
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Wand2 className="h-3.5 w-3.5 shrink-0 text-[#FF5722]" />
                    <span>
                      {mod.findingsCount} open findings • {mod.aiCodeRatio}% AI-authored LOC
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
