import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthMiddlewareOptions {
  /**
   * Routes that don't require authentication
   */
  publicRoutes?: string[];
  
  /**
   * Where to redirect unauthenticated users
   * @default '/login'
   */
  authPage?: string;
  
  /**
   * Where to redirect authenticated users from public routes
   * @default '/dashboard'
   */
  defaultProtectedRoute?: string;
}

/**
 * Authentication middleware for Next.js
 * 
 * @param options - Middleware options
 * @returns Next.js middleware function
 */
export function authMiddleware(options: AuthMiddlewareOptions = {}) {
  const {
    publicRoutes = ['/login', '/register', '/reset-password', '/verify-email'],
    authPage = '/login',
    defaultProtectedRoute = '/dashboard',
  } = options;

  return async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    
    // Create a Supabase client using the Server Component helper
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: name => req.cookies.get(name)?.value,
          set: (name, value, options) => {
            res.cookies.set({ name, value, ...options });
          },
          remove: (name, options) => {
            res.cookies.delete({ name, ...options });
          },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    const path = req.nextUrl.pathname;

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => 
      path === route || 
      path.startsWith(`${route}/`)
    );

    // Handle authentication logic
    if (!session && !isPublicRoute) {
      // Redirect unauthenticated users to login
      const redirectUrl = new URL(authPage, req.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }

    if (session && isPublicRoute) {
      // Redirect authenticated users to dashboard from public routes
      return NextResponse.redirect(new URL(defaultProtectedRoute, req.url));
    }

    return res;
  };
} 