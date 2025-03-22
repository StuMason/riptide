# Core Authentication System

## Objectives

- Implement login functionality with security measures
- Implement registration with email verification
- Create password reset flow
- Set up email verification process
- Integrate security features for authentication

## Tasks

1. Create core authentication interfaces and types
2. Implement login functionality with Supabase
3. Implement IP-based and user-based rate limiting for login attempts
4. Add CAPTCHA integration for authentication forms
5. Implement registration with email verification
6. Create secure password reset flow with proper validation
7. Set up email verification process
8. Implement CSRF protection for all authentication forms
9. Configure secure cookie handling (HTTP-only, secure, SameSite)
10. Implement logout functionality
11. Create authentication hooks for React
12. Implement authentication middleware for NextJS

## Acceptance Criteria

- Users can register with email/password
- Email verification is sent upon registration
- Users can login with verified email/password
- Password reset flow works securely
- Rate limiting prevents brute force attacks
- CAPTCHA integration works and prevents automated attacks
- CSRF protection is implemented for all forms
- Cookies are set with secure attributes
- Users can log out from application
- Authentication state is properly managed
- Routes can be protected based on authentication status 

Key Principles for Simplifying Auth Implementation

Leverage Supabase Auth Directly

Supabase already handles most of the authentication complexity - use their APIs directly
Avoid reimplementing functionality that Supabase provides out of the box
Their SDK handles secure cookies, sessions, etc.


Minimal Abstraction

Create thin wrappers around Supabase auth functions
Don't add abstraction layers unless they provide clear value
Keep the API surface small and focused


Clear Separation of Concerns

Auth state management (RipTideProvider)
Security features (rate limiting, CAPTCHA)
UI components (forms, etc.)



Implementation Strategy
Here's how I'd approach each component to keep it simple:
1. Core Authentication
typescriptCopy// Keep the auth functions as direct wrappers around Supabase
const login = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

const register = async (email: string, password: string, metadata = {}) => {
  return supabase.auth.signUp({ 
    email, 
    password,
    options: { data: metadata }
  });
};

const resetPassword = async (token: string, newPassword: string) => {
  return supabase.auth.updateUser({ password: newPassword });
};

const logout = async () => {
  return supabase.auth.signOut();
};
2. Rate Limiting
typescriptCopy// Simple rate limiting that tracks counts in memory
// Could be enhanced later with Redis for distributed systems
const attemptsByIP = new Map<string, number>();
const attemptsByUser = new Map<string, number>();

function checkRateLimit(identifier: string, map: Map<string, number>, limit: number): boolean {
  const count = map.get(identifier) || 0;
  if (count >= limit) return false;
  map.set(identifier, count + 1);
  return true;
}
3. RipTideProvider
tsxCopy// Keep the provider focused on maintaining auth state
export function RipTideProvider({ children, config = {} }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize and listen for auth changes
  useEffect(() => {
    // Auth state change listener
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });
    
    return () => data.subscription.unsubscribe();
  }, []);
  
  // Simple context with just what's needed
  const value = {
    isAuthenticated: !!session,
    isLoading,
    user,
    session,
    login,
    register,
    resetPassword,
    logout,
    // etc.
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
Tips for Implementation

Start with the basics - Get core auth working before adding security features
Test incrementally - Test each piece as you build it
Document explicit limitations - Be clear about what your package does and doesn't do
Rely on Supabase's security - They've done the hard security work
Consider configurability - Allow users to opt in/out of advanced features

When implementing the task, I'd focus on getting the core authentication flow working first, then layering in security features one at a time. This helps prevent the complexity spiral that often happens when trying to build everything at once.
Would this approach make sense for your needs? I'm happy to adjust my recommendations based on what you're looking for.