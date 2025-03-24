import * as React from 'react';
import { useLogin } from '../auth';
import { generateCsrfToken } from '../auth/security';
import { Captcha } from './Captcha';

interface LoginFormProps {
  /**
   * Called when login is successful
   */
  onSuccess?: () => void;

  /**
   * URL to redirect to after successful login
   */
  redirectUrl?: string;

  /**
   * Whether to show CAPTCHA (requires RipTideProvider to have enableCaptcha set to true)
   */
  showCaptcha?: boolean;

  /**
   * Custom CSS classes for the form
   */
  className?: string;
}

// Add custom error type to extend the standard Error
interface AuthError extends Error {
  field?: string;
  code?: string;
}

/**
 * A secure login form component with CSRF protection and optional CAPTCHA
 */
export function LoginForm({
  onSuccess,
  redirectUrl,
  showCaptcha = false,
  className = '',
}: LoginFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [csrfToken, setCsrfToken] = React.useState('');
  const [captchaToken, setCaptchaToken] = React.useState('');

  // Get login functionality from the hook
  const { login, isLoading, error } = useLogin();

  // Generate CSRF token on component mount
  React.useEffect(() => {
    setCsrfToken(generateCsrfToken());
  }, []);

  // Handle CAPTCHA verification
  const handleCaptchaVerification = (token: string) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Call login with email and password as separate arguments
      // The CAPTCHA token may be needed by the auth system later
      await login(email, password, captchaToken);

      // Handle successful login
      if (onSuccess) {
        onSuccess();
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  // Cast error to AuthError type for additional properties
  const authError = error as AuthError | null;

  // Determine if rate limiting is in effect
  const isRateLimited = authError?.code === 'RATE_LIMITED';

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`} noValidate>
      {/* CSRF Token (hidden) */}
      <input type="hidden" name="csrfToken" value={csrfToken} />

      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
          aria-invalid={authError?.field === 'email'}
          aria-describedby={authError?.field === 'email' ? 'email-error' : undefined}
        />
        {authError?.field === 'email' && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {authError.message}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
          aria-invalid={authError?.field === 'password'}
          aria-describedby={authError?.field === 'password' ? 'password-error' : undefined}
        />
        {authError?.field === 'password' && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {authError.message}
          </p>
        )}
      </div>

      {/* CAPTCHA integration placeholder */}
      {showCaptcha && (
        <div className="space-y-2" data-testid="login-captcha-wrapper">
          <Captcha onVerify={handleCaptchaVerification} className="flex justify-center" />
          {authError?.field === 'captcha' && (
            <p id="captcha-error" className="mt-1 text-sm text-red-600 text-center">
              {authError.message}
            </p>
          )}
        </div>
      )}

      {/* Rate limiting warning */}
      {isRateLimited && (
        <div className="p-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
          Too many login attempts. Please try again later.
        </div>
      )}

      {/* General error message */}
      {authError && !authError.field && !isRateLimited && (
        <div className="p-2 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
          {authError.message}
        </div>
      )}

      {/* Login button */}
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isRateLimited}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}
