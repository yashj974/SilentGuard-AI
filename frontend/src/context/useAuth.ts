import { createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  job_title: string | null;
  role: 'user' | 'admin';
  auth_provider?: 'email' | 'google' | 'github' | 'gitlab' | 'bitbucket';
  created_at: string;
  updated_at: string;
}

export interface SignupInput {
  full_name: string;
  email: string;
  password: string;
  company?: string;
  job_title?: string;
}

export interface ProfileUpdateInput {
  full_name?: string;
  company?: string | null;
  job_title?: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (input: SignupInput) => Promise<AuthUser>;
  startGoogleOAuth: (redirectPath?: string) => Promise<string>;
  completeOAuthCallbackToken: (sessionToken: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
