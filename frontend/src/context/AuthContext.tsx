import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './useAuth';
import type { AuthUser, SignupInput, ProfileUpdateInput } from './useAuth';

const TOKEN_STORAGE_KEY = 'silentguard_session_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
  });

  const persistSession = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setIsLoading(false);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('silentguard_cached_user');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!activeToken) {
      clearSession();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        persistSession(activeToken, data.user);
      } else {
        clearSession();
      }
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, persistSession]);

  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      const activeToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!activeToken) {
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          persistSession(activeToken, data.user);
        } else {
          clearSession();
        }
      } catch {
        if (isMounted) clearSession();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void initSession();
    return () => {
      isMounted = false;
    };
  }, [clearSession, persistSession]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token || !data.user) {
      throw new Error(data.detail || 'Invalid email address or password.');
    }

    persistSession(data.token, data.user);
    return data.user;
  };

  const signup = async (input: SignupInput): Promise<AuthUser> => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token || !data.user) {
      throw new Error(data.detail || 'Failed to create account.');
    }

    persistSession(data.token, data.user);
    return data.user;
  };

  const startGoogleOAuth = async (redirectPath: string = '/workspace'): Promise<string> => {
    const qs = new URLSearchParams({ redirect: redirectPath }).toString();
    const res = await fetch(`/api/auth/google/start?${qs}`, {
      method: 'POST',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.authorization_url) {
      throw new Error(
        data.detail ||
          'Google OAuth is not configured on the backend server. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
      );
    }

    return data.authorization_url as string;
  };

  const completeOAuthCallbackToken = async (sessionToken: string): Promise<AuthUser> => {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.user) {
      clearSession();
      throw new Error(data.detail || 'Failed to verify OAuth session token.');
    }
    persistSession(sessionToken, data.user);
    return data.user;
  };

  const logout = async (): Promise<void> => {
    const activeToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (activeToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
      } catch {
        // Proceed with client cleanup even if network call fails
      }
    }
    clearSession();
  };

  const updateProfile = async (input: ProfileUpdateInput): Promise<AuthUser> => {
    const activeToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!activeToken) {
      throw new Error('Not authenticated');
    }

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify(input),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.user) {
      throw new Error(data.detail || 'Failed to update profile');
    }

    persistSession(activeToken, data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        startGoogleOAuth,
        completeOAuthCallbackToken,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
