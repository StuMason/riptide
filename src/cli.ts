#!/usr/bin/env node

import { Command } from 'commander';
import { setupSupabase } from './db';
import { join } from 'path';
import * as fs from 'fs';

// Get the directory path of the current module using Node's __dirname or process.cwd() as fallback
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Detect if we're running from the dist or src directory
const packageRoot = join(currentDir, '..');
// Determine the migrations directory based on where we're running from
let defaultMigrationsDir = join(packageRoot, 'src', 'db', 'migrations'); // Default fallback

// Check various possible locations for migrations
const possiblePaths = [
  join(packageRoot, 'src', 'db', 'migrations'),
  join(packageRoot, 'db', 'migrations'),
  join(process.cwd(), 'node_modules', '@masonator', 'riptide', 'src', 'db', 'migrations'),
];

for (const path of possiblePaths) {
  if (fs.existsSync(path)) {
    defaultMigrationsDir = path;
    break;
  }
}

const program = new Command();

program
  .name('riptide')
  .description('RipTide CLI for NextJS applications using Supabase')
  .version('0.1.0'); // Get this dynamically from your package.json in a real implementation

program
  .command('init')
  .description('Initialize Supabase for your NextJS application')
  .option('-s, --silent', 'Run in silent mode')
  .option('-m, --migrations-dir <dir>', 'Source directory for migrations', defaultMigrationsDir)
  .action(options => {
    const cwd = process.cwd();
    console.log('🌊 Initializing RipTide with Supabase...');
    console.log(`Using migrations from: ${options.migrationsDir}`);

    const result = setupSupabase({
      cwd,
      silent: options.silent,
      migrationsSourceDir: options.migrationsDir,
    });

    if (result.success) {
      console.log('✅ RipTide setup completed successfully!');
      console.log('📚 Documentation: https://github.com/masonator/riptide');
    } else {
      // Handle different error types
      let errorMessage: string;

      if (result.error instanceof Error) {
        errorMessage = result.error.message;
      } else if (typeof result.error === 'string') {
        errorMessage = result.error;
      } else if (result.error) {
        errorMessage = String(result.error);
      } else {
        errorMessage = 'Unknown error';
      }

      console.error('❌ Setup failed:', errorMessage);
      process.exit(1);
    }
  });

program.parse(process.argv);
