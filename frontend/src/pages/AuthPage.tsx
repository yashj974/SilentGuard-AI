import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Building2,
  Info,
  ArrowRight,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';
import { SentinelWidget } from '../components/sentinel/SentinelWidget';
import { BrandLogo } from '../components/common/BrandLogo';
import { useAuth } from '../context/useAuth';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signup' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, signup, startGoogleOAuth, user } = useAuth();

  const redirectTarget =
    (location.state as { from?: string } | null)?.from || '/workspace';

  const routeDefaultMode =
    location.pathname === '/login' || location.pathname === '/auth' ? 'signin' : 'signup';
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot' | null>(null);
  const mode = activeTab ?? (initialMode || routeDefaultMode);

  const [isDarkPanel, setIsDarkPanel] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [googleState, setGoogleState] = useState<
    'idle' | 'connecting' | 'authorization_failed'
  >(() => (searchParams.get('oauth_error') ? 'authorization_failed' : 'idle'));
  const [googleConfigStatus, setGoogleConfigStatus] = useState<{
    configured: boolean;
    redirect_uri: string;
    required_env: string[];
  } | null>(null);
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadGoogleStatus = async () => {
      try {
        const res = await fetch('/api/auth/google/status');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data) {
          setGoogleConfigStatus({
            configured: Boolean(data.configured),
            redirect_uri:
              typeof data.redirect_uri === 'string'
                ? data.redirect_uri
                : 'http://localhost:8001/api/auth/google/callback',
            required_env: Array.isArray(data.required_env)
              ? data.required_env
              : ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
          });
        }
      } catch {
        // Keep null if backend status is unreachable
      }
    };
    void loadGoogleStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const [authStatusMessage, setAuthStatusMessage] = useState<{
    type: 'info' | 'error' | 'success';
    title: string;
    description: string;
  } | null>(() => {
    const callbackErr = searchParams.get('oauth_error');
    if (callbackErr) {
      return {
        type: 'error',
        title: 'Google OAuth Authorization Failed',
        description: callbackErr,
      };
    }
    return null;
  });

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid work email address';
    }

    if (mode !== 'forgot') {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (mode === 'signup') {
        if (!name.trim()) {
          newErrors.name = 'Full name is required';
        }
        if (password !== confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStatusMessage(null);

    if (!validate()) return;

    if (mode === 'forgot') {
      setAuthStatusMessage({
        type: 'info',
        title: 'Recovery Notification',
        description: `Password reset email dispatch requires SMTP configuration. Contact your SilentGuard administrator to reset credentials for ${email}.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        await signup({
          full_name: name.trim(),
          email: email.trim(),
          password,
          company: company.trim() || undefined,
        });
      } else {
        await login(email.trim(), password);
      }
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthStatusMessage({
        type: 'error',
        title: mode === 'signup' ? 'Registration Error' : 'Sign-In Failed',
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthStatusMessage(null);
    setGoogleState('connecting');
    setIsLoading(true);
    try {
      const authUrl = await startGoogleOAuth(redirectTarget);
      window.location.assign(authUrl);
    } catch (err) {
      setGoogleState('authorization_failed');
      const msg =
        err instanceof Error
          ? err.message
          : 'Google OAuth authorization failed to initialize.';
      setAuthStatusMessage({
        type: 'error',
        title: 'Google OAuth Not Configured / Authorization Failed',
        description: msg,
      });
      setIsLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setAuthStatusMessage(null);
    setIsLoading(true);
    try {
      await login('admin@silentguard.ai', 'Admin@SilentGuard2026!');
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Admin login failed';
      setAuthStatusMessage({
        type: 'error',
        title: 'Admin Sign-In Error',
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#050814] font-sans overflow-x-hidden selection:bg-[#FF5722] selection:text-white">
      {/* LEFT PANEL: Authentication Form */}
      <section
        className={`w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16 transition-colors duration-200 ${
          isDarkPanel ? 'bg-[#0a0c10] text-white' : 'bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <Link to="/" title="SilentGuard AI Homepage" className="group">
            <BrandLogo size="md" wordmarkClassName={isDarkPanel ? 'text-white' : 'text-slate-950'} />
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <Link
                to="/workspace"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF5722]/15 border border-[#FF5722]/30 px-3 py-1 text-xs font-semibold text-[#FF5722]"
              >
                <span>Signed in as {user.full_name} →</span>
              </Link>
            )}
            <Link
              to="/"
              className={`text-xs font-semibold transition-colors ${
                isDarkPanel ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ← Return to Home
            </Link>
          </div>
        </div>

        {/* Centered Auth Card Area */}
        <div className="mx-auto w-full max-w-[430px] my-auto py-8">
          <div className="text-center mb-6">
            <Link
              to="/book-demo"
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                isDarkPanel
                  ? 'bg-[#FF5722]/10 border border-[#FF5722]/25 text-[#FF5722] hover:bg-[#FF5722]/20'
                  : 'bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100'
              }`}
            >
              <span>Schedule a Live Engineering Demo</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            <h1
              className={`mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isDarkPanel ? 'text-white' : 'text-slate-950'
              }`}
            >
              {mode === 'forgot'
                ? 'Reset Password'
                : mode === 'signin'
                ? 'Welcome back'
                : 'Create your account'}
            </h1>

            <p
              className={`mt-2 text-sm leading-relaxed ${
                isDarkPanel ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {mode === 'forgot'
                ? 'Enter your work email address to receive password recovery instructions.'
                : 'Sign in with your verified work email and password or official Google OAuth 2.0.'}
            </p>
          </div>

          {/* OFFICIAL GOOGLE OAUTH 2.0 SIGN-IN */}
          {mode !== 'forgot' && (
            <div className="space-y-2.5 mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full h-[44px] rounded-xl border font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs ${
                  isDarkPanel
                    ? 'border-white/15 bg-white text-slate-950 hover:bg-slate-100'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-900'
                }`}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.6H12z"
                  />
                  <path
                    fill="#34A853"
                    d="M3.6 7.4l3.2 2.4c.9-2.2 3-3.8 5.2-3.8 1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 8.3 2.5 5.1 4.6 3.6 7.4z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 21.5c2.5 0 4.7-.8 6.3-2.3l-3-2.4c-.8.6-1.9 1-3.3 1-2.5 0-4.6-1.7-5.3-4l-3.2 2.5c1.5 3.1 4.7 5.2 8.5 5.2z"
                  />
                  <path
                    fill="#4285F4"
                    d="M21.1 12.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.3-1 2.4-2.2 3.1l3 2.4c1.7-1.6 2.8-4 2.8-7.8z"
                  />
                </svg>
                <span>
                  {googleState === 'connecting'
                    ? 'Redirecting to Google...'
                    : 'Continue with Google (Official OAuth 2.0)'}
                </span>
              </button>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 flex items-start gap-2.5 text-[11px] text-slate-400">
                <FolderGit2 className="h-4 w-4 text-[#FF5722] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Repository Connections (GitHub, GitLab, Bitbucket)</strong>{' '}
                  are kept separate from user login identity and are connected inside the{' '}
                  <span className="text-white font-medium">Projects</span> or{' '}
                  <span className="text-white font-medium">Settings</span> workspace after signing in.
                </span>
              </div>

              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink mx-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  Or sign in with work email
                </span>
                <div className="flex-grow border-t border-white/10" />
              </div>
            </div>
          )}

          {/* Status / Error Message Notification */}
          {authStatusMessage && (
            <div
              className={`mb-5 rounded-xl border p-3.5 text-xs space-y-2.5 ${
                authStatusMessage.type === 'error'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                  : 'border-sky-500/30 bg-sky-500/10 text-sky-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  {authStatusMessage.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  ) : (
                    <Info className="h-4 w-4 shrink-0" />
                  )}
                  <span>{authStatusMessage.title}</span>
                </div>
                {googleState === 'authorization_failed' && (
                  <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 font-mono text-[9px] uppercase text-rose-200 shrink-0">
                    Authorization failed
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">{authStatusMessage.description}</p>

              {/* Accurate Backend OAuth Configuration Status & Instructions */}
              {googleState === 'authorization_failed' && (
                <div className="mt-2 rounded-xl border border-white/15 bg-black/55 p-3.5 space-y-2 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#FF5722]">
                      Backend Google OAuth Configuration Status
                    </span>
                    <span
                      className={`font-mono text-[10px] font-semibold ${
                        googleConfigStatus?.configured ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {googleConfigStatus?.configured
                        ? 'Credentials Loaded in backend/.env'
                        : 'Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET'}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2 text-[10px] text-slate-300 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">
                        Required Google Cloud Authorized Redirect URI:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const uri =
                            googleConfigStatus?.redirect_uri ||
                            'http://localhost:8001/api/auth/google/callback';
                          void navigator.clipboard.writeText(uri);
                          setCopiedRedirectUri(true);
                          setTimeout(() => setCopiedRedirectUri(false), 2000);
                        }}
                        className="font-mono text-[10px] text-[#FF5722] hover:underline cursor-pointer"
                      >
                        {copiedRedirectUri ? 'Copied!' : 'Copy URI'}
                      </button>
                    </div>
                    <code className="block font-mono text-[10px] text-emerald-300 break-all">
                      {googleConfigStatus?.redirect_uri ||
                        'http://localhost:8001/api/auth/google/callback'}
                    </code>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Ensure <code className="font-mono text-white">GOOGLE_CLIENT_ID</code> and{' '}
                    <code className="font-mono text-white">GOOGLE_CLIENT_SECRET</code> are set in{' '}
                    <code className="font-mono text-white">backend/.env</code> on the server and
                    that the redirect URI above is registered under{' '}
                    <strong className="text-slate-200">Authorized redirect URIs</strong> in Google
                    Cloud Console.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Email & Password Form Section */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowEmailForm(!showEmailForm)}
              className={`w-full flex items-center justify-between text-xs font-semibold py-1.5 px-1 transition-colors ${
                isDarkPanel ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="uppercase tracking-wider">
                {mode === 'forgot'
                  ? 'Password Recovery'
                  : mode === 'signin'
                  ? 'Work Email Sign In'
                  : 'Work Email Registration'}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showEmailForm || mode === 'forgot' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {(showEmailForm || mode === 'forgot') && (
              <form onSubmit={handleSubmit} className="mt-2.5 space-y-3.5 text-left">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${
                          isDarkPanel ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Doe"
                          className={`w-full h-[42px] rounded-xl border py-1.5 pl-10 pr-3 text-xs placeholder-slate-400 focus:outline-none transition-all ${
                            isDarkPanel
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-[#FF5722]'
                              : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#FF5722]'
                          }`}
                        />
                      </div>
                      {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name}</p>}
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${
                          isDarkPanel ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        Company / Organization (Optional)
                      </label>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Acme Engineering"
                          className={`w-full h-[42px] rounded-xl border py-1.5 pl-10 pr-3 text-xs placeholder-slate-400 focus:outline-none transition-all ${
                            isDarkPanel
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-[#FF5722]'
                              : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#FF5722]'
                          }`}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDarkPanel ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      className={`w-full h-[42px] rounded-xl border py-1.5 pl-10 pr-3 text-xs placeholder-slate-400 focus:outline-none transition-all ${
                        isDarkPanel
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-[#FF5722]'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#FF5722]'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-[11px] text-red-400">{errors.email}</p>}
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        className={`block text-xs font-semibold ${
                          isDarkPanel ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('forgot');
                            setErrors({});
                            setAuthStatusMessage(null);
                          }}
                          className="text-[11px] font-medium text-[#FF5722] hover:underline transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full h-[42px] rounded-xl border py-1.5 pl-10 pr-10 text-xs placeholder-slate-400 focus:outline-none transition-all ${
                          isDarkPanel
                            ? 'bg-slate-900 border-slate-700 text-white focus:border-[#FF5722]'
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#FF5722]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-[11px] text-red-400">{errors.password}</p>
                    )}
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1 ${
                        isDarkPanel ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full h-[42px] rounded-xl border py-1.5 pl-10 pr-10 text-xs placeholder-slate-400 focus:outline-none transition-all ${
                          isDarkPanel
                            ? 'bg-slate-900 border-slate-700 text-white focus:border-[#FF5722]'
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#FF5722]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-[11px] text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[44px] rounded-xl bg-[#FF5722] hover:bg-[#e64a19] text-white font-semibold text-xs transition-all shadow-md shadow-orange-900/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <span>
                      {mode === 'signup' && 'Create Account & Sign In'}
                      {mode === 'signin' && 'Log In to Workspace'}
                      {mode === 'forgot' && 'Send Recovery Email'}
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Admin Quick Sign-In Helper */}
          <div className="mb-5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-center">
            <div className="text-[11px] text-slate-400 mb-2">
              Evaluating Admin Demo Request Management?
            </div>
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#FF5722]" />
              <span>Sign in as Bootstrap Admin (admin@silentguard.ai)</span>
            </button>
          </div>

          {/* Toggle between Sign Up and Log In */}
          <div
            className={`pt-5 border-t text-center text-xs ${
              isDarkPanel ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            {mode === 'signup' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrors({});
                    setAuthStatusMessage(null);
                  }}
                  className="font-bold text-[#FF5722] hover:underline transition-colors ml-1"
                >
                  Log In
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setErrors({});
                    setAuthStatusMessage(null);
                  }}
                  className="font-bold text-[#FF5722] hover:underline transition-colors ml-1"
                >
                  Sign Up
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Bottom Panel Controls */}
        <div
          className={`flex items-center justify-between text-[11px] pt-4 ${
            isDarkPanel ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          <span>© 2026 SilentGuard AI</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsDarkPanel(!isDarkPanel)}
              className="inline-flex items-center gap-1 hover:text-slate-300 transition-colors"
              title="Toggle theme"
            >
              {isDarkPanel ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
              <span>{isDarkPanel ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL: Enterprise Social Proof & Testimonial */}
      <section className="hidden lg:flex w-1/2 min-h-screen relative flex-col justify-between p-12 lg:p-16 overflow-hidden bg-[#060B1E]">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-1/4 -right-20 h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,_rgba(255,87,34,0.18)_0%,_rgba(37,99,235,0.1)_45%,_transparent_75%)] blur-[120px]" />
          <div className="absolute -bottom-32 -left-32 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,_rgba(79,70,229,0.16)_0%,_transparent_70%)] blur-[130px]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="relative z-10 h-8" />

        <div className="relative z-10 max-w-xl mx-auto my-auto text-left">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="h-6 w-6 rounded-md bg-[#FF5722] flex items-center justify-center text-white font-bold text-xs">
              <span className="tracking-tighter">LS</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-sans">
              LSports
            </span>
          </div>

          <blockquote className="text-2xl sm:text-3xl font-semibold text-white leading-relaxed tracking-tight">
            “Despite the increase in code volume from AI generation, quality metrics like production incidents and customer bugs are stable. SilentGuard protects us from dropping the maturity that we’ve reached.”
          </blockquote>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#FF5722]/40 bg-slate-800 flex items-center justify-center font-bold text-white">
              RY
            </div>
            <div>
              <div className="font-semibold text-white text-sm">Ronen Y.</div>
              <div className="text-xs text-slate-400">
                Director of Developer Experience at LSports
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-8 flex items-center justify-between text-xs text-slate-500">
          <span className="uppercase tracking-widest text-[10px] font-semibold text-slate-400">
            Trusted by AI-Assisted Engineering Teams
          </span>
          <div className="flex items-center gap-6 font-semibold text-slate-400 opacity-80">
            <span>Delivery Hero</span>
            <span>•</span>
            <span>Virta Health</span>
            <span>•</span>
            <span>Phunware</span>
          </div>
        </div>
      </section>

      <SentinelWidget />
    </div>
  );
};

export default AuthPage;
