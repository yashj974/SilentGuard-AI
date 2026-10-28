import React from 'react';
import {
  Fingerprint,
  GitFork,
  Layers,
  Sparkles,
  Workflow,
} from 'lucide-react';

export const IntelligenceSection: React.FC = () => {
  return (
    <section id="intelligence" className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:px-8">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-300">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          CORE CAPABILITIES
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Four Layers of Code Risk Intelligence
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-300/80 leading-relaxed">
          Traditional linters look for known CVE signatures. SilentGuard is designed to uncover the hidden debt introduced by rapid AI code synthesis.
        </p>
      </div>

      {/* 4 Feature Grids */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Capability A: Silent Debt Fingerprint */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-900/30 bg-[#0c1020]/80 p-8 shadow-xl backdrop-blur-sm transition-all hover:border-purple-500/40 hover:shadow-purple-900/20 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-6 group-hover:scale-105 transition-transform">
            <Fingerprint className="h-6 w-6" />
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">Silent Debt Fingerprint</h3>
            <span className="rounded bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/20">
              Pattern Engine
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-300/90 leading-relaxed">
            Identifies recurring LLM anti-patterns across completions: hallucinated function parameters, unchecked trust boundary jumps, swallowed generic exceptions, and unthrottled loop logic.
          </p>

          <div className="mt-6 space-y-2 border-t border-purple-900/20 pt-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 text-purple-300">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span>Detects hallucinated SDK options & methods</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span>Highlights multi-tenant boundary escapes</span>
            </div>
          </div>
        </div>

        {/* Capability B: Change Fragility Index */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-900/30 bg-[#0c1020]/80 p-8 shadow-xl backdrop-blur-sm transition-all hover:border-purple-500/40 hover:shadow-purple-900/20 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-6 group-hover:scale-105 transition-transform">
            <GitFork className="h-6 w-6" />
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">Change Fragility Index (CFI)</h3>
            <span className="rounded bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-300 border border-orange-500/20">
              Impact Analysis
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-300/90 leading-relaxed">
            Measures code brittleness when automated changes occur. Simulates blast radius and dependency fan-out so reviewers know if a seemingly harmless 5-line diff cascades into downstream breakage.
          </p>

          <div className="mt-6 space-y-2 border-t border-purple-900/20 pt-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 text-orange-300">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <span>Calculates dependency coupling & fan-out</span>
            </div>
            <div className="flex items-center gap-2 text-orange-300">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <span>Flags untested execution branches in PRs</span>
            </div>
          </div>
        </div>

        {/* Capability C: Architectural Risk Intelligence */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-900/30 bg-[#0c1020]/80 p-8 shadow-xl backdrop-blur-sm transition-all hover:border-purple-500/40 hover:shadow-purple-900/20 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6 group-hover:scale-105 transition-transform">
            <Layers className="h-6 w-6" />
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">Architectural Risk Intelligence</h3>
            <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/20">
              System Topology
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-300/90 leading-relaxed">
            Surfaces macro-level architectural decay before it hits staging: unbounded memory buffers in stream processing, circular microservice couplings, and runaway async tasks.
          </p>

          <div className="mt-6 space-y-2 border-t border-purple-900/20 pt-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span>Identifies unbounded buffer denial-of-service risks</span>
            </div>
            <div className="flex items-center gap-2 text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span>Tracks latency drift & connection pool exhaustion</span>
            </div>
          </div>
        </div>

        {/* Capability D: Fix, Test, Rescore */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-900/30 bg-[#0c1020]/80 p-8 shadow-xl backdrop-blur-sm transition-all hover:border-purple-500/40 hover:shadow-purple-900/20 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6 group-hover:scale-105 transition-transform">
            <Workflow className="h-6 w-6" />
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">Fix, Test, Rescore</h3>
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/20">
              Verified Fix
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-300/90 leading-relaxed">
            The intended automated remediation workflow: understand the AST root cause, synthesize a minimal patch, execute the test suite in an isolated sandbox, and rescore the codebase upon verification.
          </p>

          <div className="mt-6 space-y-2 border-t border-purple-900/20 pt-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Automated AST diff generation</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Sandboxed regression validation before PR merge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Honest Capability Disclosure Callout */}
      <div className="mt-12 rounded-xl border border-purple-900/20 bg-purple-950/20 p-4 text-center text-xs text-slate-400 max-w-2xl mx-auto">
        <span className="text-purple-300 font-semibold">Engine Roadmap Note:</span> These capabilities represent SilentGuard AI's evolving intelligence architecture. Real-time CI/CD and AST rule packs are continuously expanded.
      </div>
    </section>
  );
};
