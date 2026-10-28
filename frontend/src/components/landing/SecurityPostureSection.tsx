import React, { useState } from 'react';
import { Shield, RefreshCw, ArrowRight, CheckCircle2, Lock, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SecurityPostureSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'high'>('all');
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1200);
  };

  // Heatmap services and health blocks (green = clean, amber = warning, red = critical)
  const services = [
    { name: 'web', blocks: ['green', 'green', 'green', 'amber', 'green', 'green', 'green', 'green', 'amber', 'green', 'green', 'green'] },
    { name: 'app', blocks: ['green', 'green', 'red', 'green', 'green', 'green', 'green', 'green', 'green', 'green', 'amber', 'green'] },
    { name: 'api', blocks: ['green', 'amber', 'green', 'green', 'green', 'red', 'green', 'green', 'green', 'green', 'green', 'green'] },
    { name: 'auth', blocks: ['green', 'green', 'green', 'green', 'green', 'green', 'green', 'red', 'green', 'green', 'green', 'green'] },
    { name: 'workers', blocks: ['green', 'green', 'green', 'green', 'amber', 'green', 'green', 'green', 'green', 'green', 'green', 'green'] },
  ];

  const getColorClass = (type: string) => {
    switch (type) {
      case 'green':
        return 'bg-emerald-500/80 hover:bg-emerald-400';
      case 'amber':
        return 'bg-amber-400/90 hover:bg-amber-300';
      case 'red':
        return 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse';
      default:
        return 'bg-slate-700';
    }
  };

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-20 text-left border-t border-white/[0.06]">
      {/* Section Header */}
      <div className="max-w-3xl mb-14 scroll-reveal">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          AI threats need AI tools.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          With LLMs, time to exploit is &lt;1 day for disclosed vulnerabilities. SilentGuard AI reasons across your entire codebase to find what static rules miss.
        </p>
      </div>

      {/* Two-Column Split Layout with Sticky Left Security Overview Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Sticky Security Overview Dashboard Mockup */}
        <div className="lg:col-span-7 lg:sticky lg:top-28 scroll-reveal-left">
          {/* Outer container with warm subtle slate frame */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f12] p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-[#FF5722]" />
                <span className="text-xs font-semibold text-white tracking-wide">Security / Overview</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
                  main branch
                </span>
              </div>

              <button
                onClick={handleScan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5722] hover:bg-[#ff7a50] text-white text-xs font-medium transition shadow-md cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Scan repository'}</span>
              </button>
            </div>

            {/* Split Top Grid: Repository Posture Heatmap + Donut Distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Heatmap Grid (7 cols) */}
              <div className="sm:col-span-7 rounded-xl bg-[#121418] border border-white/[0.05] p-3.5 space-y-3 relative overflow-hidden">
                {/* Active Scanning Sweep Line */}
                {isScanning && (
                  <div className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-[#FF5722]/40 to-transparent pointer-events-none animate-scanline z-10" />
                )}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-white">Repository Posture</span>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Healthy
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> At Risk
                    </span>
                  </div>
                </div>

                {/* Heatmap Rows */}
                <div className="space-y-2">
                  {services.map((svc) => (
                    <div key={svc.name} className="flex items-center gap-2">
                      <span className="w-12 text-[10px] font-mono text-slate-400 text-right uppercase">
                        {svc.name}
                      </span>
                      <div className="flex-1 grid grid-cols-12 gap-1">
                        {svc.blocks.map((blockType, idx) => (
                          <div
                            key={idx}
                            title={`${svc.name} commit chunk #${idx + 1}: ${blockType}`}
                            className={`h-4 rounded-sm transition-all cursor-pointer ${getColorClass(
                              blockType
                            )}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Severity Distribution Donut Card (5 cols) */}
              <div className="sm:col-span-5 rounded-xl bg-[#121418] border border-white/[0.05] p-3.5 flex flex-col items-center justify-center space-y-3">
                <div className="w-full flex items-center justify-between text-[11px] font-semibold text-white">
                  <span>Severity Breakdown</span>
                  <span className="text-[10px] font-mono text-[#FF5722]">1,999 total</span>
                </div>

                {/* SVG Donut Chart */}
                <div className="relative flex items-center justify-center my-1">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="38" stroke="#1f232b" strokeWidth="10" fill="transparent" />
                    {/* Low (12%) - Cyan */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#06b6d4"
                      strokeWidth="10"
                      strokeDasharray="238.7"
                      strokeDashoffset="210"
                      fill="transparent"
                      strokeLinecap="round"
                    />
                    {/* Medium (45%) - Amber */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f59e0b"
                      strokeWidth="10"
                      strokeDasharray="238.7"
                      strokeDashoffset="131"
                      fill="transparent"
                    />
                    {/* High (40%) - Orange */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#FF5722"
                      strokeWidth="10"
                      strokeDasharray="238.7"
                      strokeDashoffset="35"
                      fill="transparent"
                    />
                    {/* Critical (3%) - Rose */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f43f5e"
                      strokeWidth="10"
                      strokeDasharray="238.7"
                      strokeDashoffset="231"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-bold text-white font-mono leading-none">1,999</span>
                    <span className="text-[9px] text-slate-400 font-mono">findings</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="w-full grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Critical: 47</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-[#FF5722]" />
                    <span>High: 808</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span>Med: 911</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span>Low: 236</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Security Trend Area Graph */}
            <div className="rounded-xl bg-[#121418] border border-white/[0.05] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Security Vulnerability Trend</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    ↓ 38% remediation velocity
                  </span>
                </div>
                <div className="flex gap-1">
                  {(['all', 'critical', 'high'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded cursor-pointer ${
                        activeTab === tab
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area SVG Chart */}
              <div className="w-full h-24 pt-2">
                <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="trendGradOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5722" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#FF5722" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="trendGradRose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="0" y1="25" x2="500" y2="25" stroke="#ffffff" strokeOpacity="0.05" />
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#ffffff" strokeOpacity="0.05" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#ffffff" strokeOpacity="0.05" />

                  {/* Area fill for High */}
                  <path
                    d="M0,80 Q70,65 140,55 T280,45 T420,30 L500,20 L500,100 L0,100 Z"
                    fill="url(#trendGradOrange)"
                  />
                  {/* Line for High */}
                  <path
                    d="M0,80 Q70,65 140,55 T280,45 T420,30 L500,20"
                    fill="none"
                    stroke="#FF5722"
                    strokeWidth="2"
                  />

                  {/* Area fill for Critical */}
                  <path
                    d="M0,90 Q90,85 180,75 T360,65 T450,55 L500,48 L500,100 L0,100 Z"
                    fill="url(#trendGradRose)"
                  />
                  {/* Line for Critical */}
                  <path
                    d="M0,90 Q90,85 180,75 T360,65 T450,55 L500,48"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                <span>90 days ago</span>
                <span>60 days ago</span>
                <span>30 days ago</span>
                <span className="text-[#FF5722] font-semibold">Today (Continuous)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Synchronized Feature Bullets matching CodeRabbit Screenshot 4 */}
        <div className="lg:col-span-5 space-y-5 scroll-reveal-right">
          <div
            onMouseEnter={() => setActiveTab('all')}
            onClick={() => setActiveTab('all')}
            className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white/[0.03] border-[#FF5722]/40 shadow-lg'
                : 'bg-transparent border-white/[0.05] hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Flame className="h-4 w-4 text-[#FF5722]" />
              <h3 className="text-lg font-bold text-white tracking-tight">Beyond static pattern matching</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Discovers complex vulnerabilities that static analyzers miss: broken tenant access control, tainted data across microservice boundaries, and subtle business logic drift.
            </p>
          </div>

          <div
            onMouseEnter={() => {
              setActiveTab('critical');
              handleScan();
            }}
            onClick={() => {
              setActiveTab('critical');
              handleScan();
            }}
            className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeTab === 'critical'
                ? 'bg-white/[0.03] border-[#FF5722]/40 shadow-lg'
                : 'bg-transparent border-white/[0.05] hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <RefreshCw className="h-4 w-4 text-[#FF5722]" />
              <h3 className="text-lg font-bold text-white tracking-tight">Continuous monitoring</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-3">
              Detect code rot and latent exposure as dependencies evolve, not just on quarterly audit cycles:
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pl-1 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Scheduled deep semantic graph scans</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Zero-latency risk score on every PR</span>
              </li>
            </ul>
          </div>

          <div
            onMouseEnter={() => setActiveTab('high')}
            onClick={() => setActiveTab('high')}
            className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeTab === 'high'
                ? 'bg-white/[0.03] border-[#FF5722]/40 shadow-lg'
                : 'bg-transparent border-white/[0.05] hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Lock className="h-4 w-4 text-[#FF5722]" />
              <h3 className="text-lg font-bold text-white tracking-tight">Verify &amp; repair</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Verify suspected vulnerabilities in isolated test harnesses and generate context-accurate pull requests to patch flaws before malicious actors find them.
            </p>
          </div>

          <div className="pt-2 pl-1">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5722] hover:text-[#ff7a50] transition-colors"
            >
              <span>Explore Security Posture in workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityPostureSection;