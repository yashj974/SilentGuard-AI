import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  GitBranch,
  FileCode2,
  ShieldAlert,
  SearchCode,
  GitFork,
  Wrench,
  Scale,
  BarChart3,
  Settings,
  ChevronUp,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useWorkspace } from '../../context/useWorkspace';
import { useAuth } from '../../context/useAuth';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { selectedProject, remediationStates } = useWorkspace();
  const { user } = useAuth();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    WORKSPACE: true,
    ANALYZE: true,
    REMEDIATE: true,
    GOVERN: true,
    ACCOUNT: true,
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const pendingFixesCount = Object.values(remediationStates).filter(
    (s) => s === 'proposed' || s === 'approved'
  ).length;

  const accountItems = [
    {
      name: 'My Profile',
      path: '/profile',
      icon: UserIcon,
      badge: null,
    },
    {
      name: 'My Demo Bookings',
      path: '/my-bookings',
      icon: CalendarClock,
      badge: null,
    },
    ...(user?.role === 'admin'
      ? [
          {
            name: 'Admin Demo Requests',
            path: '/admin/bookings',
            icon: ShieldCheck,
            badge: 'Admin',
          },
        ]
      : []),
  ];

  const navGroups = [
    {
      label: 'WORKSPACE',
      items: [
        {
          name: 'Overview',
          path: '/workspace',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          name: 'Projects',
          path: '/projects',
          icon: FolderGit2,
          badge: '4',
        },
        {
          name: 'Integrations',
          path: '/integrations',
          icon: GitBranch,
          badge: null,
        },
        {
          name: 'Project Details',
          path: '/project-details',
          icon: FileCode2,
          badge: null,
        },
      ],
    },
    {
      label: 'ANALYZE',
      items: [
        {
          name: 'Findings',
          path: '/findings',
          icon: ShieldAlert,
          badge: String(selectedProject.findingsCount),
        },
        {
          name: 'Debt Explorer',
          path: '/debt-explorer',
          icon: SearchCode,
          badge: null,
        },
        {
          name: 'Change Impact',
          path: '/change-impact',
          icon: GitFork,
          badge: null,
        },
      ],
    },
    {
      label: 'REMEDIATE',
      items: [
        {
          name: 'Remediation Lab',
          path: '/remediation-lab',
          icon: Wrench,
          badge: `${pendingFixesCount}`,
        },
      ],
    },
    {
      label: 'GOVERN',
      items: [
        {
          name: 'Risk Policies',
          path: '/risk-policies',
          icon: Scale,
          badge: null,
        },
        {
          name: 'Reports',
          path: '/reports',
          icon: BarChart3,
          badge: null,
        },
        {
          name: 'Settings',
          path: '/settings',
          icon: Settings,
          badge: null,
        },
      ],
    },
    {
      label: 'ACCOUNT',
      items: accountItems,
    },
  ];

  return (
    <aside
      className={`bento-sidebar relative z-20 flex flex-col justify-between transition-all duration-300 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand Header reusing Homepage BrandLogo + Reference Toggle */}
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.06]">
          <Link
            to="/"
            className="flex items-center gap-2.5 overflow-hidden group focus:outline-none"
            title="Return to SilentGuard AI Homepage"
          >
            <BrandLogo size="sm" showWordmark={!collapsed} />
          </Link>

          <button
            onClick={onToggleCollapse}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.06] text-zinc-400 hover:bg-white/[0.12] hover:text-white transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Grouped Navigation (Workspace, Analyze, Remediate, Govern, Account) */}
        <nav className="flex-1 space-y-3.5 px-3.5 py-3 overflow-y-auto">
          {navGroups.map((group) => {
            const isOpen = openGroups[group.label] ?? true;
            return (
              <div key={group.label} className="space-y-1">
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex w-full items-center justify-between px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <span>{group.label}</span>
                    <ChevronUp
                      className={`h-3 w-3 transition-transform duration-200 ${
                        isOpen ? '' : 'rotate-180'
                      }`}
                    />
                  </button>
                )}

                {isOpen && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          title={collapsed ? item.name : undefined}
                          className={`group flex items-center justify-between rounded-2xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                            isActive
                              ? 'bento-nav-active text-white'
                              : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-white text-zinc-950 shadow-sm'
                                  : 'bg-white/[0.05] text-zinc-400 group-hover:bg-white/[0.09] group-hover:text-zinc-200'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            {!collapsed && <span className="truncate">{item.name}</span>}
                          </div>

                          {!collapsed && item.badge && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/[0.12] px-1.5 font-mono text-[11px] font-semibold text-zinc-200">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Remediation Queue Card */}
      {!collapsed && (
        <div className="p-3.5">
          <div className="bento-card rounded-3xl p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="bento-icon-orb flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white">
                  <Wrench className="h-3.5 w-3.5 text-[#FF5722]" />
                </div>
                <span className="text-xs font-semibold text-white">Remediation Lab</span>
              </div>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase text-amber-300">
                Demo
              </span>
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
              {pendingFixesCount} proposed AST patches queued for explicit approval &amp; re-analysis.
            </p>

            <Link
              to="/remediation-lab"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#ff7043] py-2 px-3 text-xs font-semibold text-white shadow-[0_8px_20px_-4px_rgba(255,87,34,0.5)] hover:brightness-110 active:scale-[0.99] transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Inspect Patches</span>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
};
