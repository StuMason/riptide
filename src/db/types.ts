import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Represents a single database migration
 */
export interface Migration {
  id: number;
  name: string;
  filename: string;
  appliedAt?: Date;
}

/**
 * Status of migrations in the database
 */
export interface MigrationStatus {
  total: number;
  applied: number;
  pending: number;
  migrations: Migration[];
}

/**
 * Options for running migrations
 */
export interface MigrationOptions {
  client: SupabaseClient;
  dryRun?: boolean;
  verbose?: boolean;
  migrationTableName?: string;
}

/**
 * Result of running migrations
 */
export interface MigrationResult {
  success: boolean;
  appliedMigrations: Migration[];
  error?: Error;
}
