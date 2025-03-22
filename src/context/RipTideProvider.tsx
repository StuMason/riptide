import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { RipTideConfig, AuthContext } from '../types';
import * as AuthClient from '../auth/client';
import { checkRateLimit, resetRateLimit, verifyCaptcha } from '../auth/security';
import { SessionProvider } from './SessionProvider';
import { getSessionDeviceInfo, getLocationInfo } from '../utils';

// Create the authentication context
const AuthContext = createContext<AuthContext | undefined>(undefined);

// Provider props
interface RipTideProviderProps {
  children: ReactNode;
  config?: Partial<RipTideConfig>;
}

/**
 * RipTide Provider Component
 *
 * Provides authentication context to all child components.
 *
 * @param props - The provider props
 * @returns The provider component
 */
export function RipTideProvider({ children, config }: RipTideProviderProps) {
  // Initialize state
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Initialize Supabase client
  useEffect(() => {
    // Get config from props or environment variables
    const supabaseUrl = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey =
      config?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL and anonymous key are required');
      setIsLoading(false);
      return;
    }

    // Create Supabase client
    const client = createClient(supabaseUrl, supabaseAnonKey);
    setSupabase(client);

    // Get initial session and user
    const initializeAuth = async () => {
      try {
        const session = await AuthClient.getSession(client);

        if (session) {
          setSession(session);
          setUser(session.user);

          // Create/update user profile in database if not exists
          if (session.user) {
            try {
              await client.from('profiles').upsert(
                {
                  id: session.user.id,
                  last_sign_in_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
              );
            } catch (error) {
              console.error('Error updating profile:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      // Create/update sessions table on login
      if (event === 'SIGNED_IN' && newSession?.user) {
        try {
          // Get IP address and device info from client side if possible
          const deviceInfo = {
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
            language: typeof window !== 'undefined' ? window.navigator.language : '',
            platform: typeof window !== 'undefined' ? window.navigator.platform : '',
          };

          // Get session timeout from config or use default (30 days)
          const sessionTimeoutMs = config?.session?.timeoutMs || 30 * 24 * 60 * 60 * 1000;
          const expiresAt = new Date(Date.now() + sessionTimeoutMs).toISOString();

          // Create a new session record
          await client.from('user_sessions').insert({
            user_id: newSession.user.id,
            auth_session_id: newSession.user.id, // This is just a placeholder - in a real app you'd track the actual session ID
            device_info: deviceInfo,
            is_current: true,
            expires_at: expiresAt,
          });
        } catch (error) {
          console.error('Error recording session:', error);
        }
      }

      setIsLoading(false);
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [config]);

  // Authentication functions
  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Apply rate limiting by email (simple approach - could be enhanced with IP tracking)
    const rateLimitKey = `login:${email}`;

    // Check rate limit config
    const maxAttempts = config?.rateLimit?.max || 5;
    const windowMs = config?.rateLimit?.windowMs || 15 * 60 * 1000;

    if (!checkRateLimit(rateLimitKey, maxAttempts, windowMs)) {
      throw new Error(`Too many login attempts. Please try again later.`);
    }

    try {
      const session = await AuthClient.signIn(supabase, email, password);

      // Reset rate limit on successful login
      resetRateLimit(rateLimitKey);

      return session;
    } catch (error) {
      // Keep rate limit in place for failed attempts
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Handle CAPTCHA if enabled
    if (config?.enableCaptcha && typeof window !== 'undefined') {
      const captchaToken = (window as any).captchaToken; // This would be set by your CAPTCHA component

      if (!captchaToken) {
        throw new Error('CAPTCHA verification failed. Please try again.');
      }

      // Verify CAPTCHA if server-side secret is available
      if (process.env.CAPTCHA_SECRET_KEY) {
        const isValid = await verifyCaptcha(
          captchaToken,
          process.env.CAPTCHA_SECRET_KEY,
          config?.captchaProvider || 'recaptcha'
        );

        if (!isValid) {
          throw new Error('CAPTCHA verification failed. Please try again.');
        }
      }
    }

    const user = await AuthClient.signUp(supabase, email, password, { name });
    return user;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    // The token is handled by Supabase when redirecting to your app
    return AuthClient.resetPassword(supabase, newPassword);
  };

  const sendPasswordResetEmail = async (email: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;

    return AuthClient.sendPasswordResetEmail(supabase, email, redirectTo);
  };

  const verifyEmail = async (token: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    // The token is handled by Supabase when redirecting to your app
    return AuthClient.verifyEmail(supabase, token);
  };

  const logout = async () => {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Update the current session to inactive
    if (user) {
      try {
        await supabase
          .from('user_sessions')
          .update({ is_current: false })
          .eq('user_id', user.id)
          .eq('is_current', true);
      } catch (error) {
        console.error('Error updating session status:', error);
      }
    }

    await AuthClient.signOut(supabase);
  };

  // Context value
  const value: AuthContext = {
    isAuthenticated: !!user,
    isLoading,
    user,
    session,
    login,
    register,
    resetPassword,
    sendPasswordResetEmail,
    verifyEmail,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      <SessionProvider
        supabase={supabase}
        user={user}
        enableCsrf={config?.session?.enableCsrf !== false}
      >
        {children}
      </SessionProvider>
    </AuthContext.Provider>
  );
}

/**
 * Hook to use the authentication context
 *
 * @returns The authentication context
 * @throws Error if used outside of a RipTideProvider
 */
export function useAuth(): AuthContext {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within a RipTideProvider');
  }

  return context as AuthContext;
}
