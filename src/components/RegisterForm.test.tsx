import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterForm } from './RegisterForm';
import * as auth from '../auth';
import * as security from '../auth/security';
import * as utils from '../utils';

// Custom error type to match the component
interface AuthError extends Error {
  field?: string;
  code?: string;
}

// Mock the auth hooks
vi.mock('../auth', () => ({
  useRegister: vi.fn(),
}));

// Mock the security functions
vi.mock('../auth/security', () => ({
  generateCsrfToken: vi.fn(),
}));

// Mock utility functions
vi.mock('../utils', () => ({
  isValidEmail: vi.fn(),
  validatePassword: vi.fn(),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(security.generateCsrfToken).mockReturnValue('mock-csrf-token');
    vi.mocked(utils.isValidEmail).mockImplementation(email => email.includes('@'));
    vi.mocked(utils.validatePassword).mockImplementation(password => ({
      isValid: password.length >= 8,
      feedback:
        password.length >= 8 ? 'Password is strong' : 'Password must be at least 8 characters long',
    }));

    vi.mocked(auth.useRegister).mockReturnValue({
      register: vi.fn().mockResolvedValue({}),
      isLoading: false,
      error: null,
    });
  });

  it('renders the register form', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<RegisterForm />);

    // Submit without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Should display name validation error
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    // Fill the name field and submit again
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Should display email validation error
    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password strength and matching', async () => {
    render(<RegisterForm />);

    // Fill name and email but use weak password
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Should display password strength error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
    });

    // Use strong password but mismatched confirmation
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'DifferentPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Should display password match error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    const registerMock = vi.fn().mockResolvedValue({});
    vi.mocked(auth.useRegister).mockReturnValue({
      register: registerMock,
      isLoading: false,
      error: null,
    });

    const onSuccessMock = vi.fn();
    render(<RegisterForm onSuccess={onSuccessMock} />);

    // Fill all fields correctly
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongPass123!' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Verify register was called with correct args
    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        'Test User',
        'test@example.com',
        'StrongPass123!',
        expect.any(String)
      );
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  it('shows error messages from the registration hook', async () => {
    const authError = new Error('Email already in use') as AuthError;
    authError.field = 'email';

    vi.mocked(auth.useRegister).mockReturnValue({
      register: vi.fn().mockRejectedValue(authError),
      isLoading: false,
      error: authError,
    });

    render(<RegisterForm />);

    // Fill all fields correctly
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongPass123!' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Should display the error message from the hook
    await waitFor(() => {
      expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
    });
  });

  it('shows rate limiting error when appropriate', async () => {
    const authError = new Error('Too many attempts') as AuthError;
    authError.code = 'RATE_LIMITED';

    vi.mocked(auth.useRegister).mockReturnValue({
      register: vi.fn().mockRejectedValue(authError),
      isLoading: false,
      error: authError,
    });

    render(<RegisterForm />);

    // Fill all fields
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'StrongPass123!' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Should display rate limiting message
    await waitFor(() => {
      expect(screen.getByText(/too many registration attempts/i)).toBeInTheDocument();
    });
  });

  it('shows CAPTCHA when enabled', () => {
    render(<RegisterForm showCaptcha={true} />);
    expect(screen.getByTestId('captcha-container')).toBeInTheDocument();
  });
});
