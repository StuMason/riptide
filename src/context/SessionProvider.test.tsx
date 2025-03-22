import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SessionProvider, useSession } from './SessionProvider';
import { ExtendedSession } from '../types';
import { vi, describe, it, expect } from 'vitest';

// Mock security module
vi.mock('../auth/security', () => ({
  generateCsrfToken: vi.fn().mockReturnValue('test-csrf-token'),
  validateCsrfToken: vi.fn().mockReturnValue(true),
}));

// Mock user
const mockUser = {
  id: '123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: { name: 'Test User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

// Mock sessions
const mockSessions = [
  {
    id: 'session1',
    user_id: '123',
    auth_session_id: 'auth1',
    device_info: {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    location_info: { city: 'New York', country: 'USA' },
    ip_address: '192.168.1.1',
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    is_current: true,
    is_revoked: false,
  },
  {
    id: 'session2',
    user_id: '123',
    auth_session_id: 'auth2',
    device_info: {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    },
    location_info: { city: 'Los Angeles', country: 'USA' },
    ip_address: '192.168.1.2',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    last_active_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    is_current: false,
    is_revoked: false,
  },
];

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockSessions,
            error: null,
          })),
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: {},
        error: null,
      })),
    })),
  })),
};

// Test component that uses the session context with CSRF
function TestComponent() {
  const { sessions, currentSession, isLoading, revokeSession, getCsrfToken } = useSession();

  const handleRevoke = (sessionId: string) => {
    const csrfToken = getCsrfToken();
    revokeSession(sessionId, csrfToken);
  };

  return (
    <div>
      <h1>Sessions: {sessions.length}</h1>
      {isLoading ? (
        <p data-testid="loading">Loading...</p>
      ) : (
        <>
          <p data-testid="current-session">{currentSession?.id || 'No current session'}</p>
          <ul>
            {sessions.map(session => (
              <li key={session.id} data-testid={`session-${session.id}`}>
                {session.id}
                <button
                  data-testid={`revoke-${session.id}`}
                  onClick={() => handleRevoke(session.id)}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

describe('SessionProvider', () => {
  it('provides session context and lists sessions', async () => {
    render(
      <SessionProvider supabase={mockSupabase} user={mockUser} enableCsrf={true}>
        <TestComponent />
      </SessionProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for sessions to load
    await waitFor(() => {
      expect(screen.getByText('Sessions: 2')).toBeInTheDocument();
    });

    // Check that current session is shown
    expect(screen.getByTestId('current-session')).toHaveTextContent('session1');

    // Check that both sessions are listed by their test IDs
    expect(screen.getByTestId('session-session1')).toBeInTheDocument();
    expect(screen.getByTestId('session-session2')).toBeInTheDocument();
  });

  it('handles empty user state', () => {
    render(
      <SessionProvider supabase={mockSupabase} user={null} enableCsrf={true}>
        <TestComponent />
      </SessionProvider>
    );

    // No sessions when user is null
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByText('Sessions: 0')).toBeInTheDocument();
    expect(screen.getByTestId('current-session')).toHaveTextContent('No current session');
  });

  it('allows revoking sessions', async () => {
    // Reset mocks before test
    mockSupabase.from.mockClear();

    render(
      <SessionProvider supabase={mockSupabase} user={mockUser} enableCsrf={true}>
        <TestComponent />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sessions: 2')).toBeInTheDocument();
    });

    // Use test ID to get the revoke button
    const revokeButton = screen.getByTestId('revoke-session1');
    expect(revokeButton).toBeInTheDocument();

    // Click the button
    await act(async () => {
      revokeButton.click();
    });

    // Check that the from method was called
    expect(mockSupabase.from).toHaveBeenCalledWith('user_sessions');
  });
});
