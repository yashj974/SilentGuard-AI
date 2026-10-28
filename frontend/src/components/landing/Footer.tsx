import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-[#08090c] pt-16 pb-12 px-6 sm:px-8 text-xs text-slate-400 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        {/* Top Grid: Brand & Categorized Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.06]">
          {/* Col 1: Brand & Identity */}
          <div className="col-span-2 space-y-4">
            <Link to="/" title="SilentGuard">
              <BrandLogo size="md" />
            </Link>
            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              Automated Code Risk Intelligence &amp; Silent Debt Detection for modern engineering teams.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 pt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>All systems operational · Engine v4.2</span>
            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <div className="font-semibold text-white uppercase text-[11px] tracking-wider">Product</div>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">AI Code Review</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Change Stack</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">PR Triage</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Security Posture</a></li>
              <li><Link to="/workspace" className="hover:text-white transition-colors">Interactive Demo</Link></li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div className="space-y-3">
            <div className="font-semibold text-white uppercase text-[11px] tracking-wider">Resources</div>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#resources" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#resources" className="hover:text-white transition-colors">CLI Quickstart</a></li>
              <li><Link to="/book-demo" className="hover:text-white transition-colors">Book a Demo</Link></li>
              <li><a href="#startup" className="hover:text-white transition-colors">Startup Program</a></li>
              <li><a href="#opensource" className="hover:text-white transition-colors">Open Source</a></li>
            </ul>
          </div>

          {/* Col 4: Platform */}
          <div className="space-y-3">
            <div className="font-semibold text-white uppercase text-[11px] tracking-wider">Platform</div>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/login" className="hover:text-white transition-colors">Log In</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Get a free trial</Link></li>
              <li><Link to="/workspace" className="text-[#FF5722] hover:text-[#ff7a50] transition-colors font-medium">Workspace</Link></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Security Disclosures</a></li>
            </ul>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MASSIVE OUTLINED TYPOGRAPHIC WATERMARK: "SilentGuard" (NO AI)            */}
        {/* ========================================================================= */}
        <div className="relative w-full overflow-hidden flex items-center justify-center -my-2 select-none pointer-events-none">
          <svg
            className="w-full h-auto max-h-36 sm:max-h-52 overflow-visible select-none"
            viewBox="0 0 1000 170"
            preserveAspectRatio="xMidYMid meet"
          >
            <text
              x="50%"
              y="60%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="none"
              stroke="#FF5722"
              strokeWidth="1.2"
              strokeOpacity="0.28"
              fontSize="148"
              fontWeight="900"
              letterSpacing="-2"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              SilentGuard
            </text>
          </svg>
        </div>

        {/* ========================================================================= */}
        {/* NEWSLETTER SUBSCRIPTION CARD (Matching CodeRabbit Screenshot)             */}
        {/* ========================================================================= */}
        <div className="relative rounded-xl border border-white/[0.08] bg-[#0c0d10] p-6 sm:p-7 shadow-2xl my-6">
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="font-bold text-[#FF5722] text-sm sm:text-base tracking-tight">
              Sign up for our newsletter
            </div>

            <div className="flex items-center gap-2 max-w-md w-full">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="youremail@domain.com"
                className="flex-1 rounded-lg bg-[#14161c] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5722] transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#181a20] hover:bg-[#22252e] text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>
          </form>

          {subscribed && (
            <div className="mt-2 text-[11px] text-emerald-400 font-mono">
              ✓ Subscribed! Thank you for following SilentGuard updates.
            </div>
          )}

          <p className="mt-4 text-[11px] text-slate-500 leading-relaxed max-w-4xl">
            By signing up you agree to our <a href="#terms" className="underline hover:text-slate-300">Terms of Use</a> and authorize SilentGuard to provide occasional updates about products and solutions. You understand that you can opt out at any time and that your data will be handled in accordance with <a href="#privacy" className="underline hover:text-slate-300">SilentGuard Privacy Policy</a>.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM LEGAL ROW (Matching CodeRabbit Screenshot)                         */}
        {/* ========================================================================= */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-6">
            <a href="#legal" className="hover:text-white transition-colors">Legal</a>
            <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#dpa" className="hover:text-white transition-colors">DPA</a>
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            SilentGuard Inc. © 2026
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;