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
   * Authentication settings
   */
  auth?: {
    /**
     * Where to redirect when auth is required
     * @default '/login'
     */
    redirectTo?: string;

    /**
     * Require email verification
     * @default true
     */
    emailVerification?: boolean;

    /**
     * Minimum password length
     * @default 8
     */
    passwordMinLength?: number;

    /**
     * Whether to persist session across page reloads
     * @default true
     */
    persistSession?: boolean;
  };

  /**
   * CAPTCHA configuration
   */
  captcha?: {
    /**
     * Enable CAPTCHA for auth forms
     * @default false
     */
    enabled?: boolean;

    /**
     * CAPTCHA provider
     * @default 'recaptcha'
     */
    provider?: 'recaptcha' | 'hcaptcha';

    /**
     * CAPTCHA site key
     */
    siteKey?: string;

    /**
     * CAPTCHA secret key (server-side only)
     */
    secretKey?: string;

    /**
     * Show CAPTCHA after N failed attempts
     * @default 3
     */
    showAfterAttempts?: number;
  };

  /**
   * Legacy properties (deprecated)
   * @deprecated Use captcha.enabled instead
   */
  enableCaptcha?: boolean;

  /**
   * @deprecated Use captcha.provider instead
   */
  captchaProvider?: 'recaptcha' | 'hcaptcha';

  /**
   * @deprecated Use captcha.siteKey instead
   */
  captchaSiteKey?: string;

  /**
   * Rate limit configuration
   */
  rateLimit?: {
    /**
     * Enable rate limiting
     * @default true
     */
    enabled?: boolean;

    /**
     * Maximum number of requests
     * @default 5
     */
    max?: number;

    /**
     * Time window in milliseconds
     * @default 900000 (15 minutes)
     */
    windowMs?: number;

    /**
     * Don't count successful requests against the rate limit
     * @default true
     */
    skipSuccessfulRequests?: boolean;
  };

  /**
   * Session configuration
   */
  session?: {
    /**
     * Session timeout in milliseconds
     * @default 2592000000 (30 days)
     */
    timeoutMs?: number;

    /**
     * Enable CSRF protection for session operations
     * @default true
     */
    enableCsrf?: boolean;

    /**
     * Store device info with sessions
     * @default true
     */
    persistDeviceInfo?: boolean;

    /**
     * Track location data (country, city)
     * @default true
     */
    trackLocationInfo?: boolean;

    /**
     * Maximum concurrent sessions per user
     * @default 5
     */
    maxSessions?: number;
  };

  /**
   * UI settings
   */
  ui?: {
    /**
     * Theme for components
     * @default 'light'
     */
    theme?: 'light' | 'dark';

    /**
     * Custom CSS classes
     */
    customClasses?: {
      loginForm?: string;
      registerForm?: string;
      [key: string]: string | undefined;
    };
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
  id: string;
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
  login: (email: string, password: string, captchaToken?: string) => Promise<Session>;
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
  revokeSession: (id: string, csrfToken?: string) => Promise<boolean>;
  getCsrfToken: () => string;
}
