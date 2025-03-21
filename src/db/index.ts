/**
 * Database utilities for RipTide
 * @packageDocumentation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { SqlExecutionResult } from './types';

// Re-export types
export * from './types';

/**
 * Executes a Supabase CLI command
 * @param command The Supabase CLI command to execute
 * @param options Additional options
 * @returns The command output
 */
export function executeSupabaseCli(
  command: string,
  options: { cwd?: string; silent?: boolean } = {}
) {
  const { cwd = process.cwd(), silent = false } = options;

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
 * Creates a new migration file
 * @param name The name of the migration
 * @param options Additional options
 */
export function createMigration(name: string, options: { cwd?: string } = {}) {
  return executeSupabaseCli(`migration new ${name}`, options);
}

/**
 * Lists all migrations and their status
 * @param options Additional options
 */
export function listMigrations(options: { cwd?: string } = {}) {
  return executeSupabaseCli('migration list', options);
}

/**
 * Applies all pending migrations
 * @param options Additional options
 */
export function applyMigrations(options: { cwd?: string } = {}) {
  return executeSupabaseCli('db push', options);
}

/**
 * Resets the database and reapplies all migrations
 * @param options Additional options
 */
export function resetDatabase(options: { cwd?: string } = {}) {
  return executeSupabaseCli('db reset', options);
}

/**
 * Executes raw SQL against the database
 * @param client Supabase client
 * @param query SQL query to execute
 */
export async function executeSQL(
  client: SupabaseClient,
  query: string
): Promise<SqlExecutionResult> {
  const { data, error } = await client.rpc('pgclient_exec', { query });

  return {
    success: !error,
    data,
    error,
  };
}

/**
 * Initializes Supabase project structure in the current directory if it doesn't exist
 * @param options Additional options
 */
export function initializeSupabase(options: { cwd?: string } = {}) {
  return executeSupabaseCli('init', options);
}
