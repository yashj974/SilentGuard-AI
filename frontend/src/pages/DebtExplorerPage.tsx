import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Wrench,
  Layers,
  Fingerprint,
  Flame,
  Wand2,
  Filter,
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
import { DEMO_OVERVIEW_DATA, DEMO_PROJECTS } from '../data/demoData';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/StateView';
import { useWorkspace } from '../context/useWorkspace';
import type { DebtCategory, Severity } from '../types';

export const DebtExplorerPage: React.FC = () => {
  const {
    selectedProject,
    setSelectedProjectKey,
    uiState,
    setUiState,
  } = useWorkspace();

  const [categoryFilter, setCategoryFilter] = useState<'all' | DebtCategory>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  if (uiState === 'loading') return <LoadingSkeleton />;
  if (uiState === 'empty') return <EmptyState onAction={() => setUiState('demo')} />;
  if (uiState === 'error') return <ErrorState onRetry={() => setUiState('demo')} />;

  const data = DEMO_OVERVIEW_DATA;
  const cats = selectedProject.categories;

  const filteredFingerprints = data.fingerprints.filter((fp) => {
    const matchCategory = categoryFilter === 'all' || fp.category === categoryFilter;
    const matchSeverity = severityFilter === 'all' || fp.severity === severityFilter;
    const matchModule =
      moduleFilter === 'all' ||
      (fp.affectedModules && fp.affectedModules.includes(moduleFilter));
    return matchCategory && matchSeverity && matchModule;
  });

  return (
    <div className="space-y-5">
      {/* Top 4 Technical & Security Debt Category Bento Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Security Debt Posture"
          value={cats.security.score}
          grade={cats.security.grade}
          trend={cats.security.trend}
          changeDelta={cats.security.changeDelta}
          issuesCount={cats.security.issuesCount}
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
          onClick={() => setCategoryFilter(categoryFilter === 'security' ? 'all' : 'security')}
        />
        <MetricCard
          title="Reliability Debt"
          value={cats.reliability.score}
          grade={cats.reliability.grade}
          trend={cats.reliability.trend}
          changeDelta={cats.reliability.changeDelta}
          issuesCount={cats.reliability.issuesCount}
          icon={<Activity className="h-4 w-4 text-emerald-400" />}
          onClick={() =>
            setCategoryFilter(categoryFilter === 'reliability' ? 'all' : 'reliability')
          }
        />
        <MetricCard
          title="Maintainability Debt"
          value={cats.maintainability.score}
          grade={cats.maintainability.grade}
          trend={cats.maintainability.trend}
          changeDelta={cats.maintainability.changeDelta}
          issuesCount={cats.maintainability.issuesCount}
          icon={<Wrench className="h-4 w-4 text-amber-400" />}
          onClick={() =>
            setCategoryFilter(
              categoryFilter === 'maintainability' ? 'all' : 'maintainability'
            )
          }
        />
        <MetricCard
          title="Architectural Debt"
          value={cats.architectural.score}
          grade={cats.architectural.grade}
          trend={cats.architectural.trend}
          changeDelta={cats.architectural.changeDelta}
          issuesCount={cats.architectural.issuesCount}
          icon={<Layers className="h-4 w-4 text-[#FF5722]" />}
          onClick={() =>
            setCategoryFilter(
              categoryFilter === 'architectural' ? 'all' : 'architectural'
            )
          }
        />
      </div>

      {/* Multi-Dimensional Filter Bar (Project, Module, Category, Severity) */}
      <div className="bento-card animate-bento-in p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Filter className="h-4 w-4 text-[#FF5722]" />
            <span>Filter Silent Debt Explorer</span>
            <Badge variant="demo" size="sm" />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Project Filter */}
            <select
              value={selectedProject.key}
              onChange={(e) => setSelectedProjectKey(e.target.value)}
              className="bento-pill-input rounded-xl px-3 py-1.5 font-mono text-xs text-white bg-zinc-900 focus:outline-none"
            >
              {DEMO_PROJECTS.map((p) => (
                <option key={p.key} value={p.key} className="bg-zinc-900 text-white">
                  Project: {p.key}
                </option>
              ))}
            </select>

            {/* Module Filter */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bento-pill-input rounded-xl px-3 py-1.5 font-mono text-xs text-white bg-zinc-900 focus:outline-none"
            >
              <option value="all" className="bg-zinc-900 text-white">
                All Modules (5)
              </option>
              {data.highestRiskModules.map((m) => (
                <option key={m.id} value={m.path} className="bg-zinc-900 text-white">
                  {m.path}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | DebtCategory)}
              className="bento-pill-input rounded-xl px-3 py-1.5 font-mono text-xs text-white bg-zinc-900 focus:outline-none"
            >
              <option value="all" className="bg-zinc-900 text-white">
                All Categories
              </option>
              <option value="security" className="bg-zinc-900 text-white">
                Security
              </option>
              <option value="reliability" className="bg-zinc-900 text-white">
                Reliability
              </option>
              <option value="maintainability" className="bg-zinc-900 text-white">
                Maintainability
              </option>
              <option value="architectural" className="bg-zinc-900 text-white">
                Architectural
              </option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as 'all' | Severity)}
              className="bento-pill-input rounded-xl px-3 py-1.5 font-mono text-xs text-white bg-zinc-900 focus:outline-none"
            >
              <option value="all" className="bg-zinc-900 text-white">
                All Severities
              </option>
              <option value="critical" className="bg-zinc-900 text-white">
                Critical
              </option>
              <option value="high" className="bg-zinc-900 text-white">
                High
              </option>
              <option value="medium" className="bg-zinc-900 text-white">
                Medium
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Two-Column Bento Split: Debt Accumulation & Budget vs Fingerprint Catalog */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left 5 cols: Debt Accumulation Trend & Sprint Budget Consumption */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <div className="bento-card animate-bento-in p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Debt Budget Consumption
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {data.debtBudget.sprintName}
                </p>
              </div>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-300">
                <Flame className="mr-1 inline h-3.5 w-3.5" />
                {data.debtBudget.burnRatePercentage}% Burn
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-black/40 border border-white/[0.06] p-3 text-center font-mono">
              <div>
                <div className="text-[10px] text-zinc-500">Allocated</div>
                <div className="text-base font-bold text-white">
                  {data.debtBudget.allocatedBudget} pts
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500">Consumed</div>
                <div className="text-base font-bold text-[#FF5722]">
                  {data.debtBudget.consumedBudget} pts
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500">Remaining</div>
                <div className="text-base font-bold text-emerald-400">
                  {data.debtBudget.remainingBudget} pts
                </div>
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF5722] to-rose-500"
                style={{ width: `${data.debtBudget.burnRatePercentage}%` }}
              />
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-semibold text-zinc-300">
                Composite Posture vs. Maintainability Trend
              </h3>
              <div className="mt-3 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.riskTrend}
                    margin={{ top: 8, right: 8, left: -28, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="compositeDebtFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF5722" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#FF5722" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.06)"
                    />
                    <XAxis
                      dataKey="period"
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis domain={[50, 95]} stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 15, 18, 0.96)',
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="maintainability"
                      name="Maintainability"
                      stroke="#f472b6"
                      strokeWidth={2}
                      fillOpacity={0}
                    />
                    <Area
                      type="monotone"
                      dataKey="compositeDebt"
                      name="Composite Posture"
                      stroke="#FF5722"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#compositeDebtFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 cols: Silent Debt Fingerprint Catalog & AI Evidence */}
        <div className="bento-card animate-bento-in p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">
                Silent Debt Fingerprint Catalog ({filteredFingerprints.length})
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Recurring issue patterns with concrete AST &amp; taint evidence supporting AI-assisted risk indicators.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5722]/15 border border-[#FF5722]/30 px-2.5 py-1 font-mono text-xs font-semibold text-[#FF5722]">
              <Fingerprint className="h-3.5 w-3.5" />
              Pattern Signatures
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {filteredFingerprints.map((fp) => (
              <div key={fp.id} className="bento-inner-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-white">{fp.patternName}</h3>
                    <Badge variant="category" category={fp.category} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 font-mono text-xs font-semibold text-white">
                      {fp.frequency} instances
                    </span>
                    <Badge variant="severity" severity={fp.severity} size="sm" />
                  </div>
                </div>

                <p className="mt-2 text-xs text-zinc-300 leading-relaxed">{fp.description}</p>

                {/* Concrete AST Evidence supporting the AI-risk indicator */}
                {fp.evidenceNote && (
                  <div className="mt-3 rounded-xl bg-black/40 border border-white/[0.06] p-3 text-xs">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
                      Supporting AST Evidence:
                    </span>
                    <p className="text-zinc-300">{fp.evidenceNote}</p>
                    {fp.affectedModules && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                        <span>Modules:</span>
                        {fp.affectedModules.map((m) => (
                          <span
                            key={m}
                            className="rounded bg-white/[0.06] px-1.5 py-0.5 text-zinc-200"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="my-3 border-t border-white/[0.06]" />

                <div className="flex items-center gap-2 text-xs text-zinc-200">
                  <Wand2 className="h-3.5 w-3.5 shrink-0 text-[#FF5722]" />
                  <span>
                    <strong>Recommended Mitigation:</strong> {fp.mitigationStrategy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
