# RipTide Core

A complete authentication and user management solution for NextJS applications using Supabase.

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

## Installation

```bash
npm install @masonator/riptide
```

### Using the CLI

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

You need a fresh NextJS 15 project to install this package.

Running npx masonator/riptide init will create a new supabase project within your root directory and copy the migrations from the package to the project.

It will attempt to update the .env file with the correct values and run the migrations.

It will then attempt to run the migrations and apply them to the database.

### Setup Wizard Integration

RipTide's database migrations are designed to integrate seamlessly with the setup wizard:

### Database Schema

RipTide Core includes the following pre-built schemas:

1. **Profiles Table**: Extends Supabase auth.users with profile information
   - Links to `auth.users` with ON DELETE CASCADE
   - Stores user profile information like name, avatar, and preferences
   - Includes RLS policies for secure access

2. **API Tokens Table**: Manages user-generated API tokens
   - Stores token names, hashes, scopes, and expiration dates
   - Tracks token usage with last_used_at timestamp
   - Includes revocation capabilities

3. **User Sessions Table**: Tracks active user sessions
   - Stores device and location information
   - Enables multi-device login tracking
   - Supports session revocation

## Quick Start

```jsx
// _app.tsx
import { RipTideProvider } from '@masonator/riptide';

function MyApp({ Component, pageProps }) {
  return (
    <RipTideProvider config={{
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }}>
      <Component {...pageProps} />
    </RipTideProvider>
  );
}

export default MyApp;
```

## Usage

### Authentication

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
function LoginPage() {
  const { login, isLoading, error } = useLogin();
  
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
      {error && <div className="error">{error.message}</div>}
      {/* Form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}

// Registration with hooks
function RegisterPage() {
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
function PasswordResetPage() {
  const { sendResetEmail, resetPassword, isLoading, error } = usePasswordReset();
  
  // Implementation for request form and reset form
}
```

### Advanced Provider Configuration

The `RipTideProvider` accepts configuration options to customize the authentication behavior:

```jsx
<RipTideProvider config={{
  // Supabase connection
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // Rate limiting options
  rateLimit: {
    max: 5,               // Maximum attempts
    windowMs: 15 * 60000, // Time window in milliseconds (15 minutes)
  },
  
  // CAPTCHA configuration
  enableCaptcha: true,
  captchaProvider: 'recaptcha', // or 'hcaptcha'
  
  // Session configuration
  session: {
    timeoutMs: 7 * 24 * 60 * 60 * 1000, // 7 days (default is 30 days)
    enableCsrf: true, // Enable CSRF protection for session operations (default)
  }
}}>
  <Component {...pageProps} />
</RipTideProvider>
```

### Security Features

#### Rate Limiting

RipTide includes built-in rate limiting to protect against brute force attacks. This can be configured in the provider:

```jsx
<RipTideProvider config={{
  rateLimit: {
    max: 5,                // Maximum attempts
    windowMs: 15 * 60000,  // Time window (15 minutes)
  }
}}>
  {/* ... */}
</RipTideProvider>
```

#### CAPTCHA Integration

Support for CAPTCHA verification is included and can be enabled in the provider:

```jsx
<RipTideProvider config={{
  enableCaptcha: true,
  captchaProvider: 'recaptcha', // or 'hcaptcha'
}}>
  {/* ... */}
</RipTideProvider>
```

You'll need to set up a CAPTCHA component in your forms and set the token appropriately.

#### CSRF Protection

CSRF protection is automatically included for all authentication forms. The implementation uses cryptographically secure random tokens generated with `crypto.randomBytes`:

```jsx
import { generateCsrfToken, validateCsrfToken } from '@masonator/riptide';

// In your form component
const csrfToken = generateCsrfToken();

// When submitting
if (!validateCsrfToken(formToken, storedToken)) {
  // Handle invalid token
}
```

### Session Management

For comprehensive session management, RipTide provides the `useSession` hook:

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

#### Security Features

The session management system includes several security features:

1. **CSRF Protection**: All session operations (like revocation) are protected by CSRF tokens
2. **Configurable Session Timeout**: Set custom session expiration periods
3. **Device Fingerprinting**: Sessions include detailed device information
4. **Location Tracking**: Geographic information is included where available
5. **Multi-device Management**: Users can manage all their active sessions
6. **Current Session Indication**: The user's current session is clearly marked
7. **Automatic Invalidation**: Sessions are invalidated on security events like password changes

## Development

### Setup

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
│   └── test/        # Test utilities
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