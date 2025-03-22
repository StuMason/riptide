import * as React from 'react';
import { useRegister } from '../auth';
import { generateCsrfToken } from '../auth/security';
import { Captcha } from './Captcha';
import { isValidEmail, validatePassword } from '../utils';

interface RegisterFormProps {
  /**
   * Called when registration is successful
   */
  onSuccess?: () => void;

  /**
   * URL to redirect to after successful registration
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
 * A secure registration form component with CSRF protection and optional CAPTCHA
 */
export function RegisterForm({
  onSuccess,
  redirectUrl,
  showCaptcha = false,
  className = '',
}: RegisterFormProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [csrfToken, setCsrfToken] = React.useState('');
  const [captchaToken, setCaptchaToken] = React.useState('');
  const [validationError, setValidationError] = React.useState<AuthError | null>(null);

  // Get register functionality from the hook
  const { register, isLoading, error } = useRegister();

  // Generate CSRF token on component mount
  React.useEffect(() => {
    setCsrfToken(generateCsrfToken());
  }, []);

  // Handle CAPTCHA verification
  const handleCaptchaVerification = (token: string) => {
    setCaptchaToken(token);
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    // Reset validation error
    setValidationError(null);

    // Validate name
    if (!name.trim()) {
      const nameError = new Error('Name is required') as AuthError;
      nameError.field = 'name';
      setValidationError(nameError);
      return false;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      const emailError = new Error('Please enter a valid email address') as AuthError;
      emailError.field = 'email';
      setValidationError(emailError);
      return false;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const passwordError = new Error(passwordValidation.feedback) as AuthError;
      passwordError.field = 'password';
      setValidationError(passwordError);
      return false;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      const confirmError = new Error('Passwords do not match') as AuthError;
      confirmError.field = 'confirmPassword';
      setValidationError(confirmError);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      // Call register with name, email, password, and captchaToken
      await register(name, email, password, captchaToken);

      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Handle successful registration
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
  const displayError = validationError || authError;

  // Determine if rate limiting is in effect
  const isRateLimited = authError?.code === 'RATE_LIMITED';

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`} noValidate>
      {/* CSRF Token (hidden) */}
      <input type="hidden" name="csrfToken" value={csrfToken} />

      {/* Name field */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
          aria-invalid={displayError?.field === 'name'}
          aria-describedby={displayError?.field === 'name' ? 'name-error' : undefined}
        />
        {displayError?.field === 'name' && (
          <p id="name-error" className="mt-1 text-sm text-red-600">
            {displayError.message}
          </p>
        )}
      </div>

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
          aria-invalid={displayError?.field === 'email'}
          aria-describedby={displayError?.field === 'email' ? 'email-error' : undefined}
        />
        {displayError?.field === 'email' && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {displayError.message}
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
          autoComplete="new-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
          aria-invalid={displayError?.field === 'password'}
          aria-describedby={displayError?.field === 'password' ? 'password-error' : undefined}
        />
        {displayError?.field === 'password' && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {displayError.message}
          </p>
        )}
      </div>

      {/* Confirm Password field */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
          aria-invalid={displayError?.field === 'confirmPassword'}
          aria-describedby={
            displayError?.field === 'confirmPassword' ? 'confirm-password-error' : undefined
          }
        />
        {displayError?.field === 'confirmPassword' && (
          <p id="confirm-password-error" className="mt-1 text-sm text-red-600">
            {displayError.message}
          </p>
        )}
      </div>

      {/* Password requirements hint */}
      <div className="text-xs text-gray-500">
        <p>Password must:</p>
        <ul className="list-disc pl-5">
          <li>Be at least 8 characters long</li>
          <li>Include lowercase letters</li>
          <li>Include at least one number or special character</li>
        </ul>
      </div>

      {/* CAPTCHA integration */}
      {showCaptcha && (
        <div className="space-y-2" data-testid="register-captcha-wrapper">
          <Captcha onVerify={handleCaptchaVerification} className="flex justify-center" />
          {displayError?.field === 'captcha' && (
            <p id="captcha-error" className="mt-1 text-sm text-red-600 text-center">
              {displayError.message}
            </p>
          )}
        </div>
      )}

      {/* Rate limiting warning */}
      {isRateLimited && (
        <div className="p-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
          Too many registration attempts. Please try again later.
        </div>
      )}

      {/* General error message */}
      {displayError && !displayError.field && !isRateLimited && (
        <div className="p-2 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
          {displayError.message}
        </div>
      )}

      {/* Register button */}
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isRateLimited}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </div>
    </form>
  );
}
