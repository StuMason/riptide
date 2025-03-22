/**
 * Database utilities for RipTide
 * @packageDocumentation
 */
import { execSync } from 'child_process';
import { existsSync, readdirSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { CliCommandResult, MigrationOptions } from './types';

// Re-export types
export * from './types';

/**
 * Options for setting up Supabase
 */
export interface SupabaseSetupOptions {
  /**
   * Current working directory
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Whether to run in silent mode
   * @default false
   */
  silent?: boolean;
  /**
   * Source directory for migrations
   * @default './src/db/migrations'
   */
  migrationsSourceDir?: string;
  /**
   * Default environment variables to use if not present
   */
  defaultEnvVars?: Record<string, string>;
}

/**
 * Complete Supabase setup: installs CLI if needed, initializes project,
 * validates environment, copies migrations, and applies them
 * @param options Setup options
 * @returns Command result with success status and any errors
 */
export function setupSupabase(options: SupabaseSetupOptions = {}): CliCommandResult {
  const {
    cwd = process.cwd(),
    silent = false,
    migrationsSourceDir = join(cwd, 'src', 'db', 'migrations'),
    defaultEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    },
  } = options;

  // Step 1: Check if Supabase CLI is installed
  if (!isSupabaseCliInstalled()) {
    return {
      success: false,
      error: new Error('Supabase CLI is not installed. Please run: npm install -g supabase'),
    };
  }

  // Step 2: Initialize Supabase if not already done
  if (!isSupabaseInitialized(cwd)) {
    const initResult = initializeSupabase({ cwd });
    if (!initResult.success) {
      return {
        success: false,
        error: new Error(
          `Failed to initialize Supabase: ${initResult.error?.message || 'Unknown error'}`
        ),
      };
    }
  }

  // Step 3: Validate environment variables
  const envValidation = validateSupabaseEnv();
  if (!envValidation.valid) {
    // Step 4: Write environment variables to .env.local if not present
    try {
      const envFilePath = join(cwd, '.env.local');
      let envContent = '';

      // Check if .env.local exists and read its content
      if (existsSync(envFilePath)) {
        envContent = readFileSync(envFilePath, 'utf8');
      }

      // Add missing environment variables
      let updatedContent = envContent;
      let envUpdated = false;

      for (const varName of envValidation.missingVars) {
        if (defaultEnvVars[varName] && !envContent.includes(`${varName}=`)) {
          updatedContent += `${varName}=${defaultEnvVars[varName]}\n`;
          envUpdated = true;
        }
      }

      // Only write if we've updated the content
      if (envUpdated) {
        writeFileSync(envFilePath, updatedContent);
        if (!silent) {
          console.error(`Updated missing environment variables in ${envFilePath}`);
        }
      }
    } catch (error) {
      return {
        success: false,
        error: new Error(
          `Failed to write environment variables: ${error instanceof Error ? error.message : String(error)}`
        ),
      };
    }
  }

  // Step 5: Copy migrations from source to supabase/migrations
  if (existsSync(migrationsSourceDir)) {
    const copyResult = copyMigrations({
      sourceDir: migrationsSourceDir,
      cwd,
    });

    if (!copyResult.success) {
      return {
        success: false,
        error: new Error(
          `Failed to copy migrations: ${copyResult.error?.message || copyResult.message || 'Unknown error'}`
        ),
      };
    }
  } else if (!silent) {
    console.warn(
      `Migrations source directory ${migrationsSourceDir} does not exist. Skipping migration copy.`
    );
  }

  // Step 6: Check if using local environment and manage Supabase service
  const isLocalEnv = isUsingLocalEnvironment();

  if (isLocalEnv) {
    // Check if Supabase is running locally
    if (!isSupabaseRunning()) {
      if (!silent) {
        console.log('Supabase is not running. Starting Supabase...');
      }

      // Start Supabase
      const startResult = startSupabase({ cwd, silent });
      if (!startResult.success) {
        return {
          success: false,
          error: new Error(
            `Failed to start Supabase: ${startResult.error?.message || 'Unknown error'}`
          ),
        };
      }

      if (!silent) {
        console.log('Supabase started successfully. Migrations will be automatically applied.');
      }

      // When Supabase starts, it automatically applies migrations, so we can skip Step 7
      return {
        success: true,
        message: 'Supabase setup completed successfully and service started',
      };
    } else if (!silent) {
      console.log('Supabase is already running. Applying migrations...');
    }
  }

  // Step 7: Run migrations (only if not already applied by starting Supabase)
  const migrateResult = applyMigrations({ cwd });
  if (!migrateResult.success) {
    return {
      success: false,
      error: new Error(
        `Failed to apply migrations: ${migrateResult.error?.message || 'Unknown error'}`
      ),
    };
  }

  return {
    success: true,
    message: 'Supabase setup completed successfully',
  };
}

/**
 * Checks if Supabase CLI is installed
 * @returns True if Supabase CLI is available
 */
export function isSupabaseCliInstalled(): boolean {
  try {
    execSync('npx supabase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if project has Supabase initialized
 * @param cwd Current working directory
 * @returns True if Supabase is initialized in the project
 */
export function isSupabaseInitialized(cwd: string = process.cwd()): boolean {
  return existsSync(join(cwd, 'supabase'));
}

/**
 * Checks if using local Supabase environment based on URL
 * @returns True if using local Supabase environment
 */
export function isUsingLocalEnvironment(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !supabaseUrl || supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');
}

/**
 * Checks if Supabase is running locally
 * @returns True if Supabase is running
 */
export function isSupabaseRunning(): boolean {
  try {
    // Try to ping the Supabase health check endpoint
    execSync('curl --fail --silent http://localhost:54321/rest/v1/', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Starts Supabase locally
 * @param options Additional options
 * @returns Command result
 */
export function startSupabase(options: MigrationOptions = {}): CliCommandResult {
  // Ensure Supabase is initialized
  if (!isSupabaseInitialized(options.cwd)) {
    return {
      success: false,
      error: new Error(
        'Supabase is not initialized in this project. Run "npx supabase init" first.'
      ),
    };
  }

  return executeSupabaseCli('start', options);
}

/**
 * Executes a Supabase CLI command
 * @param command The Supabase CLI command to execute
 * @param options Additional options
 * @returns The command output
 */
export function executeSupabaseCli(
  command: string,
  options: { cwd?: string; silent?: boolean } = {}
): CliCommandResult {
  const { cwd = process.cwd(), silent = false } = options;

  // Check if Supabase CLI is installed
  if (!isSupabaseCliInstalled()) {
    return {
      success: false,
      error: new Error('Supabase CLI is not installed. Please run: npm install -g supabase'),
    };
  }

  try {
    const output = execSync(`npx supabase ${command}`, {
      cwd,
      stdio: silent ? 'pipe' : 'inherit',
    });

    return {
      success: true,
      output: output ? output.toString() : '',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Applies all pending migrations
 * @param options Additional options
 */
export function applyMigrations(options: MigrationOptions = {}): CliCommandResult {
  // Ensure Supabase is initialized
  if (!isSupabaseInitialized(options.cwd)) {
    return {
      success: false,
      error: new Error(
        'Supabase is not initialized in this project. Run "npx supabase init" first.'
      ),
    };
  }

  return executeSupabaseCli('db push', options);
}

/**
 * Initializes Supabase project structure in the current directory if it doesn't exist
 * @param options Additional options
 */
export function initializeSupabase(options: MigrationOptions = {}): CliCommandResult {
  // Check if Supabase is already initialized
  if (isSupabaseInitialized(options.cwd)) {
    return {
      success: true,
      output: 'Supabase is already initialized in this project.',
    };
  }

  return executeSupabaseCli('init', options);
}

/**
 * Validates Supabase environment variables
 * @returns Object with validation results
 */
export function validateSupabaseEnv(): {
  valid: boolean;
  missingVars: string[];
  message: string;
} {
  const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  const valid = missingVars.length === 0;
  const message = valid
    ? 'All Supabase environment variables are properly configured.'
    : `Missing required Supabase environment variables: ${missingVars.join(', ')}`;

  return { valid, missingVars, message };
}

/**
 * Copy migrations from source directory to target Supabase directory
 * @param options Options for copying migrations
 * @returns Result with success status and error if any
 */
export function copyMigrations(options: {
  /**
   * Source directory containing migrations
   */
  sourceDir: string;
  /**
   * Target project directory where Supabase is initialized
   * @default process.cwd()
   */
  cwd?: string;
}): CliCommandResult {
  try {
    const { sourceDir, cwd = process.cwd() } = options;
    const targetDir = join(cwd, 'supabase', 'migrations');

    // Ensure target directory exists
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    // Get list of migration files
    const migrationFiles = readdirSync(sourceDir).filter(
      file => file.endsWith('.sql') || file.endsWith('.js')
    );

    if (migrationFiles.length === 0) {
      return { success: true, message: 'No migration files found to copy.' };
    }

    // Copy each migration file
    let copiedCount = 0;
    for (const file of migrationFiles) {
      const sourcePath = join(sourceDir, file);
      const targetPath = join(targetDir, file);

      // Skip if file already exists in target
      if (existsSync(targetPath)) {
        continue;
      }

      copyFileSync(sourcePath, targetPath);
      copiedCount++;
    }

    return {
      success: true,
      message: `Successfully copied ${copiedCount} migration files to ${targetDir}.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
