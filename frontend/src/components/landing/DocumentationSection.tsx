import React from 'react';
import { Terminal, Scale, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DocumentationSection: React.FC = () => {
  return (
    <section id="docs" className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:px-8 border-t border-white/[0.06]">
      <div className="text-left max-w-3xl mb-14">
        <div className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase mb-3">
          DEVELOPER ARCHITECTURE & FORMULAS
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Engine specifications & debt scoring model.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          How SilentGuard AI calculates the composite debt score, evaluates AST divergence, and enforces quality gates across the CI/CD lifecycle.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 text-left">
        {/* Scoring Methodology */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0e1013] p-7 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/20">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Silent Debt Score Weights</h3>
              <p className="text-xs text-slate-400">Calibrated risk attribution model</p>
            </div>
          </div>

          <div className="space-y-3 mt-6 text-xs">
            <div className="flex justify-between items-center p-3 rounded-lg bg-[#14161b] border border-white/[0.04]">
              <span className="text-slate-300 font-medium">Security Risk (Trust Boundaries & SSRF)</span>
              <span className="font-mono font-bold text-[#FF5722]">35% Weight</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-[#14161b] border border-white/[0.04]">
              <span className="text-slate-300 font-medium">Change Fragility (Blast Radius & Coupling)</span>
              <span className="font-mono font-bold text-[#FF5722]">25% Weight</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-[#14161b] border border-white/[0.04]">
              <span className="text-slate-300 font-medium">Reliability (API Schema & Divergence Drift)</span>
              <span className="font-mono font-bold text-[#FF5722]">25% Weight</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-[#14161b] border border-white/[0.04]">
              <span className="text-slate-300 font-medium">Maintainability (Exception Swallowing & Complexity)</span>
              <span className="font-mono font-bold text-[#FF5722]">15% Weight</span>
            </div>
          </div>
        </div>

        {/* CLI & Local Integration */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0e1013] p-7 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/20">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">CLI & CI/CD Gate Enforcement</h3>
                <p className="text-xs text-slate-400">Run locally or in GitHub Actions / GitLab CI</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Integrate with pre-commit hooks or automated pipeline workflows to stop silent architecture drift before pull requests merge.
            </p>

            <div className="rounded-lg bg-[#08090b] border border-white/[0.06] p-4 font-mono text-xs text-slate-300 space-y-1.5 select-all">
              <div className="text-slate-500"># Install the SilentGuard CLI tool</div>
              <div>$ curl -sSL https://get.silentguard.ai | bash</div>
              <div className="text-slate-500 pt-1"># Evaluate repo and assert against debt policy</div>
              <div>$ silentguard scan --fail-on-debt-threshold=75</div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-slate-400">Documentation v0.1.0</span>
            <Link
              to="/workspace"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF5722] hover:text-[#ff7a50] transition-colors"
            >
              <span>Explore full specs in Workspace</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DocumentationSection;
