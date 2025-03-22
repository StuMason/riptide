import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import * as AuthClient from './client';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
  },
} as unknown as SupabaseClient;

describe('Auth Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in a user with email and password', async () => {
      const mockSession = { user: { id: '123' } };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await AuthClient.signIn(mockSupabaseClient, 'test@example.com', 'password');

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result).toBe(mockSession);
    });

    it('should throw an error if sign in fails', async () => {
      const mockError = new Error('Invalid credentials');
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      await expect(
        AuthClient.signIn(mockSupabaseClient, 'test@example.com', 'wrong-password')
      ).rejects.toThrow(mockError);
    });

    it('should throw an error if no session is returned', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(
        AuthClient.signIn(mockSupabaseClient, 'test@example.com', 'password')
      ).rejects.toThrow('No session returned from login');
    });
  });

  describe('signUp', () => {
    it('should sign up a user with email and password', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await AuthClient.signUp(mockSupabaseClient, 'test@example.com', 'password', {
        name: 'Test User',
      });

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          data: { name: 'Test User' },
        },
      });
      expect(result).toBe(mockUser);
    });

    it('should throw an error if sign up fails', async () => {
      const mockError = new Error('Email already in use');
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      await expect(
        AuthClient.signUp(mockSupabaseClient, 'test@example.com', 'password')
      ).rejects.toThrow(mockError);
    });

    it('should throw an error if no user is returned', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        AuthClient.signUp(mockSupabaseClient, 'test@example.com', 'password')
      ).rejects.toThrow('User registration failed');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await AuthClient.sendPasswordResetEmail(
        mockSupabaseClient,
        'test@example.com',
        'https://example.com/reset-password'
      );

      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'https://example.com/reset-password' }
      );
      expect(result).toBe(true);
    });

    it('should return false if sending reset email fails', async () => {
      const mockError = new Error('User not found');
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: mockError,
      });

      const result = await AuthClient.sendPasswordResetEmail(
        mockSupabaseClient,
        'test@example.com'
      );

      expect(result).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should reset a user password', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      });

      const result = await AuthClient.resetPassword(mockSupabaseClient, 'newPassword123');

      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123',
      });
      expect(result).toBe(true);
    });

    it('should return false if password reset fails', async () => {
      const mockError = new Error('Invalid reset token');
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const result = await AuthClient.resetPassword(mockSupabaseClient, 'newPassword123');

      expect(result).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should sign out a user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      await AuthClient.signOut(mockSupabaseClient);

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should throw an error if sign out fails', async () => {
      const mockError = new Error('Session not found');
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: mockError,
      });

      await expect(AuthClient.signOut(mockSupabaseClient)).rejects.toThrow(mockError);
    });
  });

  describe('getSession', () => {
    it('should return the current session', async () => {
      const mockSession = { user: { id: '123' } };
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await AuthClient.getSession(mockSupabaseClient);

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
      expect(result).toBe(mockSession);
    });

    it('should throw an error if getting session fails', async () => {
      const mockError = new Error('Failed to get session');
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      await expect(AuthClient.getSession(mockSupabaseClient)).rejects.toThrow(mockError);
    });
  });

  describe('getUser', () => {
    it('should return the current user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await AuthClient.getUser(mockSupabaseClient);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it('should throw an error if getting user fails', async () => {
      const mockError = new Error('Failed to get user');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      await expect(AuthClient.getUser(mockSupabaseClient)).rejects.toThrow(mockError);
    });
  });
});
