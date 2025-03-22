import React, { useCallback } from 'react';
import { useAuth } from '../context/RipTideProvider';
import type { User } from '@supabase/supabase-js';

/**
 * Hook for login functionality
 */
export function useLogin() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const session = await login(email, password);
        return session;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  return {
    login: handleLogin,
    isLoading,
    error,
  };
}

/**
 * Hook for registration functionality
 */
export function useRegister() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleRegister = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await register(name, email, password);
        return user;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [register]
  );

  return {
    register: handleRegister,
    isLoading,
    error,
  };
}

/**
 * Hook for password reset functionality
 */
export function usePasswordReset() {
  const { sendPasswordResetEmail, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleSendResetEmail = useCallback(
    async (email: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await sendPasswordResetEmail(email);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [sendPasswordResetEmail]
  );

  const handleResetPassword = useCallback(
    async (token: string, newPassword: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await resetPassword(token, newPassword);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [resetPassword]
  );

  return {
    sendResetEmail: handleSendResetEmail,
    resetPassword: handleResetPassword,
    isLoading,
    error,
  };
}

/**
 * Hook for logout functionality
 */
export function useLogout() {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await logout();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  return {
    logout: handleLogout,
    isLoading,
    error,
  };
}

/**
 * Hook to check if user is authenticated
 */
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    user,
  };
}

/**
 * Hook for email verification
 */
export function useEmailVerification() {
  const { verifyEmail } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleVerifyEmail = useCallback(
    async (token: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await verifyEmail(token);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [verifyEmail]
  );

  return {
    verifyEmail: handleVerifyEmail,
    isLoading,
    error,
  };
}
