import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkRateLimit,
  resetRateLimit,
  getRemainingAttempts,
  generateCsrfToken,
  validateCsrfToken,
  verifyCaptcha,
} from './security';

// Mock fetch for CAPTCHA verification tests
global.fetch = vi.fn();

describe('Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all rate limits between tests
    resetRateLimit('test-ip');
    resetRateLimit('test-user');
  });

  describe('Rate Limiting', () => {
    it('should allow attempts under the limit', () => {
      // Default is 5 attempts
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
    });

    it('should block attempts over the limit', () => {
      // Default is 5 attempts
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      // 6th attempt should be blocked
      expect(checkRateLimit('test-ip')).toBe(false);
    });

    it('should respect custom rate limit settings', () => {
      // Set limit to 2 attempts
      expect(checkRateLimit('test-ip', 2)).toBe(true);
      expect(checkRateLimit('test-ip', 2)).toBe(true);
      // 3rd attempt should be blocked
      expect(checkRateLimit('test-ip', 2)).toBe(false);
    });

    it('should reset rate limit correctly', () => {
      // Use up some attempts
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);

      // Reset rate limit
      resetRateLimit('test-ip');

      // Should be able to make 5 more attempts
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
    });

    it('should track rate limits separately by key', () => {
      // Use up all attempts for one key
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(true);
      expect(checkRateLimit('test-ip')).toBe(false);

      // Different key should be unaffected
      expect(checkRateLimit('different-ip')).toBe(true);
    });

    it('should return correct remaining attempts', () => {
      // No attempts used yet
      expect(getRemainingAttempts('test-ip')).toBe(5);

      // Use 3 attempts
      checkRateLimit('test-ip');
      checkRateLimit('test-ip');
      checkRateLimit('test-ip');

      // Should have 2 attempts remaining
      expect(getRemainingAttempts('test-ip')).toBe(2);

      // Use all remaining attempts
      checkRateLimit('test-ip');
      checkRateLimit('test-ip');

      // Should have 0 attempts remaining
      expect(getRemainingAttempts('test-ip')).toBe(0);
    });

    it('should return max attempts for keys with no history', () => {
      expect(getRemainingAttempts('unknown-key')).toBe(5);
      expect(getRemainingAttempts('unknown-key', 10)).toBe(10);
    });
  });

  describe('CSRF Protection', () => {
    it('should generate different CSRF tokens each time', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(10); // Should be reasonably long
    });

    it('should correctly validate matching tokens', () => {
      const token = generateCsrfToken();

      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it('should reject non-matching tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(validateCsrfToken(token1, token2)).toBe(false);
    });
  });

  describe('CAPTCHA Verification', () => {
    afterEach(() => {
      vi.resetAllMocks();
    });

    it('should verify valid reCAPTCHA tokens', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const result = await verifyCaptcha('valid-token', 'recaptcha-secret', 'recaptcha');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('valid-token'),
        })
      );
    });

    it('should reject invalid reCAPTCHA tokens', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: vi.fn().mockResolvedValue({ success: false }),
      });

      const result = await verifyCaptcha('invalid-token', 'recaptcha-secret', 'recaptcha');

      expect(result).toBe(false);
    });

    it('should verify valid hCaptcha tokens', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const result = await verifyCaptcha('valid-token', 'hcaptcha-secret', 'hcaptcha');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://hcaptcha.com/siteverify',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('valid-token'),
        })
      );
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      const result = await verifyCaptcha('valid-token', 'recaptcha-secret');

      expect(result).toBe(false);
    });

    it('should use reCAPTCHA as the default provider', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      await verifyCaptcha('valid-token', 'recaptcha-secret');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        expect.any(Object)
      );
    });
  });
});
