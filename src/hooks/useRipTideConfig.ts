/**
 * Hook to access RipTide configuration
 * @returns The current RipTide configuration
 */
export function useRipTideConfig() {
  // Get the config from the AuthContext instead of creating a new context
  // This is a simplified implementation

  // Get window global if available - this is a temporary solution
  // until we implement proper context passing
  const config = typeof window !== 'undefined' ? (window as any).__RIPTIDE_CONFIG__ : {};

  return {
    captcha: {
      enabled: config?.captcha?.enabled || config?.enableCaptcha || false,
      provider: config?.captcha?.provider || config?.captchaProvider || 'recaptcha',
      siteKey: config?.captcha?.siteKey || '',
      secretKey: config?.captcha?.secretKey || '',
    },
    // Add other config sections as needed
  };
}
