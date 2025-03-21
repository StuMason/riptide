import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createCsrfToken,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  isValidUrl,
  getBrowserFingerprint,
  formatRelativeTime
} from './utils';

describe('Utils', () => {
  describe('createCsrfToken', () => {
    it('should generate a random string', () => {
      const token = createCsrfToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens on consecutive calls', () => {
      const token1 = createCsrfToken();
      const token2 = createCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('name@subdomain.domain.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@tld')).toBe(false);
      expect(isValidEmail('@missingname.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return isValid: false for passwords shorter than 8 characters', () => {
      const result = validatePassword('short');
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('at least 8 characters');
    });

    it('should return isValid: false for passwords not meeting complexity requirements', () => {
      const result = validatePassword('lowercaseonly');
      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('at least 3 of the following');
    });

    it('should return isValid: true for strong passwords', () => {
      const result = validatePassword('StrongP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.feedback).toBe('Password is strong');
    });

    it('should accept passwords with 3 out of 4 criteria', () => {
      // uppercase, lowercase, numbers (no special chars)
      const result1 = validatePassword('StrongPass123');
      expect(result1.isValid).toBe(true);

      // uppercase, lowercase, special (no numbers)
      const result2 = validatePassword('StrongP@ssword');
      expect(result2.isValid).toBe(true);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML special characters', () => {
      const input = '<script>alert("XSS Attack");</script>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS Attack&quot;);&lt;/script&gt;');
    });

    it('should handle normal text without changes', () => {
      const input = 'Normal text without special characters';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe(input);
    });

    it('should sanitize multiple special characters', () => {
      const input = 'Name: "John" & "Jane" <couple>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Name: &quot;John&quot; &amp; &quot;Jane&quot; &lt;couple&gt;');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://sub.domain.co.uk/path?query=string#hash')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('getBrowserFingerprint', () => {
    let originalNavigator: Navigator;
    let originalScreen: Screen;
    let originalIntl: typeof Intl;

    beforeEach(() => {
      // Store original values
      originalNavigator = global.navigator;
      originalScreen = global.screen;
      originalIntl = global.Intl;

      // Mock window.navigator
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'test-user-agent',
          language: 'en-US',
          platform: 'test-platform'
        },
        writable: true
      });

      // Mock window.screen
      Object.defineProperty(global, 'screen', {
        value: {
          width: 1920,
          height: 1080,
          colorDepth: 24
        },
        writable: true
      });

      // Mock Intl
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({
            resolvedOptions: () => ({
              timeZone: 'America/New_York'
            })
          })
        },
        writable: true
      });
    });

    afterEach(() => {
      // Restore original values
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true
      });

      Object.defineProperty(global, 'screen', {
        value: originalScreen,
        writable: true
      });

      Object.defineProperty(global, 'Intl', {
        value: originalIntl,
        writable: true
      });
    });

    it('should generate a fingerprint from browser data', () => {
      const fingerprint = getBrowserFingerprint();
      expect(fingerprint).toBe('test-user-agent|en-US|test-platform|1920x1080|24|America/New_York');
    });

    it('should return an empty string when window is undefined', () => {
      // Simulate server-side rendering
      const windowSpy = vi.spyOn(global, 'window', 'get');
      windowSpy.mockImplementation(() => undefined as any);

      const fingerprint = getBrowserFingerprint();
      expect(fingerprint).toBe('');

      windowSpy.mockRestore();
    });
  });

  describe('formatRelativeTime', () => {
    let now: Date;
    let originalDate: DateConstructor;

    beforeEach(() => {
      // Store original Date constructor
      originalDate = global.Date;
      
      // Mock current date to be fixed
      now = new Date('2023-01-01T12:00:00Z');
      global.Date = class extends Date {
        constructor(...args: any[]) {
          if (args.length === 0) {
            return now;
          }
          return new originalDate(...args);
        }
      } as DateConstructor;
    });

    afterEach(() => {
      // Restore original Date constructor
      global.Date = originalDate;
    });

    it('should format seconds as "just now"', () => {
      const date = new Date('2023-01-01T11:59:30Z'); // 30 seconds ago
      expect(formatRelativeTime(date)).toBe('just now');
    });

    it('should format minutes correctly', () => {
      const date1 = new Date('2023-01-01T11:59:00Z'); // 1 minute ago
      expect(formatRelativeTime(date1)).toBe('1 minute ago');

      const date2 = new Date('2023-01-01T11:55:00Z'); // 5 minutes ago
      expect(formatRelativeTime(date2)).toBe('5 minutes ago');
    });

    it('should format hours correctly', () => {
      const date1 = new Date('2023-01-01T11:00:00Z'); // 1 hour ago
      expect(formatRelativeTime(date1)).toBe('1 hour ago');

      const date2 = new Date('2023-01-01T07:00:00Z'); // 5 hours ago
      expect(formatRelativeTime(date2)).toBe('5 hours ago');
    });

    it('should format days correctly', () => {
      const date1 = new Date('2022-12-31T12:00:00Z'); // 1 day ago
      expect(formatRelativeTime(date1)).toBe('1 day ago');

      const date2 = new Date('2022-12-25T12:00:00Z'); // 7 days ago
      expect(formatRelativeTime(date2)).toBe('7 days ago');
    });

    it('should format months correctly', () => {
      const date1 = new Date('2022-12-01T12:00:00Z'); // 1 month ago
      expect(formatRelativeTime(date1)).toBe('1 month ago');

      const date2 = new Date('2022-09-01T12:00:00Z'); // 4 months ago
      expect(formatRelativeTime(date2)).toBe('4 months ago');
    });

    it('should format years correctly', () => {
      const date1 = new Date('2022-01-01T12:00:00Z'); // 1 year ago
      expect(formatRelativeTime(date1)).toBe('1 year ago');

      const date2 = new Date('2020-01-01T12:00:00Z'); // 3 years ago
      expect(formatRelativeTime(date2)).toBe('3 years ago');
    });

    it('should accept string dates', () => {
      expect(formatRelativeTime('2022-12-31T12:00:00Z')).toBe('1 day ago');
    });
  });
}); 