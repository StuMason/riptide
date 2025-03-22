import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as db from './db';
import { join } from 'path';
import * as fs from 'fs';

// Mock the setupSupabase function
vi.mock('./db', () => ({
  setupSupabase: vi.fn(),
}));

// Mock fs.existsSync
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any);

// Save original argv and restore after tests
const originalArgv = process.argv;

describe('CLI', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Mock console.log and console.error
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset mocks
    vi.clearAllMocks();

    // Mock a default migration path existence
    (fs.existsSync as any).mockImplementation((path: string) => {
      if (path.includes('migrations')) {
        return true;
      }
      return false;
    });
  });

  afterEach(() => {
    // Restore process.argv
    process.argv = originalArgv;
  });

  it('should call setupSupabase with default options', async () => {
    // Setup mock to return success
    (db.setupSupabase as any).mockReturnValue({
      success: true,
      message: 'Supabase setup completed successfully',
    });

    // Set CLI args to invoke init command
    process.argv = ['node', 'riptide', 'init'];

    // Import CLI module (this will execute the script)
    await import('./cli');

    // Verify setupSupabase was called with expected args
    expect(db.setupSupabase).toHaveBeenCalledWith({
      cwd: process.cwd(),
      silent: undefined,
      migrationsSourceDir: expect.stringContaining('migrations'),
    });

    // Verify success message was logged
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ RipTide setup completed successfully!');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should pass silent flag to setupSupabase', async () => {
    // Setup mock to return success
    (db.setupSupabase as any).mockReturnValue({
      success: true,
      message: 'Supabase setup completed successfully',
    });

    // Set CLI args to invoke init command with silent flag
    process.argv = ['node', 'riptide', 'init', '--silent'];

    // Re-import CLI module
    vi.resetModules();
    await import('./cli');

    // Verify setupSupabase was called with silent: true
    expect(db.setupSupabase).toHaveBeenCalledWith({
      cwd: process.cwd(),
      silent: true,
      migrationsSourceDir: expect.stringContaining('migrations'),
    });
  });

  it('should pass custom migrations directory to setupSupabase', async () => {
    // Setup mock to return success
    (db.setupSupabase as any).mockReturnValue({
      success: true,
      message: 'Supabase setup completed successfully',
    });

    const customMigrationsDir = join(process.cwd(), 'custom', 'migrations');

    // Set CLI args to invoke init command with custom migrations directory
    process.argv = ['node', 'riptide', 'init', '--migrations-dir', customMigrationsDir];

    // Re-import CLI module
    vi.resetModules();
    await import('./cli');

    // Verify setupSupabase was called with custom migrations directory
    expect(db.setupSupabase).toHaveBeenCalledWith({
      cwd: process.cwd(),
      silent: undefined,
      migrationsSourceDir: customMigrationsDir,
    });
  });

  it('should handle setup failure and exit with code 1', async () => {
    // Setup mock to return failure
    (db.setupSupabase as any).mockReturnValue({
      success: false,
      error: new Error('Supabase CLI is not installed'),
    });

    // Set CLI args to invoke init command
    process.argv = ['node', 'riptide', 'init'];

    // Re-import CLI module
    vi.resetModules();
    await import('./cli');

    // Verify error was logged and process.exit was called with 1
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Setup failed:',
      'Supabase CLI is not installed'
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle non-Error type errors', async () => {
    // Setup mock to return failure with a string error
    (db.setupSupabase as any).mockReturnValue({
      success: false,
      error: 'String error message',
    });

    // Set CLI args to invoke init command
    process.argv = ['node', 'riptide', 'init'];

    // Re-import CLI module
    vi.resetModules();
    await import('./cli');

    // Verify error was logged and process.exit was called with 1
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Setup failed:', 'String error message');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle missing error object', async () => {
    // Setup mock to return failure with no error
    (db.setupSupabase as any).mockReturnValue({
      success: false,
      // No error property
    });

    // Set CLI args to invoke init command
    process.argv = ['node', 'riptide', 'init'];

    // Re-import CLI module
    vi.resetModules();
    await import('./cli');

    // Verify error was logged and process.exit was called with 1
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Setup failed:', 'Unknown error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  describe('Migrations Directory Discovery', () => {
    it('should find migrations in the package root', async () => {
      // Reset existsSync mock to only return true for a specific path
      (fs.existsSync as any).mockImplementation((path: string) => {
        return path === join(process.cwd(), 'src', 'db', 'migrations');
      });

      // Setup success response
      (db.setupSupabase as any).mockReturnValue({ success: true });

      // Set CLI args
      process.argv = ['node', 'riptide', 'init'];

      // Re-import CLI module
      vi.resetModules();
      await import('./cli');

      // Check the migrations dir passed to setupSupabase
      expect(db.setupSupabase).toHaveBeenCalledWith(
        expect.objectContaining({
          migrationsSourceDir: join(process.cwd(), 'src', 'db', 'migrations'),
        })
      );
    });

    it('should find migrations in the node_modules path', async () => {
      // Mock to only find migrations in node_modules
      const nodeModulesPath = join(
        process.cwd(),
        'node_modules',
        '@masonator',
        'riptide',
        'src',
        'db',
        'migrations'
      );

      (fs.existsSync as any).mockImplementation((path: string) => {
        return path === nodeModulesPath;
      });

      // Setup success response
      (db.setupSupabase as any).mockReturnValue({ success: true });

      // Set CLI args
      process.argv = ['node', 'riptide', 'init'];

      // Re-import CLI module
      vi.resetModules();
      await import('./cli');

      // Check the migrations dir passed to setupSupabase
      expect(db.setupSupabase).toHaveBeenCalledWith(
        expect.objectContaining({
          migrationsSourceDir: nodeModulesPath,
        })
      );
    });

    it('should use fallback path if no migrations directory is found', async () => {
      // Mock to not find any migrations directory
      (fs.existsSync as any).mockReturnValue(false);

      // Setup success response
      (db.setupSupabase as any).mockReturnValue({ success: true });

      // Set CLI args
      process.argv = ['node', 'riptide', 'init'];

      // Re-import CLI module
      vi.resetModules();
      await import('./cli');

      // Verify a default fallback was used
      expect(db.setupSupabase).toHaveBeenCalledWith(
        expect.objectContaining({
          migrationsSourceDir: expect.stringContaining('migrations'),
        })
      );
    });
  });
});
