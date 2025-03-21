#!/usr/bin/env node
/**
 * RipTide Migration CLI
 *
 * This CLI tool helps with database migration operations
 */
import { createClient } from '@supabase/supabase-js';
import { getMigrationStatus, runMigrations, rollbackMigration } from './migrate';
import { Migration } from './types';
import { MIGRATION_TABLE } from './index';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

// Create Supabase client with service key
const client = createClient(supabaseUrl, supabaseKey);

/**
 * Formats migration status as a table
 */
function formatMigrationTable(migrations: Migration[]) {
  // Calculate column widths
  const idWidth = Math.max(...migrations.map(m => m.id.toString().length), 2);
  const nameWidth = Math.max(...migrations.map(m => m.name.length), 4);
  const filenameWidth = Math.max(...migrations.map(m => m.filename.length), 8);
  const statusWidth = 6;

  // Table header
  // eslint-disable-next-line no-console
  console.log(
    `| ${'ID'.padEnd(idWidth)} | ${'Name'.padEnd(nameWidth)} | ${'Filename'.padEnd(filenameWidth)} | ${'Status'.padEnd(statusWidth)} |`
  );
  // eslint-disable-next-line no-console
  console.log(
    `| ${'-'.repeat(idWidth)} | ${'-'.repeat(nameWidth)} | ${'-'.repeat(filenameWidth)} | ${'-'.repeat(statusWidth)} |`
  );

  // Table rows
  migrations.forEach(m => {
    const status = m.appliedAt ? 'Applied' : 'Pending';
    // eslint-disable-next-line no-console
    console.log(
      `| ${m.id.toString().padEnd(idWidth)} | ${m.name.padEnd(nameWidth)} | ${m.filename.padEnd(filenameWidth)} | ${status.padEnd(statusWidth)} |`
    );
  });
}

async function main() {
  const command = process.argv[2] || 'status';
  const options = { client, migrationTableName: MIGRATION_TABLE, verbose: true };

  try {
    switch (command) {
      case 'status': {
        const status = await getMigrationStatus(options);
        // eslint-disable-next-line no-console
        console.log(`Migration Status: ${status.applied}/${status.total} applied, ${status.pending} pending\n`);
        formatMigrationTable(status.migrations);
        break;
      }

      case 'up': {
        // eslint-disable-next-line no-console
        console.log('Running pending migrations...');
        const result = await runMigrations(options);

        if (result.success) {
          // eslint-disable-next-line no-console
          console.log(`Migration successful: ${result.appliedMigrations.length} migration(s) applied.`);
        } else {
          // eslint-disable-next-line no-console
          console.error(`Migration failed: ${result.error?.message}`);
          process.exit(1);
        }
        break;
      }

      case 'down': {
        // eslint-disable-next-line no-console
        console.log('Rolling back last migration...');
        const result = await rollbackMigration(options);

        if (result.success) {
          // eslint-disable-next-line no-console
          console.log(`Rollback successful: ${result.appliedMigrations.length} migration(s) rolled back.`);
        } else {
          // eslint-disable-next-line no-console
          console.error(`Rollback failed: ${result.error?.message}`);
          process.exit(1);
        }
        break;
      }

      case 'dry-run': {
        // eslint-disable-next-line no-console
        console.log('Dry run of pending migrations...');
        const dryRunOptions = { ...options, dryRun: true };
        const result = await runMigrations(dryRunOptions);

        if (result.success) {
          // eslint-disable-next-line no-console
          console.log(`Dry run successful: ${result.appliedMigrations.length} migration(s) would be applied.`);
        } else {
          // eslint-disable-next-line no-console
          console.error(`Dry run failed: ${result.error?.message}`);
          process.exit(1);
        }
        break;
      }

      default:
        // eslint-disable-next-line no-console
        console.error(`Unknown command: ${command}`);
        // eslint-disable-next-line no-console
        console.log('Available commands: status, up, down, dry-run');
        process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

main();
