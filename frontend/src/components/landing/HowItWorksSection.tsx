import React from 'react';
import { GitBranch, SearchCode, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Connect or Import Codebase',
      description:
        'Link your Git repository via GitHub Action, integrate into your existing CI/CD runner, or inspect local code via the SilentGuard CLI.',
      status: 'CLI & Local Active • Cloud Sync Planned',
      icon: GitBranch,
      color: 'from-violet-500 to-purple-600',
    },
    {
      number: '02',
      title: 'Analyze Findings & Structural Risk',
      description:
        'SilentGuard parses the Abstract Syntax Tree, maps trust boundaries, and correlates code against AI hallucination signatures and fragility metrics.',
      status: 'AST Analysis Active',
      icon: SearchCode,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      number: '03',
      title: 'Prioritize Remediation via Explainable Scores',
      description:
        'Review your Silent Debt Budget, inspect high-risk modules, and test verified fixes before changes merge to production.',
      status: 'Score Calibration Active • Auto-PR Coming Soon',
      icon: ShieldCheck,
      color: 'from-indigo-500 to-teal-500',
    },
  ];

  return (
    <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:px-8 border-t border-purple-950/40">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          How SilentGuard AI Works
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-300/80 leading-relaxed">
          From commit to production: transparent code intelligence with zero black-box magic.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="relative flex flex-col justify-between rounded-2xl border border-purple-900/30 bg-[#0c1020]/90 p-8 shadow-lg backdrop-blur-sm transition-all hover:border-purple-500/40"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} text-white shadow-md`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-2xl font-black text-purple-900/40">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-8 border-t border-purple-900/20 pt-4">
                <span className="inline-block rounded bg-purple-950/50 px-2 py-1 text-[11px] font-mono text-purple-300 border border-purple-900/40">
                  {step.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Call to action card */}
      <div className="mt-16 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#0d1226] to-indigo-950/40 p-8 sm:p-12 text-center backdrop-blur-md">
        <h3 className="text-2xl font-bold text-white sm:text-3xl">
          Ready to expose silent risk in your repositories?
        </h3>
        <p className="mt-3 max-w-xl mx-auto text-sm text-slate-300">
          Launch the developer workspace now to inspect sample codebases, review fragility metrics, and explore risk telemetry.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to="/workspace"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-purple-900/40 hover:scale-[1.02] transition-all"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
