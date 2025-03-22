import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RipTideProvider, useAuth } from './RipTideProvider';
import * as AuthClient from '../auth/client';

// Mock AuthClient functions
vi.mock('../auth/client', () => ({
  getSession: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  verifyEmail: vi.fn(),
  signOut: vi.fn(),
}));

// Mock security module
vi.mock('../auth/security', () => ({
  checkRateLimit: vi.fn().mockReturnValue(true),
  resetRateLimit: vi.fn(),
  verifyCaptcha: vi.fn().mockResolvedValue(true),
}));

// Mock Supabase client creation
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({}),
      insert: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      eq: vi.fn().mockReturnThis(),
    }),
  })),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'No User'}</div>
    </div>
  );
};

describe('RipTideProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', async () => {
    (AuthClient.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(
      <RipTideProvider config={{ supabaseUrl: 'https://example.com', supabaseAnonKey: 'key' }}>
        <TestComponent />
      </RipTideProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    // Wait for initialization to complete
    await vi.waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });

  it('should set authenticated state when session exists', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser };

    (AuthClient.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);

    render(
      <RipTideProvider config={{ supabaseUrl: 'https://example.com', supabaseAnonKey: 'key' }}>
        <TestComponent />
      </RipTideProvider>
    );

    // Wait for initialization to complete
    await vi.waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
  });

  it('should handle login function correctly', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { user: mockUser };

    (AuthClient.signIn as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);

    let loginFn: any;

    const LoginTest = () => {
      const auth = useAuth();
      loginFn = auth.login;
      return <div>Login Test</div>;
    };

    render(
      <RipTideProvider config={{ supabaseUrl: 'https://example.com', supabaseAnonKey: 'key' }}>
        <LoginTest />
      </RipTideProvider>
    );

    // Wait for initialization to complete
    await vi.waitFor(() => {
      // Ensure the component has rendered and loginFn is defined
      expect(loginFn).toBeDefined();
    });

    // Call the login function
    await loginFn('test@example.com', 'password');

    expect(AuthClient.signIn).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password'
    );
  });

  it('should handle register function correctly', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };

    (AuthClient.signUp as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    let registerFn: any;

    const RegisterTest = () => {
      const auth = useAuth();
      registerFn = auth.register;
      return <div>Register Test</div>;
    };

    render(
      <RipTideProvider config={{ supabaseUrl: 'https://example.com', supabaseAnonKey: 'key' }}>
        <RegisterTest />
      </RipTideProvider>
    );

    // Wait for initialization to complete
    await vi.waitFor(() => {
      // Ensure the component has rendered and registerFn is defined
      expect(registerFn).toBeDefined();
    });

    // Call the register function
    await registerFn('Test User', 'test@example.com', 'password');

    expect(AuthClient.signUp).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password',
      { name: 'Test User' }
    );
  });

  it('should handle password reset function correctly', async () => {
    (AuthClient.resetPassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    let resetPasswordFn: any;

    const ResetTest = () => {
      const auth = useAuth();
      resetPasswordFn = auth.resetPassword;
      return <div>Reset Test</div>;
    };

    render(
      <RipTideProvider config={{ supabaseUrl: 'https://example.com', supabaseAnonKey: 'key' }}>
        <ResetTest />
      </RipTideProvider>
    );

    // Wait for initialization to complete
    await vi.waitFor(() => {
      // Ensure the component has rendered and resetPasswordFn is defined
      expect(resetPasswordFn).toBeDefined();
    });

    // Call the reset password function
    await resetPasswordFn('token', 'newPassword123');

    expect(AuthClient.resetPassword).toHaveBeenCalledWith(expect.anything(), 'newPassword123');
  });

  it('should handle logout function correctly', async () => {
    (AuthClient.signOut as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    let logoutFn: any;

    const LogoutTest = () => {
      const auth = useAuth();
      logoutFn = auth.logout;
      return <div>Logout Test</div>;
    };

    render(
      <RipTideProvider config={{ supabaseUrl: 'https://example.com', supabaseAnonKey: 'key' }}>
        <LogoutTest />
      </RipTideProvider>
    );

    // Wait for initialization to complete
    await vi.waitFor(() => {
      // Ensure the component has rendered and logoutFn is defined
      expect(logoutFn).toBeDefined();
    });

    // Call the logout function
    await logoutFn();

    expect(AuthClient.signOut).toHaveBeenCalled();
  });

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within a RipTideProvider');

    // Restore console.error
    console.error = originalError;
  });
});
