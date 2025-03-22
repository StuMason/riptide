import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Context,
  Provider,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { ExtendedSession, SessionContext } from '../types';
import { parseUserAgent, getSessionDeviceInfo, getLocationInfo } from '../utils';
import { generateCsrfToken, validateCsrfToken } from '../auth/security';

// Create the session context with proper typing
const SessionContextInstance: Context<SessionContext | undefined> = createContext<
  SessionContext | undefined
>(undefined);

// Provider props
interface SessionProviderProps {
  children: ReactNode;
  supabase: any; // We'll use any here but in practice would type this properly
  user: User | null;
  enableCsrf?: boolean;
}

/**
 * Session Provider Component
 *
 * Provides session management context to all child components.
 *
 * @param props - The provider props
 * @returns The provider component
 */
export function SessionProvider({
  children,
  supabase,
  user,
  enableCsrf = true,
}: SessionProviderProps) {
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ExtendedSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Generate a CSRF token when the provider is mounted
  useEffect(() => {
    if (enableCsrf) {
      setCsrfToken(generateCsrfToken());
    }
  }, [enableCsrf]);

  // Load sessions when user changes
  useEffect(() => {
    if (user) {
      listSessions();
    } else {
      setSessions([]);
      setCurrentSession(null);
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Gets a CSRF token for session operations
   *
   * @returns The current CSRF token
   */
  const getCsrfToken = (): string => {
    // Regenerate the token if needed
    if (enableCsrf && !csrfToken) {
      const newToken = generateCsrfToken();
      setCsrfToken(newToken);
      return newToken;
    }
    return csrfToken;
  };

  /**
   * Lists all sessions for the current user
   *
   * @returns A promise resolving to the list of sessions
   */
  const listSessions = async (): Promise<ExtendedSession[]> => {
    if (!user) {
      return [];
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_revoked', false)
        .order('last_active_at', { ascending: false });

      if (error) throw error;

      // Transform database records to ExtendedSession objects
      const extendedSessions = data.map((session: any) => {
        const { browser, os, deviceType } = parseUserAgent(session.device_info?.userAgent);

        return {
          // Base Session properties
          id: session.id,
          access_token: '', // These fields would come from Supabase auth session
          refresh_token: '',
          expires_in: 0,
          expires_at: 0,
          token_type: 'bearer',
          user: user,

          // Extended properties
          device: {
            name: browser,
            os: os,
            type: deviceType,
          },
          location: {
            city: session.location_info?.city,
            country: session.location_info?.country,
            ip: session.ip_address,
          },
          last_active_at: session.last_active_at,
          is_current: session.is_current,
        } as ExtendedSession;
      });

      setSessions(extendedSessions);

      // Set current session
      const current =
        extendedSessions.find((session: ExtendedSession) => session.is_current) || null;
      setCurrentSession(current);

      return extendedSessions;
    } catch (error) {
      console.error('Error listing sessions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Revokes a specific session
   *
   * @param id - The ID of the session to revoke
   * @param token - Optional CSRF token for protection
   * @returns A promise resolving to a boolean indicating success
   */
  const revokeSession = async (id: string, token?: string): Promise<boolean> => {
    // Validate CSRF token if enabled
    if (enableCsrf && token) {
      if (!validateCsrfToken(token, csrfToken)) {
        console.error('CSRF token validation failed');
        return false;
      }
    }

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_revoked: true,
          is_current: false,
        })
        .eq('id', id);

      if (error) throw error;

      // Refresh the sessions list
      await listSessions();

      // Regenerate CSRF token after successful revocation for improved security
      if (enableCsrf) {
        setCsrfToken(generateCsrfToken());
      }

      return true;
    } catch (error) {
      console.error('Error revoking session:', error);
      return false;
    }
  };

  // Create context value
  const contextValue: SessionContext = {
    sessions,
    currentSession,
    isLoading,
    listSessions,
    revokeSession,
    getCsrfToken,
  };

  return (
    <SessionContextInstance.Provider value={contextValue}>
      {children}
    </SessionContextInstance.Provider>
  );
}

/**
 * Hook for using the session context
 *
 * @returns The session context
 * @throws Error if used outside a SessionProvider
 */
export function useSession(): SessionContext {
  const context = useContext(SessionContextInstance);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
