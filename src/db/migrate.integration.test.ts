/**
 * Integration tests for the migration system
 *
 * These tests require a running Supabase instance with the pgclient_exec RPC function.
 * To run these tests, set the following environment variables:
 *
 * - TEST_SUPABASE_URL
 * - TEST_SUPABASE_SERVICE_KEY
 *
 * Then run: vitest run db/migrate.integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getMigrationStatus, runMigrations, rollbackMigration } from './migrate';
import { MIGRATION_TABLE } from './index';

// Skip these tests if no test database is configured
const supabaseUrl = process.env.TEST_SUPABASE_URL;
const supabaseKey = process.env.TEST_SUPABASE_SERVICE_KEY;
const runTests = supabaseUrl && supabaseKey;

// Only run these tests if we have test DB credentials
const describeOrSkip = runTests ? describe : describe.skip;

describeOrSkip('Migration Integration Tests', () => {
  let client: SupabaseClient;
  const testMigrationTable = `test_${MIGRATION_TABLE}_${Date.now()}`;

  beforeAll(() => {
    if (runTests) {
      client = createClient(supabaseUrl!, supabaseKey!);
    }
  });

  afterAll(async () => {
    if (runTests) {
      // Clean up test tables
      const dropQuery = `DROP TABLE IF EXISTS ${testMigrationTable};`;
      await client.rpc('pgclient_exec', { query: dropQuery });
    }
  });

  it('should create migrations table', async () => {
    const status = await getMigrationStatus({
      client,
      migrationTableName: testMigrationTable,
    });

    expect(status).toBeDefined();
    expect(status.migrations.length).toBeGreaterThan(0);
  });

  it('should apply migrations and update status', async () => {
    // First run migrations
    const result = await runMigrations({
      client,
      migrationTableName: testMigrationTable,
    });

    expect(result.success).toBe(true);

    // Then check status
    const status = await getMigrationStatus({
      client,
      migrationTableName: testMigrationTable,
    });

    expect(status.applied).toBeGreaterThan(0);
    expect(status.pending).toBe(0);
  });

  it('should be idempotent when running migrations multiple times', async () => {
    // First get current status
    const initialStatus = await getMigrationStatus({
      client,
      migrationTableName: testMigrationTable,
    });

    // Run migrations again
    const result = await runMigrations({
      client,
      migrationTableName: testMigrationTable,
    });

    expect(result.success).toBe(true);
    expect(result.appliedMigrations.length).toBe(0);

    // Check status hasn't changed
    const finalStatus = await getMigrationStatus({
      client,
      migrationTableName: testMigrationTable,
    });

    expect(finalStatus.applied).toBe(initialStatus.applied);
  });

  it('should rollback the last migration', async () => {
    // Get initial status
    const initialStatus = await getMigrationStatus({
      client,
      migrationTableName: testMigrationTable,
    });

    if (initialStatus.applied === 0) {
      // Skip this test if no migrations applied
      return;
    }

    // Rollback the last migration
    const result = await rollbackMigration({
      client,
      migrationTableName: testMigrationTable,
    });

    expect(result.success).toBe(true);
    expect(result.appliedMigrations.length).toBe(1);

    // Check status has one less applied migration
    const finalStatus = await getMigrationStatus({
      client,
      migrationTableName: testMigrationTable,
    });

    expect(finalStatus.applied).toBe(initialStatus.applied - 1);
  });
});
