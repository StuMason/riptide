/**
 * RipTide Migrations CLI
 *
 * This CLI tool helps with database migration operations by wrapping Supabase CLI
 */
import {
  createMigration,
  applyMigrations,
  listMigrations,
  resetDatabase,
  initializeSupabase,
} from './index';

// Main function
async function main() {
  const command = process.argv[2] || 'help';
  const args = process.argv.slice(3);

  // Variables for command results
  let initResult;
  let migrationName;
  let createResult;
  let listResult;
  let pushResult;
  let resetResult;

  try {
    // Execute the appropriate command
    switch (command) {
      case 'init':
        // eslint-disable-next-line no-console
        console.log('Initializing Supabase project...');
        initResult = initializeSupabase();
        if (!initResult.success) {
          throw initResult.error;
        }
        // eslint-disable-next-line no-console
        console.log('Supabase project initialized successfully.');
        break;

      case 'new':
        if (args.length === 0) {
          throw new Error('Migration name is required');
        }
        migrationName = args[0];
        // eslint-disable-next-line no-console
        console.log(`Creating new migration: ${migrationName}`);
        createResult = createMigration(migrationName);
        if (!createResult.success) {
          throw createResult.error;
        }
        // eslint-disable-next-line no-console
        console.log('Migration created successfully.');
        break;

      case 'list':
        // eslint-disable-next-line no-console
        console.log('Listing migrations...');
        listResult = listMigrations();
        if (!listResult.success) {
          throw listResult.error;
        }
        break;

      case 'push':
        // eslint-disable-next-line no-console
        console.log('Applying migrations...');
        pushResult = applyMigrations();
        if (!pushResult.success) {
          throw pushResult.error;
        }
        // eslint-disable-next-line no-console
        console.log('Migrations applied successfully.');
        break;

      case 'reset':
        // eslint-disable-next-line no-console
        console.log('Resetting database...');
        resetResult = resetDatabase();
        if (!resetResult.success) {
          throw resetResult.error;
        }
        // eslint-disable-next-line no-console
        console.log('Database reset successfully.');
        break;

      case 'help':
      default:
        // eslint-disable-next-line no-console
        console.log(`
RipTide Migrations CLI

Usage:
  node cli.js <command> [options]

Commands:
  init                     Initialize Supabase project structure
  new <name>               Create a new migration
  list                     List all migrations and their status
  push                     Apply all pending migrations
  reset                    Reset database and reapply all migrations
  help                     Show this help message
        `);
        break;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the main function
main();
