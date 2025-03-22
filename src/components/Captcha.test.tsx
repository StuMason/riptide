import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Captcha } from './Captcha';
import * as useRipTideConfigModule from '../hooks/useRipTideConfig';

// Mock the useRipTideConfig hook
vi.mock('../hooks/useRipTideConfig', () => ({
  useRipTideConfig: vi.fn(),
}));

describe('Captcha', () => {
  const mockOnVerify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the useRipTideConfig hook implementation
    vi.mocked(useRipTideConfigModule.useRipTideConfig).mockReturnValue({
      captcha: {
        enabled: true,
        provider: 'recaptcha',
        siteKey: 'test-site-key',
        secretKey: '',
      },
    });

    // Mock document.createElement and appendChild for script loading
    const mockScript = {
      src: '',
      async: false,
      defer: false,
      onload: null as any,
      onerror: null as any,
    };

    const origCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation(tagName => {
      if (tagName === 'script') {
        return mockScript as any;
      }
      return origCreateElement.call(document, tagName);
    });

    vi.spyOn(document.head, 'appendChild').mockImplementation(() => {
      // Simulate script load
      if (mockScript.onload) {
        setTimeout(() => mockScript.onload(), 0);
      }
      return document.head;
    });

    // Mock grecaptcha
    window.grecaptcha = {
      render: vi.fn().mockReturnValue(1),
      reset: vi.fn(),
      execute: vi.fn(),
    };
  });

  it('renders the captcha container', () => {
    render(<Captcha onVerify={mockOnVerify} />);

    expect(screen.getByTestId('captcha-container')).toBeInTheDocument();
  });

  it('applies custom className to the container', () => {
    render(<Captcha onVerify={mockOnVerify} className="test-class" />);

    const container = screen.getByTestId('captcha-container');
    expect(container.className).toContain('test-class');
  });

  it('loads reCAPTCHA when provider is recaptcha', async () => {
    render(<Captcha onVerify={mockOnVerify} />);

    // Wait for useEffect to run
    await vi.waitFor(() => {
      expect(window.grecaptcha?.render).toHaveBeenCalled();
    });

    // Verify it was called with the correct params
    expect(window.grecaptcha?.render).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      sitekey: 'test-site-key',
      callback: mockOnVerify,
    });
  });

  it('loads hCaptcha when provider is hcaptcha', async () => {
    // Change the provider to hcaptcha
    vi.mocked(useRipTideConfigModule.useRipTideConfig).mockReturnValue({
      captcha: {
        enabled: true,
        provider: 'hcaptcha',
        siteKey: 'test-site-key',
        secretKey: '',
      },
    });

    // Mock hcaptcha
    window.hcaptcha = {
      render: vi.fn().mockReturnValue(1),
      reset: vi.fn(),
      execute: vi.fn(),
    };

    render(<Captcha onVerify={mockOnVerify} />);

    // Wait for useEffect to run
    await vi.waitFor(() => {
      expect(window.hcaptcha?.render).toHaveBeenCalled();
    });

    // Verify it was called with the correct params
    expect(window.hcaptcha?.render).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      sitekey: 'test-site-key',
      callback: mockOnVerify,
    });
  });
});
