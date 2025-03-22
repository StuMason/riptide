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
npm install @masonator/riptide
```

## Database Migrations

RipTide provides a comprehensive solution for managing database schemas and migrations using Supabase.

### Features

- **SQL Migration Files**: Pre-built schema definitions with Row Level Security (RLS)
- **CLI Commands**: Simple commands for managing migrations
- **Migration Status Checking**: Check which migrations have been applied
- **Setup Wizard Integration**: Seamlessly integrate with the RipTide setup wizard
- **Local Development**: Works with local Supabase instances

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
import { useAuth } from '@masonator/riptide';

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