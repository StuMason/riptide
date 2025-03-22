# RipTide

**RipTide is an NPM package** that provides a complete authentication and user management solution for NextJS applications using Supabase.

This package is designed to be integrated into your existing NextJS application, providing ready-to-use hooks, components, and utilities to handle all aspects of authentication.

## Purpose & Overview

RipTide connects your NextJS application to Supabase for auth functionality while providing:

- Pre-built React components for login, registration, profile management
- React hooks for auth state and operations
- Route protection middleware
- Session management
- CSRF and rate-limiting protections
- CAPTCHA integration

## Quick Start Integration

1. Install the package in your NextJS project:

   ```bash
   npm install @masonator/riptide
   ```

2. Add the RipTide provider to your app:

   ```jsx
   // app/layout.tsx or similar wrapper component
   import { RipTideProvider } from '@masonator/riptide';

   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>
           <RipTideProvider config={{
             supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
             supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
           }}>
             {children}
           </RipTideProvider>
         </body>
       </html>
     );
   }
   ```

3. Use the components in your pages:

   ```jsx
   // app/login/page.tsx or similar
   import { LoginForm } from '@masonator/riptide';
   
   export default function LoginPage() {
     return (
       <div className="max-w-md mx-auto mt-10">
         <h1 className="text-2xl font-bold mb-6">Sign In</h1>
         <LoginForm redirectUrl="/dashboard" />
       </div>
     );
   }
   ```

## Supabase Setup

### Using the RipTide CLI

RipTide comes with a CLI tool to help you set up Supabase in your NextJS project:

```bash
# Initialize Supabase with RipTide (this runs migrations and sets up your environment)
npx riptide init
```

This command will:

1. Check if Supabase CLI is installed
2. Initialize Supabase if not already done
3. Set up environment variables in your .env.local file
4. Copy and apply database migrations

### Prerequisites

You need an existing NextJS 15 project to integrate this package.

Running `npx masonator/riptide init` will create a new supabase project within your root directory and copy the migrations from the package to the project.

## Features

- 🔐 Authentication (login, register, password reset)
  - Secure email/password authentication
  - Email verification flow
  - Password reset with secure tokens
  - Protection against brute force attacks with rate limiting
  - CAPTCHA integration (reCAPTCHA, hCaptcha)
  - CSRF protection for all forms
- 👤 User profile management
- 🔑 API token management
- 🕒 Session management
  - Multi-device tracking
  - Session revocation
  - Device and location tracking
  - Session activity history
  - Current session identification
  - Automatic session timeout
- 🔒 Route protection with middleware
- 🔄 Real-time session syncing

## Configuration Reference

The `RipTideProvider` accepts a comprehensive configuration object to customize behavior:

```jsx
<RipTideProvider config={{
  // REQUIRED: Supabase connection settings
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // OPTIONAL: Auth settings
  auth: {
    redirectTo: '/login',             // Where to redirect when auth required
    emailVerification: true,          // Require email verification
    passwordMinLength: 8,             // Minimum password length
    persistSession: true,             // Whether to persist session across page reloads
  },
  
  // OPTIONAL: Rate limiting settings
  rateLimit: {
    enabled: true,                    // Enable rate limiting
    max: 5,                           // Maximum attempts
    windowMs: 15 * 60000,             // Time window in milliseconds (15 minutes)
    skipSuccessfulRequests: true,     // Don't count successful logins
  },
  
  // OPTIONAL: CAPTCHA settings
  captcha: {
    enabled: false,                   // Enable CAPTCHA integration
    provider: 'recaptcha',            // 'recaptcha' or 'hcaptcha'
    siteKey: '',                      // Your CAPTCHA site key
    secretKey: '',                    // Your CAPTCHA secret key (server-side only)
    showAfterAttempts: 3,             // Show CAPTCHA after N failed attempts
  },
  
  // OPTIONAL: Session settings
  session: {
    timeoutMs: 30 * 24 * 60 * 60 * 1000, // Session timeout in ms (default 30 days)
    enableCsrf: true,                 // Enable CSRF protection
    persistDeviceInfo: true,          // Store device info with sessions
    trackLocationInfo: true,          // Track location data (country, city)
    maxSessions: 5,                   // Maximum concurrent sessions per user
  },
  
  // OPTIONAL: UI settings
  ui: {
    theme: 'light',                   // Light or dark theme for components
    customClasses: {                  // Custom CSS classes
      loginForm: '',
      registerForm: '',
      // etc.
    },
  },
}}>
  {children}
</RipTideProvider>
```

## Package Structure

RipTide is organized to support both client and server environments:

- **Main Import** (`import { RipTideProvider } from '@masonator/riptide'`)  
  Contains browser-safe components and utilities for authentication UI and client-side auth functionality.

- **Server Import** (`import { setupSupabase } from '@masonator/riptide/server'`)  
  Contains server-side utilities for database setup, migrations, and other Node.js specific functionality.

### Example Usage

```tsx
// In your frontend components (client-side)
import { RipTideProvider, useAuth } from '@masonator/riptide';

// In your setup scripts or server-side code (Node.js environment only)
import { setupSupabase, applyMigrations } from '@masonator/riptide/server';
```

This separation ensures that browser environments don't attempt to load Node.js specific modules.

## Component Library

RipTide provides pre-built UI components that integrate with your NextJS application:

### LoginForm Component

A complete login form with CSRF protection, rate limiting feedback, and CAPTCHA integration:

```jsx
import { LoginForm } from '@masonator/riptide';
import { useRouter } from 'next/navigation';

function LoginPage() {
  const router = useRouter();
  
  const handleSuccess = () => {
    router.push('/dashboard');
  };
  
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>
      
      <LoginForm 
        onSuccess={handleSuccess}
        // or use redirectUrl="/dashboard" for simple redirects
        showCaptcha={true} // Enable CAPTCHA (requires captcha.enabled config)
        className="bg-white p-6 rounded-lg shadow-md" // Optional custom styling
      />
    </div>
  );
}
```

The `LoginForm` component includes:

- Email and password fields with proper validation
- CSRF protection built-in
- Rate limiting feedback for users
- CAPTCHA integration (optional)
- Accessible design with ARIA attributes
- Loading states and error handling
- Customizable styling via className prop

Supported props:

- `onSuccess`: Function to call after successful login
- `redirectUrl`: URL to redirect to after successful login (alternative to onSuccess)
- `showCaptcha`: Boolean to show/hide CAPTCHA integration
- `className`: Custom CSS classes for the form

#### CAPTCHA Implementation Details

When `showCaptcha={true}` is set on the `LoginForm` component, RipTide will:

1. Render the CAPTCHA widget in the `captcha-container` element
2. When the user completes the CAPTCHA challenge, the verification token is automatically captured
3. The token is stored in the component's state and sent with the login credentials when the form is submitted
4. The backend validates this token with the CAPTCHA provider to verify the user is human
5. If validation fails, an error will be displayed in the form

To enable CAPTCHA protection:

1. Configure the CAPTCHA provider in your `RipTideProvider`:

```jsx
<RipTideProvider config={{
  // ... other configuration ...
  captcha: {
    enabled: true,
    provider: 'recaptcha', // or 'hcaptcha'
    siteKey: 'your-site-key',  // Your CAPTCHA site key
    secretKey: 'your-secret-key' // Your CAPTCHA secret key (server side only)
  }
}}>
  <Component {...pageProps} />
</RipTideProvider>
```

2. Add the `showCaptcha` prop to your `LoginForm` component:

```jsx
<LoginForm showCaptcha={true} />
```

The CAPTCHA will be displayed after excessive failed login attempts, or can be shown by default when the `showCaptcha` prop is set to `true`.

## Hooks API

RipTide provides React hooks for integrating authentication into your custom components:

### Authentication Hooks

```jsx
import { useAuth, useLogin, useRegister, usePasswordReset } from '@masonator/riptide';

// Basic auth status check
function ProfilePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return <div>Welcome, {user.email}</div>;
}

// Login form with hook
function CustomLoginPage() {
  const { login, isLoading, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect or show success message
    } catch (error) {
      // Error already captured in the hook
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      {/* Your custom form implementation */}
    </form>
  );
}

// Registration with hooks
function CustomRegisterPage() {
  const { register, isLoading, error } = useRegister();
  
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      // Show verification message
    } catch (error) {
      // Error handling
    }
  };
  
  // Form implementation
}

// Password reset
function CustomPasswordResetPage() {
  const { sendResetEmail, resetPassword, isLoading, error } = usePasswordReset();
  
  // Implementation for request form and reset form
}
```

### Session Management Hooks

```jsx
import { useSession } from '@masonator/riptide';

// Display and manage user sessions
function SecuritySettingsPage() {
  const { 
    sessions, 
    currentSession, 
    isLoading, 
    revokeSession, 
    getCsrfToken 
  } = useSession();
  
  if (isLoading) return <div>Loading sessions...</div>;
  
  const handleRevoke = async (sessionId) => {
    // Get a CSRF token for session revocation
    const csrfToken = getCsrfToken();
    
    // Pass the CSRF token for security
    await revokeSession(sessionId, csrfToken);
    // Session list will update automatically
  };
  
  return (
    <div>
      <h2>Active Sessions</h2>
      {sessions.map(session => (
        <div key={session.id} className={session.is_current ? 'current-session' : ''}>
          <div>
            Device: {session.device?.name} ({session.device?.os})
          </div>
          <div>
            Location: {session.location?.city}, {session.location?.country}
          </div>
          <div>
            Last active: {new Date(session.last_active_at).toLocaleString()}
          </div>
          {!session.is_current && (
            <button onClick={() => handleRevoke(session.id)}>
              Revoke This Session
            </button>
          )}
          {session.is_current && <span>Current Session</span>}
        </div>
      ))}
    </div>
  );
}
```

## Security Features

RipTide includes several security features:

1. **CSRF Protection**: All session operations (like revocation) are protected by CSRF tokens
2. **Configurable Session Timeout**: Set custom session expiration periods
3. **Device Fingerprinting**: Sessions include detailed device information
4. **Location Tracking**: Geographic information is included where available
5. **Multi-device Management**: Users can manage all their active sessions
6. **Current Session Indication**: The user's current session is clearly marked
7. **Automatic Invalidation**: Sessions are invalidated on security events like password changes

## Development

### Setup for Package Development

If you want to contribute to the RipTide package development:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/riptide.git
   cd riptide
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the package:

   ```bash
   npm run build
   ```

### Development Commands

- `npm run dev` - Watch mode for development
- `npm run build` - Build the package
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint the code
- `npm run format` - Format the code
- `npm run docs` - Generate documentation
- `npm run clean` - Clean build artifacts

### Project Structure

```shell
riptide/
├── dist/            # Built files
├── docs/            # Documentation
│   └── tasks/       # Project tasks
├── src/             # Source code
│   ├── auth/        # Authentication related functions
│   ├── context/     # React context providers
│   ├── components/  # UI components
│   ├── test/        # Test utilities
│   └── db/          # Database related functions and migrations
├── tsconfig.json    # TypeScript configuration
└── package.json     # Package configuration
```

## Contributing

We follow a standard GitHub flow for contributions:

1. Create a feature branch from the main branch for your task

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, ensuring all code:

   - Format the code (`npm run format`)
   - Passes linting (`npm run lint`)
   - Has working tests (`npm test`)
   - Builds successfully (`npm run build`)

3. Commit your changes with meaningful commit messages

   > **Note:** We use pre-commit hooks to automatically format, lint, and build your code before each commit. This ensures code quality and prevents pushing code that doesn't meet our standards. These hooks are automatically installed when you run `npm install`.

4. Push your branch and create a Pull Request

5. Request a review from the maintainers

### Pull Request Guidelines

- Keep PRs small and focused on a single feature or fix
- Include tests for new functionality
- Update documentation as needed
- Ensure all CI checks pass before requesting review

## Documentation

For detailed documentation, see [the API docs](https://stumason.github.io/riptide/).

## License

MIT