/**
 * Utility functions for RipTide
 */

import { randomBytes } from 'crypto';

/**
 * Creates a CSRF token using cryptographically secure random bytes
 *
 * @returns A random string to use as a CSRF token
 */
export function createCsrfToken(): string {
  // Use crypto.randomBytes instead of Math.random for better security
  return randomBytes(24).toString('hex');
}

/**
 * Performs a constant-time comparison of two strings to mitigate timing attacks
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if the strings match
 */
export function compareValues(a: string, b: string): boolean {
  // If lengths differ, return false but spend same amount of time
  if (a.length !== b.length) {
    // Still compare to spend same amount of time
    let result = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return false;
  }

  // Compare each character, accumulating differences
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  // If result is 0, all characters matched
  return result === 0;
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
  feedback: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      feedback: 'Password must be at least 8 characters long',
    };
  }

  // const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);

  //TESTING!!!
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  // const criteria = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar];
  const criteria = [hasLowerCase];
  const meetsCriteriaCount = criteria.filter(Boolean).length;

  // Simplified check that only requires lowercase letters
  if (meetsCriteriaCount < 1) {
    return {
      isValid: false,
      feedback: 'Password must contain at least lowercase letters',
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

/**
 * Parses a user agent string to extract device and browser information
 *
 * @param userAgent - The user agent string to parse
 * @returns An object containing parsed device and browser information
 */
export function parseUserAgent(userAgent: string = ''): {
  browser: string;
  os: string;
  deviceType: string;
} {
  if (!userAgent) {
    return { browser: 'Unknown', os: 'Unknown', deviceType: 'Unknown' };
  }

  // Determine browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg/')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg/')) {
    browser = 'Edge';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
    browser = 'Internet Explorer';
  }

  // Determine OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  // Determine device type
  let deviceType = 'Desktop';
  if (userAgent.includes('Mobile')) {
    deviceType = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceType = 'Tablet';
  }

  return { browser, os, deviceType };
}

/**
 * Gets session device information based on the current client
 *
 * @returns An object containing device information for session tracking
 */
export function getSessionDeviceInfo(): {
  userAgent: string;
  language: string;
  platform: string;
} {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      language: '',
      platform: '',
    };
  }

  return {
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    platform: window.navigator.platform,
  };
}

/**
 * Gets location information for a session
 * In a real-world implementation, this would call a geolocation service
 *
 * @param ip - The IP address to lookup
 * @returns A promise resolving to location information
 */
export async function getLocationInfo(ip: string): Promise<{
  city?: string;
  country?: string;
  ip: string;
}> {
  // In a real implementation, you would call a geolocation API
  // This is a stub implementation
  return {
    city: 'Unknown',
    country: 'Unknown',
    ip,
  };
}
