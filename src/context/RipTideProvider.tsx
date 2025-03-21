import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { RipTideConfig, AuthContext } from '../types';

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
        const { data, error } = await client.auth.getSession();

        if (error) {
          throw error;
        }

        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
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
    } = client.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.session;
  };

  const register = async (name: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('User registration failed');
    return data.user;
  };

  const resetPassword = async (_token: string, newPassword: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return !error;
  };

  const sendPasswordResetEmail = async (email: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });

    return !error;
  };

  const verifyEmail = async (_token: string) => {
    // Note: Email verification is handled automatically by Supabase
    // This is a placeholder for any additional verification logic
    return true;
  };

  const logout = async () => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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

  return context;
}
