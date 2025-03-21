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

RipTide Core provides a simple wrapper around Supabase CLI migrations to make database schema management seamless with your NextJS and Supabase applications.

### Prerequisites

1. Ensure you have Supabase CLI installed globally or as a dev dependency:

```bash
# Global installation
npm install -g supabase

# Or as a dev dependency
npm install supabase --save-dev
```

2. Initialize Supabase in your project (if not already done):

```bash
npx supabase init
```

### Using RipTide Migration Commands

RipTide provides convenient npm scripts for managing migrations:

```bash
# Initialize Supabase project structure
npm run migrate:init

# Create a new migration
npm run migrate:new create_profiles_table

# List all migrations and their status
npm run migrate:list

# Apply pending migrations
npm run migrate:push

# Reset the database and reapply all migrations (use with caution)
npm run migrate:reset
```

### Migration File Structure

When you create a new migration, Supabase CLI will create a timestamped SQL file in the `supabase/migrations` directory:

```sql
-- Example migration file: supabase/migrations/20240321000000_create_profiles_table.sql

-- Create profiles table with RLS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

### Integrating with NextJS Apps

1. Add the required environment variables to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

2. Create a setup script in your project (e.g., `scripts/setup-db.js`):

```javascript
// scripts/setup-db.js
const { execSync } = require('child_process');

console.log('Setting up database...');
execSync('npm run migrate:push', { stdio: 'inherit' });
console.log('Database setup complete!');
```

3. Add a setup command to your package.json:

```json
"scripts": {
  "setup": "node scripts/setup-db.js",
  "dev": "npm run setup && next dev"
}
```

### Programmatic Usage

You can use the migration utilities programmatically in your own scripts:

```typescript
import { createMigration, applyMigrations, listMigrations, resetDatabase } from '@riptide/core';

// Initialize a new project
const initResult = initializeSupabase();
if (initResult.success) {
  console.log('Supabase project initialized');
}

// Create a new migration
const createResult = createMigration('create_profiles_table');
if (createResult.success) {
  console.log('Created new migration file');
}

// Apply all pending migrations
const applyResult = await applyMigrations();
if (applyResult.success) {
  console.log('Applied all pending migrations');
}

// List migration status
const listResult = await listMigrations();
if (listResult.success) {
  console.log('Migration status:', listResult.output);
}

// Execute custom SQL (requires Supabase client)
import { createClient } from '@supabase/supabase-js';
import { executeSQL } from '@riptide/core';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const result = await executeSQL(supabase, 'SELECT * FROM profiles');
console.log(result.data);
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