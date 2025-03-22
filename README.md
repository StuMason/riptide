# RipTide Core

A complete authentication and user management solution for NextJS applications using Supabase.

## Features

- 🔐 Authentication (login, register, password reset)
- 👤 User profile management
- 🔑 API token management
- 🕒 Session management
- 🔒 Route protection with middleware
- 🔄 Real-time session syncing

## Installation

```bash
npm install @riptide/core
```

## Database Migrations

RipTide Core provides a comprehensive solution for managing database schemas and migrations using Supabase.

### Features

- **SQL Migration Files**: Pre-built schema definitions with Row Level Security (RLS)
- **CLI Commands**: Simple commands for managing migrations
- **Migration Status Checking**: Check which migrations have been applied
- **Setup Wizard Integration**: Seamlessly integrate with the RipTide setup wizard
- **Local Development**: Works with local Supabase instances

### Prerequisites

1. Install Supabase CLI globally or use with npx:

```bash
# Global installation
npm install -g supabase

# Or use with npx (no installation required)
npx supabase
```

2. Add the required environment variables to your project:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Using Migration Commands

RipTide provides convenient command-line tools for managing migrations:

```bash
# Check environment and migration status
npx riptide-migrations status

# Initialize Supabase project structure
npx riptide-migrations init

# Create a new migration
npx riptide-migrations new create_custom_table

# List all migrations and their status
npx riptide-migrations list

# Apply pending migrations
npx riptide-migrations push

# Reset database and reapply migrations (use with caution)
npx riptide-migrations reset
```

### Setup Wizard Integration

RipTide's database migrations are designed to integrate seamlessly with the setup wizard:

```typescript
import { runDatabaseSetup } from '@riptide/core';

// Run the database setup with auto-initialization and migration
const setupResult = await runDatabaseSetup({
  projectDir: './my-project',
  autoInitialize: true,
  autoRunMigrations: true,
  onLog: (message, type) => {
    console.log(`[${type}] ${message}`);
  }
});

if (setupResult.success) {
  console.log('Database setup completed successfully');
} else {
  console.error('Database setup failed:', setupResult.message);
}
```

For more granular control, you can use the individual helper functions:

```typescript
import { 
  checkDatabaseSetup, 
  createSetupWizardHelpers 
} from '@riptide/core';

// Get the status without making any changes
const status = await checkDatabaseSetup({ 
  autoInitialize: false,
  autoRunMigrations: false 
});

// Create setup wizard helpers
const helpers = createSetupWizardHelpers();

// Check if migrations are needed
const needsMigrations = await helpers.checkMigrationsNeeded();

// Apply pending migrations if needed
if (needsMigrations) {
  const success = await helpers.applyPendingMigrations();
}
```

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

### Programmatic Usage

You can use RipTide's migration utilities programmatically in your own code:

```typescript
import { 
  initializeSupabase,
  isSupabaseCliInstalled,
  isSupabaseInitialized,
  createMigration, 
  applyMigrations, 
  listMigrations, 
  resetDatabase,
  hasPendingMigrations,
  parseMigrationStatus,
  validateSupabaseEnv
} from '@riptide/core';

// Check if Supabase CLI is installed
const hasSupabaseCli = isSupabaseCliInstalled();

// Check if project has Supabase initialized
const hasSupabaseInit = isSupabaseInitialized();

// Check environment variables
const envStatus = validateSupabaseEnv();
if (!envStatus.valid) {
  console.log(`Missing environment variables: ${envStatus.missingVars.join(', ')}`);
}

// Initialize Supabase project if needed
if (!hasSupabaseInit) {
  const initResult = initializeSupabase();
  if (initResult.success) {
    console.log('Supabase project initialized');
  }
}

// Create a new migration
const createResult = createMigration('create_custom_table');
if (createResult.success) {
  console.log('Created new migration file');
}

// Check if migrations need to be applied
const needsMigrations = await hasPendingMigrations();
if (needsMigrations) {
  console.log('Migrations need to be applied');
}

// Get detailed migration status
const listResult = listMigrations();
if (listResult.success && listResult.output) {
  const status = parseMigrationStatus(listResult.output);
  console.log(`Applied migrations: ${status.applied.length}`);
  console.log(`Pending migrations: ${status.pending.length}`);
}

// Apply pending migrations
const applyResult = applyMigrations();
if (applyResult.success) {
  console.log('Applied all pending migrations');
}

// Execute custom SQL (requires Supabase client)
import { createClient } from '@supabase/supabase-js';
import { executeSQL } from '@riptide/core';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const result = await executeSQL(supabase, 'SELECT * FROM profiles');
if (result.success) {
  console.log(result.data);
}
```

## Quick Start

```jsx
// _app.tsx
import { RipTideProvider } from '@riptide/core';

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
import { useAuth } from '@riptide/core';

function LoginPage() {
  const { login, isLoading } = useAuth();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect or show success message
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      {/* Form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
```

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

For detailed documentation, see [the API docs](https://your-username.github.io/riptide/).

## License

MIT 