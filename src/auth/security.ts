/**
 * Simple in-memory rate limiter for authentication
 * Note: For production, consider using a distributed solution like Redis
 */

import { randomBytes } from 'crypto';

// Track login attempts by key (IP or userId)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

// Default rate limit settings
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if a login attempt is allowed based on rate limiting
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  windowMs: number = DEFAULT_WINDOW_MS
): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  // If no previous attempts or window expired, reset
  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  // Check if under rate limit
  if (attempt.count < maxAttempts) {
    loginAttempts.set(key, {
      count: attempt.count + 1,
      resetAt: attempt.resetAt,
    });
    return true;
  }

  return false;
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
  loginAttempts.delete(key);
}

/**
 * Get remaining attempts for a key
 */
export function getRemainingAttempts(
  key: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS
): number {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || now > attempt.resetAt) {
    return maxAttempts;
  }

  return Math.max(0, maxAttempts - attempt.count);
}

/**
 * Verify reCAPTCHA token
 */
export async function verifyRecaptcha(token: string, secret: string): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

/**
 * Verify hCaptcha token
 */
export async function verifyHcaptcha(token: string, secret: string): Promise<boolean> {
  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('hCaptcha verification error:', error);
    return false;
  }
}

/**
 * Verify CAPTCHA token based on provider
 */
export async function verifyCaptcha(
  token: string,
  secret: string,
  provider: 'recaptcha' | 'hcaptcha' = 'recaptcha'
): Promise<boolean> {
  if (provider === 'recaptcha') {
    return verifyRecaptcha(token, secret);
  } else if (provider === 'hcaptcha') {
    return verifyHcaptcha(token, secret);
  }

  return false;
}

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}
