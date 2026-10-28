import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  User as UserIcon,
  CalendarClock,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/useAuth';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'SG';

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const navLinks = [
    { name: 'Product', href: '#product-preview', hasDropdown: true },
    { name: 'Features', href: '#features', hasDropdown: false },
    { name: 'How It Works', href: '#how-it-works', hasDropdown: false },
    { name: 'Resources', href: '#resources', hasDropdown: true },
    { name: 'Contact Us', href: '/book-demo', isRoute: true, hasDropdown: false },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isRoute?: boolean) => {
    if (isRoute) return;
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[#0b0c0e]/95 backdrop-blur-md border-b border-white/[0.08] shadow-md shadow-black/50'
          : 'bg-[#0b0c0e] border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between px-6 sm:px-8">
        {/* Left: Brand Mark */}
        <Link
          to="/"
          className="group focus:outline-none focus:ring-2 focus:ring-[#FF5722] rounded-lg p-1"
          title="SilentGuard AI - Code Risk Intelligence"
        >
          <BrandLogo size="md" />
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.name}
                to={link.href}
                className="transition-colors hover:text-white focus:outline-none focus:text-white"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href, link.isRoute)}
                className="group inline-flex items-center gap-1 transition-colors hover:text-white focus:outline-none focus:text-white"
              >
                <span>{link.name}</span>
                {link.hasDropdown && (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors" />
                )}
              </a>
            )
          )}
        </nav>

        {/* Right: Authenticated User Dropdown OR Log In + Get a free trial */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative flex items-center gap-2.5" ref={dropdownRef}>
              <Link
                to="/workspace"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-white transition-all"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-[#FF5722]" />
                <span>Workspace</span>
              </Link>

              <button
                type="button"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.05] hover:border-white/20 pl-1.5 pr-3 py-1 transition-all cursor-pointer"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5722] to-[#ff7043] text-[11px] font-bold text-white">
                  {userInitials}
                </div>
                <div className="flex flex-col items-start text-left leading-tight">
                  <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{user.id}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-12 w-68 rounded-2xl border border-white/10 bg-[#121215] p-2 shadow-2xl z-50">
                  <div className="px-3.5 py-2.5 border-b border-white/[0.06]">
                    <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                    <p className="font-mono text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1.5 space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.06] hover:text-white"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-[#FF5722]" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/my-bookings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.06] hover:text-white"
                    >
                      <CalendarClock className="h-3.5 w-3.5 text-[#FF5722]" />
                      <span>My Demo Bookings</span>
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin/bookings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-[#FF5722] hover:bg-[#FF5722]/10"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Admin Demo Requests</span>
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-white/[0.06] pt-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 px-4 py-2 text-xs sm:text-sm font-semibold text-black transition-all shadow-sm active:scale-[0.98]"
              >
                <span>Get a free trial</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle mobile menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0c0d0e]/98 px-6 py-6 backdrop-blur-xl animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-300 hover:text-white py-1"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href, link.isRoute)}
                  className="text-base font-medium text-slate-300 hover:text-white py-1 flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  {link.hasDropdown && <ChevronDown className="h-4 w-4 text-slate-500" />}
                </a>
              )
            )}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    to="/workspace"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white"
                  >
                    Open Workspace ({user.full_name})
                  </Link>
                  <Link
                    to="/my-bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-slate-200"
                  >
                    My Demo Bookings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-semibold text-red-300"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-slate-200"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 py-3 text-sm font-semibold text-black shadow-sm"
                  >
                    <span>Get a free trial</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
