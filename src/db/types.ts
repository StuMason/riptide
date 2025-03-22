/**
 * Result of executing a Supabase CLI command
 */
export interface CliCommandResult {
  success: boolean;
  output?: string;
  error?: Error;
  message?: string;
}

/**
 * Migration options for creating a new migration
 */
export interface MigrationOptions {
  cwd?: string;
  silent?: boolean;
}
