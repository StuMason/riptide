// Re-export types (safe for all environments)
export * from './types';
export * from './utils';

// Export only client-safe modules by default
export { RipTideProvider, useAuth } from './context/RipTideProvider';
export { useSession } from './context/SessionProvider';
export * from './auth/client';
export * from './auth/security';
export * from './components/LoginForm';
export * from './components/RegisterForm';

// Important: Don't export DB module from main entry point
