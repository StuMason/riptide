import * as React from 'react';
import { useRipTideConfig } from '../hooks/useRipTideConfig';

// Define window types for CAPTCHA libraries
declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        params: {
          sitekey: string;
          callback: (token: string) => void;
        }
      ) => number;
      reset: (id: number) => void;
      execute: (id: number) => void;
    };
    hcaptcha?: {
      render: (
        container: HTMLElement,
        params: {
          sitekey: string;
          callback: (token: string) => void;
        }
      ) => number;
      reset: (id: number) => void;
      execute: (id: number) => void;
    };
  }
}

interface CaptchaProps {
  /**
   * Function to call when the CAPTCHA is verified
   */
  onVerify: (token: string) => void;

  /**
   * Custom class name for the container
   */
  className?: string;
}

/**
 * A component that renders a CAPTCHA widget (reCAPTCHA or hCaptcha)
 * based on the RipTide configuration
 */
export function Captcha({ onVerify, className = '' }: CaptchaProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const widgetIdRef = React.useRef<number | null>(null);
  const { captcha } = useRipTideConfig();

  React.useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !containerRef.current) return;

    const provider = captcha?.provider || 'recaptcha';
    const siteKey = captcha?.siteKey;

    if (!siteKey) {
      console.error('CAPTCHA site key not provided in RipTide config');
      return;
    }

    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });
    };

    const initializeCaptcha = async () => {
      try {
        if (provider === 'recaptcha') {
          await loadScript('https://www.google.com/recaptcha/api.js?render=explicit');

          // Make sure grecaptcha has loaded
          if (!window.grecaptcha || !window.grecaptcha.render) {
            console.error('reCAPTCHA failed to load');
            return;
          }

          // Render reCAPTCHA
          if (window.grecaptcha && window.grecaptcha.render && containerRef.current) {
            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
              sitekey: siteKey,
              callback: onVerify,
            });
          }
        } else if (provider === 'hcaptcha') {
          await loadScript('https://js.hcaptcha.com/1/api.js?render=explicit');

          // Make sure hcaptcha has loaded
          if (!window.hcaptcha || !window.hcaptcha.render) {
            console.error('hCaptcha failed to load');
            return;
          }

          // Render hCaptcha
          if (window.hcaptcha && window.hcaptcha.render && containerRef.current) {
            widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
              sitekey: siteKey,
              callback: onVerify,
            });
          }
        }
      } catch (error) {
        console.error('Error initializing CAPTCHA:', error);
      }
    };

    initializeCaptcha();

    // Cleanup
    return () => {
      if (widgetIdRef.current !== null) {
        if (provider === 'recaptcha' && window.grecaptcha) {
          window.grecaptcha.reset(widgetIdRef.current);
        } else if (provider === 'hcaptcha' && window.hcaptcha) {
          window.hcaptcha.reset(widgetIdRef.current);
        }
      }
    };
  }, [onVerify, captcha]);

  return (
    <div
      ref={containerRef}
      id="captcha-container"
      data-testid="captcha-container"
      className={`flex justify-center ${className}`}
    />
  );
}
