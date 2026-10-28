import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Unplug,
  KeyRound,
  ExternalLink,
  ShieldAlert,
  Play,
  GitBranch,
  Lock,
  Globe,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

type ProviderStatus =
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'authorization_failed'
  | 'permission_insufficient'
  | 'token_expired_or_revoked'
  | 'disconnected';

interface VerifiedRepositoryItem {
  id: string;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  language: string;
}

interface ProviderIntegrationState {
  provider: 'github' | 'gitlab' | 'bitbucket';
  status: ProviderStatus;
  oauth_configured: boolean;
  required_env: string[];
  redirect_uri?: string;
  instance_url?: string | null;
  provider_account_id: string | null;
  provider_username: string | null;
  provider_email: string | null;
  scopes: string | null;
  accessible_repos_count: number;
  repositories: VerifiedRepositoryItem[];
  selected_repo_full_name: string | null;
  selected_branch: string | null;
  last_error: string | null;
  last_verified_at: string | null;
  updated_at: string | null;
}

const PROVIDER_LABELS: Record<
  'github' | 'gitlab' | 'bitbucket',
  { name: string; description: string; requiredScopes: string; consoleHint: string }
> = {
  github: {
    name: 'GitHub',
    description: 'Official GitHub OAuth 2.0 & REST API v2022-11-28 repository verification',
    requiredScopes: 'read:user, user:email, repo',
    consoleHint: 'GitHub Settings → Developer settings → OAuth Apps',
  },
  gitlab: {
    name: 'GitLab',
    description: 'GitLab.com & self-managed HTTPS OAuth 2.0 (PKCE S256) project verification',
    requiredScopes: 'read_user, read_api, read_repository',
    consoleHint: 'GitLab User Settings → Applications (Confidential + PKCE)',
  },
  bitbucket: {
    name: 'Bitbucket Cloud',
    description: 'Atlassian Bitbucket Cloud OAuth 2.0 workspace & repository verification',
    requiredScopes: 'account, repository',
    consoleHint: 'Bitbucket Workspace Settings → OAuth consumers',
  },
};

const STATUS_META: Record<
  ProviderStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  not_connected: {
    label: 'Not connected',
    badgeClass: 'bg-zinc-500/15 border-zinc-500/30 text-zinc-300',
    dotClass: 'bg-zinc-400',
  },
  connecting: {
    label: 'Connecting',
    badgeClass: 'bg-sky-500/15 border-sky-500/35 text-sky-300',
    dotClass: 'bg-sky-400 animate-pulse',
  },
  connected: {
    label: 'Connected',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
    dotClass: 'bg-emerald-400',
  },
  authorization_failed: {
    label: 'Authorization failed',
    badgeClass: 'bg-rose-500/15 border-rose-500/35 text-rose-300',
    dotClass: 'bg-rose-400',
  },
  permission_insufficient: {
    label: 'Permission insufficient',
    badgeClass: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
    dotClass: 'bg-amber-400',
  },
  token_expired_or_revoked: {
    label: 'Token expired or revoked',
    badgeClass: 'bg-red-500/15 border-red-500/35 text-red-300',
    dotClass: 'bg-red-400',
  },
  disconnected: {
    label: 'Disconnected',
    badgeClass: 'bg-zinc-500/15 border-zinc-500/30 text-zinc-400',
    dotClass: 'bg-zinc-500',
  },
};

export const RepositoryIntegrationsPanel: React.FC<{ redirectPath?: string }> = ({
  redirectPath = '/integrations',
}) => {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [integrations, setIntegrations] = useState<
    Record<'github' | 'gitlab' | 'bitbucket', ProviderIntegrationState> | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  // Per-provider optional token verification drawer & GitLab instance URL
  const [openTokenInput, setOpenTokenInput] = useState<Record<string, boolean>>({});
  const [tokenValues, setTokenValues] = useState<Record<string, string>>({});
  const [gitlabInstanceUrl, setGitlabInstanceUrl] = useState<string>('https://gitlab.com');

  // Per-provider branch list cache for the selected repository
  const [repoBranches, setRepoBranches] = useState<Record<string, string[]>>({});
  const [loadingBranches, setLoadingBranches] = useState<Record<string, boolean>>({});

  // Scan execution feedback
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'running' | 'success' | 'error';
    repo?: string;
    message?: string;
  }>(() => {
    const connectedProv = searchParams.get('integration_connected');
    const callbackErr = searchParams.get('integration_error');
    const errProv = searchParams.get('provider');
    if (connectedProv) {
      return {
        status: 'success',
        repo: connectedProv,
        message: `${connectedProv.toUpperCase()} account authorized and verified via live provider API.`,
      };
    }
    if (callbackErr) {
      return {
        status: 'error',
        repo: errProv || undefined,
        message: callbackErr,
      };
    }
    return { status: 'idle' };
  });

  const fetchBranchesForRepo = useCallback(
    async (provider: 'github' | 'gitlab' | 'bitbucket', repoFullName: string) => {
      if (!token || !repoFullName) return;
      const cacheKey = `${provider}:${repoFullName}`;
      setLoadingBranches((prev) => ({ ...prev, [cacheKey]: true }));
      try {
        const res = await fetch(
          `/api/integrations/${provider}/branches?repo=${encodeURIComponent(repoFullName)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.branches)) {
          setRepoBranches((prev) => ({ ...prev, [cacheKey]: data.branches }));
        }
      } catch {
        // Keep default branch fallback
      } finally {
        setLoadingBranches((prev) => ({ ...prev, [cacheKey]: false }));
      }
    },
    [token]
  );

  const fetchRepositoriesForProvider = useCallback(
    async (provider: 'github' | 'gitlab' | 'bitbucket', refresh = false) => {
      if (!token) return;
      try {
        const query = refresh ? '?refresh=true' : '';
        const res = await fetch(`/api/integrations/${provider}/repositories${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.repositories)) {
          setIntegrations((prev) =>
            prev
              ? {
                  ...prev,
                  [provider]: {
                    ...prev[provider],
                    repositories: data.repositories,
                    accessible_repos_count: data.repositories.length,
                    selected_repo_full_name:
                      data.selected_repo_full_name ?? prev[provider].selected_repo_full_name,
                    selected_branch:
                      data.selected_branch ?? prev[provider].selected_branch,
                  },
                }
              : prev
          );
        }
      } catch {
        // Retain existing state if background repository listing fails
      }
    },
    [token]
  );

  const fetchIntegrations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setGlobalError(null);
    try {
      const res = await fetch('/api/integrations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to load repository provider integrations.');
      }
      setIntegrations(data.integrations);
      if (data.integrations?.gitlab?.instance_url) {
        setGitlabInstanceUrl(data.integrations.gitlab.instance_url);
      }
      for (const prov of ['github', 'gitlab', 'bitbucket'] as const) {
        const st = data.integrations?.[prov];
        if (st?.status === 'connected') {
          void fetchRepositoriesForProvider(prov);
          if (st?.selected_repo_full_name) {
            void fetchBranchesForRepo(prov, st.selected_repo_full_name);
          }
        }
      }
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : 'Unable to fetch provider connection states.'
      );
    } finally {
      setLoading(false);
    }
  }, [token, fetchBranchesForRepo, fetchRepositoriesForProvider]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const initLoad = async () => {
      try {
        const res = await fetch('/api/integrations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!isMounted) return;
        if (res.ok && data.integrations) {
          setIntegrations(data.integrations);
          if (data.integrations?.gitlab?.instance_url) {
            setGitlabInstanceUrl(data.integrations.gitlab.instance_url);
          }
          for (const prov of ['github', 'gitlab', 'bitbucket'] as const) {
            const st = data.integrations?.[prov];
            if (st?.status === 'connected') {
              void fetchRepositoriesForProvider(prov);
              if (st?.selected_repo_full_name) {
                void fetchBranchesForRepo(prov, st.selected_repo_full_name);
              }
            }
          }
        } else {
          setGlobalError(data.detail || 'Failed to load integrations.');
        }
      } catch (err) {
        if (isMounted) {
          setGlobalError(err instanceof Error ? err.message : 'Failed to load integrations.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void initLoad();
    return () => {
      isMounted = false;
    };
  }, [token, fetchBranchesForRepo, fetchRepositoriesForProvider]);

  const handleOAuthConnect = async (provider: 'github' | 'gitlab' | 'bitbucket') => {
    if (!token) return;
    setBusyProvider(provider);
    setGlobalError(null);

    setIntegrations((prev) =>
      prev
        ? {
            ...prev,
            [provider]: {
              ...prev[provider],
              status: 'connecting',
              last_error: null,
            },
          }
        : prev
    );

    try {
      const res = await fetch(`/api/integrations/${provider}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          redirect_path: redirectPath,
          instance_url: provider === 'gitlab' ? gitlabInstanceUrl.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const updatedIntegration = data.detail?.integration;
        if (updatedIntegration) {
          setIntegrations((prev) =>
            prev ? { ...prev, [provider]: updatedIntegration } : prev
          );
        } else {
          await fetchIntegrations();
        }
        return;
      }

      if (data.authorization_url) {
        window.location.assign(data.authorization_url);
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : `Failed to start ${provider} OAuth.`);
      await fetchIntegrations();
    } finally {
      setBusyProvider(null);
    }
  };

  const handleTokenConnect = async (
    e: React.FormEvent,
    provider: 'github' | 'gitlab' | 'bitbucket'
  ) => {
    e.preventDefault();
    if (!token) return;
    const rawToken = (tokenValues[provider] || '').trim();
    if (!rawToken) return;

    setBusyProvider(provider);
    setIntegrations((prev) =>
      prev
        ? {
            ...prev,
            [provider]: {
              ...prev[provider],
              status: 'connecting',
              last_error: null,
            },
          }
        : prev
    );

    try {
      const res = await fetch(`/api/integrations/${provider}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          redirect_path: redirectPath,
          instance_url: provider === 'gitlab' ? gitlabInstanceUrl.trim() : undefined,
          access_token: rawToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      const updatedIntegration = data.integration || data.detail?.integration;
      if (updatedIntegration) {
        setIntegrations((prev) =>
          prev ? { ...prev, [provider]: updatedIntegration } : prev
        );
        if (
          updatedIntegration.status === 'connected' &&
          updatedIntegration.selected_repo_full_name
        ) {
          void fetchBranchesForRepo(provider, updatedIntegration.selected_repo_full_name);
        }
      } else {
        await fetchIntegrations();
      }
      if (res.ok) {
        setTokenValues((prev) => ({ ...prev, [provider]: '' }));
        setOpenTokenInput((prev) => ({ ...prev, [provider]: false }));
      }
    } finally {
      setBusyProvider(null);
    }
  };

  const handleSelectRepository = async (
    provider: 'github' | 'gitlab' | 'bitbucket',
    repoFullName: string,
    branch: string
  ) => {
    if (!token) return;
    setBusyProvider(provider);
    try {
      const res = await fetch(`/api/integrations/${provider}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repo_full_name: repoFullName,
          branch,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.integration) {
        setIntegrations((prev) =>
          prev ? { ...prev, [provider]: data.integration } : prev
        );
        void fetchBranchesForRepo(provider, repoFullName);
      } else {
        await fetchIntegrations();
      }
    } finally {
      setBusyProvider(null);
    }
  };

  const handleVerifyConnection = async (provider: 'github' | 'gitlab' | 'bitbucket') => {
    if (!token) return;
    setBusyProvider(provider);
    try {
      const res = await fetch(`/api/integrations/${provider}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      const updatedIntegration = data.integration || data.detail?.integration;
      if (updatedIntegration) {
        setIntegrations((prev) =>
          prev ? { ...prev, [provider]: updatedIntegration } : prev
        );
      } else {
        await fetchIntegrations();
      }
    } finally {
      setBusyProvider(null);
    }
  };

  const handleDisconnect = async (provider: 'github' | 'gitlab' | 'bitbucket') => {
    if (!token) return;
    setBusyProvider(provider);
    try {
      const res = await fetch(`/api/integrations/${provider}/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (data.integration) {
        setIntegrations((prev) =>
          prev ? { ...prev, [provider]: data.integration } : prev
        );
      } else {
        await fetchIntegrations();
      }
    } finally {
      setBusyProvider(null);
    }
  };

  const handleRunVerifiedScan = async (
    provider: 'github' | 'gitlab' | 'bitbucket',
    repoFullName: string,
    branch: string
  ) => {
    if (!token) return;
    setScanResult({ status: 'running', repo: `${repoFullName}@${branch}` });
    try {
      const res = await fetch('/api/repositories/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider,
          repo_full_name: repoFullName,
          branch,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setScanResult({
          status: 'error',
          repo: repoFullName,
          message: data.detail || `Repository scan rejected for ${repoFullName}.`,
        });
        await fetchIntegrations();
        return;
      }
      await fetchIntegrations();
      setScanResult({
        status: 'success',
        repo: repoFullName,
        message: `Scan ${data.scan_id} completed after verifying live ${provider} access on ${data.repository} (branch: ${data.branch}).`,
      });
    } catch (err) {
      setScanResult({
        status: 'error',
        repo: repoFullName,
        message: err instanceof Error ? err.message : 'Scan request failed.',
      });
    }
  };

  return (
    <div className="bento-card animate-bento-in p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FF5722]">
              SOURCE CONTROL INTEGRATIONS
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span className="font-mono text-[10px] text-zinc-400">
              Bound to User: {user?.email} ({user?.id})
            </span>
          </div>
          <h2 className="mt-1 text-base font-bold text-white">
            GitHub, GitLab &amp; Bitbucket Repository Connections
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Repository connections are verified against each provider&apos;s official API and kept
            strictly separate from your login session.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchIntegrations()}
          className="bento-pill-input self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#FF5722]' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {globalError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{globalError}</span>
        </div>
      )}

      {scanResult.status !== 'idle' && (
        <div
          className={`rounded-2xl border p-3.5 text-xs flex items-center justify-between gap-3 ${
            scanResult.status === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : scanResult.status === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-200'
              : 'border-sky-500/30 bg-sky-500/10 text-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {scanResult.status === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>
              {scanResult.status === 'running'
                ? `Verifying repository access and scanning ${scanResult.repo}...`
                : scanResult.message}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setScanResult({ status: 'idle' });
              if (
                searchParams.has('integration_connected') ||
                searchParams.has('integration_error')
              ) {
                const next = new URLSearchParams(searchParams);
                next.delete('integration_connected');
                next.delete('integration_status');
                next.delete('integration_error');
                next.delete('provider');
                setSearchParams(next, { replace: true });
              }
            }}
            className="text-zinc-400 hover:text-white font-mono text-[10px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3 Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['github', 'gitlab', 'bitbucket'] as const).map((prov) => {
          const item = integrations?.[prov];
          const status: ProviderStatus = item?.status || 'not_connected';
          const statusMeta = STATUS_META[status];
          const meta = PROVIDER_LABELS[prov];
          const isBusy = busyProvider === prov;
          const activeRepoName =
            item?.selected_repo_full_name || item?.repositories?.[0]?.full_name || null;
          const activeRepoObj =
            item?.repositories?.find((r) => r.full_name === activeRepoName) || null;
          const branchCacheKey = activeRepoName ? `${prov}:${activeRepoName}` : '';
          const availableBranches =
            (branchCacheKey && repoBranches[branchCacheKey]) ||
            (activeRepoObj ? [activeRepoObj.default_branch] : ['main']);
          const activeBranch =
            item?.selected_branch || activeRepoObj?.default_branch || 'main';

          return (
            <div
              key={prov}
              className="bento-inner-card rounded-2xl p-5 flex flex-col justify-between space-y-4 border border-white/[0.07]"
            >
              <div className="space-y-3">
                {/* Header & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{meta.name}</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      {meta.description}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold shrink-0 ${statusMeta.badgeClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                    {statusMeta.label}
                  </span>
                </div>

                {/* Connected Account vs Configuration Metadata */}
                <div className="rounded-xl bg-black/35 border border-white/[0.05] p-3 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">OAuth App Configured:</span>
                    <span
                      className={`font-mono font-semibold ${
                        item?.oauth_configured ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {item?.oauth_configured ? 'Yes (backend/.env)' : 'Missing Env Vars'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Required Scopes:</span>
                    <span className="font-mono text-zinc-300">{meta.requiredScopes}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-500 shrink-0">Callback URI:</span>
                    <code className="font-mono text-[10px] text-zinc-300 truncate">
                      {item?.redirect_uri ||
                        `http://localhost:8001/api/integrations/${prov}/callback`}
                    </code>
                  </div>
                  {item?.provider_username && (
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                      <span className="text-zinc-400 font-medium">Connected Account:</span>
                      <span className="font-mono font-semibold text-emerald-300">
                        @{item.provider_username}
                      </span>
                    </div>
                  )}
                  {item?.scopes && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Granted Scopes:</span>
                      <span className="font-mono text-emerald-300 truncate max-w-[160px]">
                        {item.scopes}
                      </span>
                    </div>
                  )}
                  {prov === 'gitlab' && (
                    <div className="pt-1">
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                        GitLab Instance URL (HTTPS)
                      </label>
                      <input
                        type="text"
                        value={gitlabInstanceUrl}
                        onChange={(e) => setGitlabInstanceUrl(e.target.value)}
                        placeholder="https://gitlab.com"
                        className="w-full h-8 rounded-lg border border-white/10 bg-black/50 px-2.5 font-mono text-[11px] text-white focus:border-[#FF5722] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Actionable Error Message Banner */}
                {item?.last_error && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] text-rose-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                      <span>{statusMeta.label}</span>
                    </div>
                    <p className="leading-relaxed">{item.last_error}</p>
                    {!item.oauth_configured && (
                      <p className="text-[10px] text-zinc-300 pt-1 border-t border-rose-500/20">
                        Set <code className="font-mono text-white">{prov.toUpperCase()}_CLIENT_ID</code> and{' '}
                        <code className="font-mono text-white">{prov.toUpperCase()}_CLIENT_SECRET</code> in{' '}
                        <code className="font-mono text-white">backend/.env</code> ({meta.consoleHint}) with callback{' '}
                        <code className="font-mono text-emerald-300">
                          {item.redirect_uri ||
                            `http://localhost:8001/api/integrations/${prov}/callback`}
                        </code>
                        , or verify a token below.
                      </p>
                    )}
                  </div>
                )}

                {/* Selected Repository & Branch Target + Repository List (when connected) */}
                {status === 'connected' && item && (
                  <div className="space-y-3">
                    {/* Selected Repository & Branch Box */}
                    {activeRepoName && (
                      <div className="rounded-xl border border-[#FF5722]/35 bg-[#FF5722]/[0.06] p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FF5722]">
                            Selected Target Repository
                          </span>
                          <span className="font-mono text-[10px] text-emerald-300">
                            Verified Read Access
                          </span>
                        </div>
                        <div className="font-mono text-xs font-bold text-white truncate">
                          {activeRepoName}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block font-mono text-[9px] uppercase text-zinc-400 mb-0.5">
                              Target Branch{' '}
                              {branchCacheKey && loadingBranches[branchCacheKey]
                                ? '(Loading...)'
                                : ''}
                            </label>
                            <select
                              value={activeBranch}
                              onChange={(e) =>
                                void handleSelectRepository(prov, activeRepoName, e.target.value)
                              }
                              className="w-full h-7 rounded-lg border border-white/15 bg-black/60 px-2 font-mono text-[11px] text-white focus:border-[#FF5722] focus:outline-none"
                            >
                              {availableBranches.map((br) => (
                                <option key={br} value={br} className="bg-zinc-900 text-white">
                                  {br}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void handleRunVerifiedScan(prov, activeRepoName, activeBranch)
                            }
                            className="self-end h-7 inline-flex items-center gap-1 rounded-lg bg-[#FF5722] hover:bg-[#e64a19] px-2.5 font-mono text-[10px] font-semibold text-white transition-colors shrink-0 cursor-pointer"
                          >
                            <Play className="h-2.5 w-2.5" />
                            <span>Scan Branch</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Accessible Repositories List */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono uppercase text-zinc-400">
                          Accessible Repositories ({item.accessible_repos_count})
                        </span>
                        <button
                          type="button"
                          onClick={() => void fetchRepositoriesForProvider(prov, true)}
                          className="inline-flex items-center gap-1 font-mono text-[10px] text-[#FF5722] hover:text-white transition-colors cursor-pointer"
                          title="Reload repositories from provider API"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          <span>Reload Repos</span>
                        </button>
                      </div>
                      {item.repositories.length === 0 ? (
                        <p className="text-[11px] text-zinc-500 italic">
                          Connected account has 0 repositories returned by provider API.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {item.repositories.map((repo) => {
                            const isSelectedRepo = repo.full_name === activeRepoName;
                            return (
                              <div
                                key={repo.id || repo.full_name}
                                onClick={() =>
                                  void handleSelectRepository(
                                    prov,
                                    repo.full_name,
                                    repo.default_branch
                                  )
                                }
                                className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-[11px] cursor-pointer transition-colors ${
                                  isSelectedRepo
                                    ? 'bg-[#FF5722]/15 border-[#FF5722]/50'
                                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {repo.private ? (
                                      <Lock className="h-3 w-3 text-amber-400 shrink-0" />
                                    ) : (
                                      <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
                                    )}
                                    <span className="font-mono font-semibold text-white truncate">
                                      {repo.full_name}
                                    </span>
                                  </div>
                                  <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-400 mt-0.5">
                                    <GitBranch className="h-2.5 w-2.5 text-[#FF5722]" />
                                    default: {repo.default_branch}
                                  </span>
                                </div>

                                <span
                                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-mono text-[10px] font-semibold shrink-0 ${
                                    isSelectedRepo
                                      ? 'bg-[#FF5722] text-white'
                                      : 'bg-white/[0.06] text-zinc-300'
                                  }`}
                                >
                                  {isSelectedRepo ? (
                                    <>
                                      <Check className="h-2.5 w-2.5" />
                                      <span>Selected</span>
                                    </>
                                  ) : (
                                    <span>Select</span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Direct Token Verification Form (for PAT / OAuth Token verification) */}
                {openTokenInput[prov] && (
                  <form
                    onSubmit={(e) => void handleTokenConnect(e, prov)}
                    className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-2.5"
                  >
                    <label className="block text-[11px] font-medium text-zinc-300">
                      Verify {meta.name} OAuth / Access Token via Live API
                    </label>
                    <input
                      type="password"
                      value={tokenValues[prov] || ''}
                      onChange={(e) =>
                        setTokenValues((prev) => ({ ...prev, [prov]: e.target.value }))
                      }
                      placeholder={`Paste ${meta.name} token (stored server-side only)`}
                      className="w-full h-8 rounded-lg border border-white/15 bg-black/60 px-2.5 font-mono text-[11px] text-white focus:border-[#FF5722] focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenTokenInput((prev) => ({ ...prev, [prov]: false }))
                        }
                        className="text-[11px] text-zinc-400 hover:text-white px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="rounded-lg bg-[#FF5722] hover:bg-[#e64a19] px-3 py-1 text-[11px] font-semibold text-white cursor-pointer"
                      >
                        Verify &amp; Connect
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                {status === 'connected' ? (
                  <>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleVerifyConnection(prov)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 py-2 px-3 text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                      <span>Re-Verify API</span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleDisconnect(prov)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 py-2 px-3 text-xs font-semibold text-red-300 transition-all cursor-pointer"
                    >
                      <Unplug className="h-3.5 w-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleOAuthConnect(prov)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FF5722] hover:bg-[#e64a19] py-2 px-3 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>
                        {status === 'authorization_failed' ||
                        status === 'permission_insufficient' ||
                        status === 'token_expired_or_revoked'
                          ? `Retry ${meta.name} OAuth`
                          : `Connect ${meta.name}`}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenTokenInput((prev) => ({ ...prev, [prov]: !prev[prov] }))
                      }
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] py-2 px-2.5 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title="Verify token directly against provider API"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-[#FF5722]" />
                      <span>Token</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
