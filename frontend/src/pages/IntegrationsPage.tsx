import React from 'react';
import {
  GitBranch,
  ShieldCheck,
  KeyRound,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { RepositoryIntegrationsPanel } from '../components/integrations/RepositoryIntegrationsPanel';
import { useAuth } from '../context/useAuth';

export const IntegrationsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      {/* Page Header Banner */}
      <div className="bento-card animate-bento-in p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF5722]/15 border border-[#FF5722]/30 text-[#FF5722]">
                <GitBranch className="h-4 w-4" />
              </div>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#FF5722]">
                WORKSPACE • REPOSITORY INTEGRATIONS
              </span>
            </div>
            <h1 className="mt-2 text-lg font-bold tracking-tight text-white">
              Source Control Provider Integrations
            </h1>
            <p className="mt-1 text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Connect your <strong>GitHub</strong>, <strong>GitLab</strong>, or{' '}
              <strong>Bitbucket</strong> account using official OAuth 2.0 authorization. Every
              connection is verified against the provider&apos;s live REST API on the backend before
              status changes to <strong>Connected</strong>, and all credentials remain strictly
              isolated to your signed-in SilentGuard account (
              <span className="font-mono text-zinc-200">{user?.email}</span>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              OAuth 2.0 + PKCE S256
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 font-mono text-[11px] text-zinc-300">
              <Lock className="h-3.5 w-3.5 text-[#FF5722]" />
              Backend-Only Token Storage
            </span>
          </div>
        </div>
      </div>

      {/* Live 3-Card Provider Integration Matrix (GitHub, GitLab, Bitbucket) */}
      <RepositoryIntegrationsPanel redirectPath="/integrations" />

      {/* Verification & Security Guarantees */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bento-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Live Provider API Confirmation</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            A provider card never displays <strong>Connected</strong> until the FastAPI backend
            completes the OAuth token exchange and verifies user identity, granted scopes, and real
            repository read access against the provider API.
          </p>
        </div>

        <div className="bento-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <GitBranch className="h-4 w-4 text-[#FF5722]" />
            <span>Repository &amp; Branch Selection</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Once connected, SilentGuard loads the real repositories accessible to your authorized
            account, lets you select the target repository, and fetches live branches via{' '}
            <code className="font-mono text-[11px] text-zinc-200">
              GET /api/integrations/&#123;provider&#125;/branches
            </code>
            .
          </p>
        </div>

        <div className="bento-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <KeyRound className="h-4 w-4 text-amber-400" />
            <span>Zero Client-Side Secret Exposure</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            OAuth client secrets, access tokens, and refresh tokens are stored exclusively on the
            backend and never returned to browser JavaScript or local storage. Disconnecting
            immediately revokes stored credentials.
          </p>
        </div>
      </div>
    </div>
  );
};
