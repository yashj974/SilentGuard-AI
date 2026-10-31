import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  FolderGit2,
  GitBranch,
  Home,
  Sun,
  Moon,
  Layers,
  X,
  User as UserIcon,
  CalendarClock,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { DEMO_OVERVIEW_DATA } from '../../data/demoData';
import { useWorkspace } from '../../context/useWorkspace';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../theme/useTheme';
import { Badge } from '../common/Badge';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    selectedProject,
    setSelectedProjectKey,
    uiState,
    setUiState,
    globalSearch,
    setGlobalSearch,
    backendStatus,
    isDemoData,
    availableProjects,
    hasRealScans,
  } = useWorkspace();
  const { user, logout } = useAuth();
  const { resolvedTheme, setThemeMode } = useTheme();

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
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
    await logout();
    navigate('/login', { replace: true });
  };

  const matchingFindings = globalSearch.trim()
    ? DEMO_OVERVIEW_DATA.highestPriorityFindings.filter((f) => {
        const q = globalSearch.toLowerCase();
        return (
          f.title.toLowerCase().includes(q) ||
          f.ruleId.toLowerCase().includes(q) ||
          f.filePath.toLowerCase().includes(q) ||
          (f.cwe && f.cwe.toLowerCase().includes(q))
        );
      })
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    if (location.pathname !== '/findings') {
      navigate('/findings');
    }
  };

  return (
    <header className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 lg:px-7">
      {/* Left: Global Search Pill + Project Context Switcher */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Frosted Search Pill */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={globalSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setSearchFocused(false), 180);
            }}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search rule IDs, files, CWEs, or findings..."
            className="bento-pill-input h-10 w-60 sm:w-68 lg:w-80 rounded-2xl pl-10 pr-8 text-xs text-zinc-100 placeholder-zinc-500 focus:border-white/25 focus:outline-none transition-all"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch('')}
              className="absolute right-2.5 text-zinc-500 hover:text-zinc-200"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Quick Search Results Dropdown */}
          {searchFocused && globalSearch.trim().length > 0 && (
            <div className="bento-card absolute left-0 top-12 w-96 rounded-2xl p-2 z-50">
              <div className="px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Matching Findings ({matchingFindings.length})
              </div>
              {matchingFindings.length > 0 ? (
                <div className="space-y-1">
                  {matchingFindings.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSearchFocused(false);
                        navigate('/findings');
                      }}
                      className="flex w-full flex-col items-start rounded-xl px-3 py-2 text-left text-xs hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-[#FF5722]">
                          {f.ruleId}
                        </span>
                        <span className="font-medium text-white truncate max-w-[230px]">
                          {f.title}
                        </span>
                      </div>
                      <span className="mt-0.5 font-mono text-[10px] text-zinc-400">
                        {f.filePath}:{f.line}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 text-xs text-zinc-500">
                  No matching findings in sample dataset. Press Enter to open Findings X-Ray.
                </div>
              )}
            </div>
          )}
        </form>

        {/* Active Project Selector with Branch & Commit Context */}
        <div className="relative">
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="bento-pill-input flex h-10 items-center gap-2 rounded-2xl px-3.5 text-xs font-medium text-zinc-200 hover:border-white/20 transition-all cursor-pointer"
            title="Switch Active Repository Context"
          >
            <FolderGit2 className="h-3.5 w-3.5 text-[#FF5722]" />
            <span className="font-mono font-semibold text-white max-w-[170px] truncate">
              {selectedProject.key}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 rounded-lg bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
              <GitBranch className="h-2.5 w-2.5 text-[#FF5722]" />
              {selectedProject.branch} • {selectedProject.latestCommit}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </button>

          {projectDropdownOpen && (
            <div className="bento-card absolute left-0 mt-2 w-80 rounded-2xl p-2 z-50 shadow-2xl">
              <div className="px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Select Repository Context</span>
                {hasRealScans && (
                  <span className="text-[9px] text-emerald-400 font-normal">Real Scans Available</span>
                )}
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {availableProjects.map((proj) => {
                  const isReal = proj.key.includes('/');
                  return (
                    <button
                      key={proj.key}
                      onClick={() => {
                        setSelectedProjectKey(proj.key);
                        setProjectDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer ${
                        selectedProject.key === proj.key
                          ? 'bg-white/[0.1] text-white font-semibold'
                          : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex flex-col items-start min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="font-mono text-xs text-white truncate max-w-[160px]">
                            {proj.key}
                          </span>
                          {isReal ? (
                            <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-1 py-0.2 font-mono text-[8px] font-semibold text-emerald-300">
                              Connected
                            </span>
                          ) : (
                            <span className="rounded bg-zinc-700/40 border border-zinc-600/30 px-1 py-0.2 font-mono text-[8px] font-semibold text-zinc-400">
                              Demo
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-zinc-400 mt-0.5">
                          {proj.branch} • {proj.totalLoc > 0 ? `${proj.totalLoc.toLocaleString()} LOC` : 'Unscanned'}
                        </span>
                      </div>
                      <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] font-bold text-[#FF5722] shrink-0">
                        {proj.debtScore} ({proj.grade})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Unmistakable Demo vs Verified Real Scan Badge */}
        {isDemoData ? (
          <Badge variant="demo" size="sm" />
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 font-mono text-[10px] font-semibold text-emerald-300 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>REAL REPOSITORY SCAN ({selectedProject.branch})</span>
          </span>
        )}
      </div>

      {/* Right: UI State Switcher, Engine Status, Theme, Home & Authenticated User Control */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* UI State Switcher (Demo / Loading / Empty / Error) */}
        <div className="bento-pill-input hidden 2xl:flex items-center gap-1 rounded-full p-1 text-[11px]">
          <span className="flex items-center gap-1 pl-2.5 pr-1 font-mono text-[10px] text-zinc-400">
            <Layers className="h-3 w-3 text-[#FF5722]" />
            State:
          </span>
          {(
            [
              { id: 'demo', label: 'Demo' },
              { id: 'loading', label: 'Loading' },
              { id: 'empty', label: 'Empty' },
              { id: 'error', label: 'Error' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => setUiState(s.id)}
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] transition-all ${
                uiState === s.id
                  ? 'bg-[#FF5722] text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Unified Capsule: Truthful Engine Status + Theme Toggle + Homepage Link */}
        <div className="bento-pill-input flex items-center gap-2.5 rounded-full px-3.5 py-1.5">
          <div
            className="flex items-center gap-1.5 text-xs"
            title={
              backendStatus === 'online'
                ? 'FastAPI /api/health endpoint is reachable.'
                : 'FastAPI backend (/api/health) is offline.'
            }
          >
            {backendStatus === 'online' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline font-mono text-[11px] text-emerald-300">
                  API Online
                </span>
              </>
            ) : backendStatus === 'offline' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-zinc-500" />
                <span className="hidden sm:inline font-mono text-[11px] text-zinc-400">
                  Engine Offline
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="hidden sm:inline font-mono text-[11px] text-amber-300">
                  Checking...
                </span>
              </>
            )}
          </div>

          <span className="h-4 w-px bg-white/[0.08]" />

          <button
            onClick={() => setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="text-zinc-400 hover:text-white transition-colors"
            title="Toggle Dark / Light Theme"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="h-4 w-4 text-[#FF5722]" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </button>

          <span className="h-4 w-px bg-white/[0.08]" />

          <Link
            to="/"
            className="flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            title="Return to SilentGuard AI Homepage"
          >
            <Home className="h-3.5 w-3.5 text-[#FF5722]" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>

        {/* Authenticated User Profile Control (Top-Right) */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen((prev) => !prev)}
              aria-expanded={userDropdownOpen}
              className="bento-pill-input flex items-center gap-2.5 rounded-full pl-1.5 pr-3 py-1 hover:border-white/25 transition-all cursor-pointer"
              title={`Signed in as ${user.full_name} (${user.email})`}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5722] to-[#ff7043] text-[11px] font-bold text-white shadow-sm">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col items-start text-left leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                  {user.role === 'admin' && (
                    <span className="rounded bg-[#FF5722]/20 border border-[#FF5722]/40 px-1 py-0.2 font-mono text-[9px] font-bold uppercase text-[#FF5722]">
                      Admin
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-zinc-400 max-w-[140px] truncate">
                  {user.email}
                </span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${
                  userDropdownOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {userDropdownOpen && (
              <div className="bento-card absolute right-0 mt-2 w-72 rounded-2xl p-2 z-50 shadow-2xl">
                {/* User Identity Header */}
                <div className="px-3.5 py-2.5 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {user.full_name}
                    </span>
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                      {user.id}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-400 truncate">
                    {user.email}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-emerald-300">
                      via {user.auth_provider || 'email'}
                    </span>
                    {user.company && (
                      <span className="text-[11px] text-zinc-500 truncate">{user.company}</span>
                    )}
                  </div>
                </div>

                {/* Dropdown Navigation Items */}
                <div className="py-1.5 space-y-0.5">
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-[#FF5722]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/my-bookings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <CalendarClock className="h-3.5 w-3.5 text-[#FF5722]" />
                    <span>My Demo Bookings</span>
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin/demo-requests"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium text-[#FF5722] hover:bg-[#FF5722]/10 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Demo Requests</span>
                      </span>
                      <span className="rounded bg-[#FF5722]/20 px-1.5 py-0.5 font-mono text-[9px] uppercase">
                        Admin
                      </span>
                    </Link>
                  )}

                  <Link
                    to="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#FF5722]" />
                    <span>Account Settings</span>
                  </Link>
                </div>

                {/* Logout Action */}
                <div className="border-t border-white/[0.06] pt-1.5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
