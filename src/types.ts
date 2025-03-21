/**
 * Type definitions for RipTide
 */

import { Session, User } from '@supabase/supabase-js';

/**
 * RipTide provider configuration options
 */
export interface RipTideConfig {
  /**
   * Supabase URL
   */
  supabaseUrl: string;

  /**
   * Supabase anonymous key
   */
  supabaseAnonKey: string;

  /**
   * Enable CAPTCHA for auth forms
   * @default false
   */
  enableCaptcha?: boolean;

  /**
   * CAPTCHA provider
   * @default 'recaptcha'
   */
  captchaProvider?: 'recaptcha' | 'hcaptcha';

  /**
   * CAPTCHA site key
   */
  captchaSiteKey?: string;

  /**
   * Rate limit configuration
   */
  rateLimit?: {
    /**
     * Maximum number of requests
     * @default 100
     */
    max?: number;

    /**
     * Time window in milliseconds
     * @default 900000 (15 minutes)
     */
    windowMs?: number;
  };
}

/**
 * User profile update data
 */
export interface ProfileUpdateData {
  name?: string;
  email?: string;
  avatar_url?: string;
  [key: string]: string | undefined;
}

/**
 * API Token
 */
export interface Token {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  last_used_at?: string;
}

/**
 * Session with additional information
 */
export interface ExtendedSession extends Session {
  device?: {
    name: string;
    os: string;
    type: string;
  };
  location?: {
    city?: string;
    country?: string;
    ip: string;
  };
  last_active_at: string;
  is_current: boolean;
}

/**
 * Authentication context
 */
export interface AuthContext {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<Session>;
  register: (name: string, email: string, password: string) => Promise<User>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  sendPasswordResetEmail: (email: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

/**
 * User management context
 */
export interface UserContext {
  user: User | null;
  isLoading: boolean;
  updateProfile: (data: ProfileUpdateData) => Promise<User>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<boolean>;
}

/**
 * Token management context
 */
export interface TokenContext {
  tokens: Token[];
  isLoading: boolean;
  createToken: (name: string, scopes: string[]) => Promise<Token>;
  listTokens: () => Promise<Token[]>;
  revokeToken: (id: string) => Promise<boolean>;
}

/**
 * Session management context
 */
export interface SessionContext {
  sessions: ExtendedSession[];
  currentSession: ExtendedSession | null;
  isLoading: boolean;
  listSessions: () => Promise<ExtendedSession[]>;
  revokeSession: (id: string) => Promise<boolean>;
}
