import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { BrandLogo } from '../components/common/BrandLogo';

export const OAuthAuthorizePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthCallbackToken } = useAuth();

  const token = searchParams.get('token');
  const redirectTarget = searchParams.get('redirect') || '/workspace';
  const oauthError = searchParams.get('oauth_error');

  const [error, setError] = useState<string | null>(oauthError);

  useEffect(() => {
    if (oauthError) {
      return;
    }
    if (!token) {
      return;
    }

    let isMounted = true;
    const verifyCallback = async () => {
      try {
        await completeOAuthCallbackToken(token);
        if (isMounted) {
          const safeRedirect =
            redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')
              ? redirectTarget
              : '/workspace';
          navigate(safeRedirect, { replace: true });
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to verify OAuth session with the backend.'
          );
        }
      }
    };
    void verifyCallback();
    return () => {
      isMounted = false;
    };
  }, [completeOAuthCallbackToken, navigate, oauthError, redirectTarget, token]);

  const effectiveError =
    error || (!token ? 'Invalid OAuth callback: missing authorization session token.' : null);

  return (
    <div className="min-h-screen w-full bg-[#08080a] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bento-card rounded-3xl p-8 text-center space-y-5">
        <div className="flex justify-center">
          <BrandLogo size="md" />
        </div>

        {effectiveError ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white">OAuth Authorization Failed</h1>
            <p className="text-xs text-zinc-300 leading-relaxed">{effectiveError}</p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-[#FF5722] hover:bg-[#e64a19] px-5 py-2.5 text-xs font-semibold text-white transition-all"
              >
                Return to Sign In
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Verifying OAuth Session...</h1>
            <p className="text-xs text-zinc-400">
              Confirming your identity with the SilentGuard backend.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthAuthorizePage;
