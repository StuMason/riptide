/**
 * Result of executing a Supabase CLI command
 */
export interface CliCommandResult {
  success: boolean;
  output?: string;
  error?: Error;
}

/**
 * Result of executing SQL
 */
export interface SqlExecutionResult {
  success: boolean;
  data?: unknown;
  error?: unknown;
}

/**
 * Options for executing a CLI command
 */
export interface CliCommandOptions {
  cwd?: string;
  silent?: boolean;
}

/**
 * Migration options for creating a new migration
 */
export interface MigrationOptions {
  cwd?: string;
}
