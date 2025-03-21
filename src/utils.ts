/**
 * Utility functions for RipTide
 */

/**
 * Creates a CSRF token
 * 
 * @returns A random string to use as a CSRF token
 */
export function createCsrfToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Validates an email address format
 * 
 * @param email - The email address to validate
 * @returns True if the email format is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * 
 * @param password - The password to validate
 * @returns An object containing validity and feedback
 */
export function validatePassword(password: string): { 
  isValid: boolean; 
  feedback: string 
} {
  if (password.length < 8) {
    return { 
      isValid: false, 
      feedback: 'Password must be at least 8 characters long' 
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const criteria = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar];
  const meetsCriteriaCount = criteria.filter(Boolean).length;

  if (meetsCriteriaCount < 3) {
    return {
      isValid: false,
      feedback: 'Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters'
    };
  }

  return { isValid: true, feedback: 'Password is strong' };
}

/**
 * Sanitizes user input to prevent XSS attacks
 * 
 * @param input - The user input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Checks if a value is a valid URL
 * 
 * @param value - The value to check
 * @returns True if the value is a valid URL
 */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets a user's browser fingerprint
 * 
 * @returns A string representing the browser fingerprint
 */
export function getBrowserFingerprint(): string {
  if (typeof window === 'undefined') return '';

  const { userAgent, language, platform } = window.navigator;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const colorDepth = window.screen.colorDepth;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Create a simple fingerprint
  return `${userAgent}|${language}|${platform}|${screenWidth}x${screenHeight}|${colorDepth}|${timezone}`;
}

/**
 * Formats a date as a relative time string (e.g., "2 hours ago")
 * 
 * @param date - The date to format
 * @returns A string representing the relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
} 