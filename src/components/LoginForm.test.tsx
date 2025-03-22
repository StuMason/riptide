import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from './LoginForm';
import * as auth from '../auth';
import * as security from '../auth/security';

// Custom error type to match the component
interface AuthError extends Error {
  field?: string;
  code?: string;
}

// Mock the auth hooks
vi.mock('../auth', () => ({
  useLogin: vi.fn(),
}));

// Mock the security functions
vi.mock('../auth/security', () => ({
  generateCsrfToken: vi.fn(),
}));

describe('LoginForm', () => {
  const mockLogin = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(auth.useLogin).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
    });

    vi.mocked(security.generateCsrfToken).mockReturnValue('mock-csrf-token');
  });

  it('renders the login form correctly', () => {
    render(<LoginForm />);

    // Check if form elements are present
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits the form with correct data', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check if login was called with correct data
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state while submitting', () => {
    vi.mocked(auth.useLogin).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
    });

    render(<LoginForm />);

    const button = screen.getByRole('button', { name: /signing in/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('shows error messages when validation fails', () => {
    const errorWithField = new Error('Invalid email format') as AuthError;
    errorWithField.field = 'email';

    vi.mocked(auth.useLogin).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: errorWithField,
    });

    render(<LoginForm />);

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('displays rate limit warning when rate limited', () => {
    const rateLimitError = new Error('Too many attempts') as AuthError;
    rateLimitError.code = 'RATE_LIMITED';

    vi.mocked(auth.useLogin).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: rateLimitError,
    });

    render(<LoginForm />);

    expect(screen.getByText(/too many login attempts/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onSuccess callback after successful login', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} />);

    // Fill out and submit the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Mock successful login
    mockLogin.mockResolvedValueOnce({});

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check if onSuccess was called
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('renders CAPTCHA container when showCaptcha is true', () => {
    render(<LoginForm showCaptcha={true} />);

    expect(screen.getByTestId('captcha-container')).toBeInTheDocument();
  });
});
