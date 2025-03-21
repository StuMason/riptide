import { SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { Migration, MigrationOptions, MigrationResult, MigrationStatus } from './types';

// Default options
const DEFAULT_OPTIONS: Partial<MigrationOptions> = {
  dryRun: false,
  verbose: false,
  migrationTableName: 'riptide_migrations',
};

/**
 * Creates the migrations table if it doesn't exist
 */
export async function ensureMigrationsTable(
  client: SupabaseClient,
  tableName: string
): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );
  `;

  await client.rpc('pgclient_exec', { query });
}

/**
 * Gets the list of applied migrations from the database
 */
export async function getAppliedMigrations(
  client: SupabaseClient,
  tableName: string
): Promise<Migration[]> {
  const query = `
    SELECT 
      id, 
      name, 
      filename, 
      applied_at as "appliedAt" 
    FROM ${tableName}
    ORDER BY id ASC;
  `;

  const { data, error } = await client.rpc('pgclient_exec', { query });

  if (error) {
    throw new Error(`Failed to get applied migrations: ${error.message}`);
  }

  return data || [];
}

/**
 * Gets the list of available migrations from the filesystem
 */
export function getAvailableMigrations(migrationsDir: string): Migration[] {
  const files = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  return files.map((filename, index) => {
    const id = index + 1;
    const name = filename.replace(/^\d+_(.+)\.sql$/, '$1');

    return {
      id,
      name,
      filename,
    };
  });
}

/**
 * Gets the status of migrations
 */
export async function getMigrationStatus(options: MigrationOptions): Promise<MigrationStatus> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { client, migrationTableName } = opts;

  await ensureMigrationsTable(client, migrationTableName!);

  const appliedMigrations = await getAppliedMigrations(client, migrationTableName!);
  const availableMigrations = getAvailableMigrations(path.join(__dirname, 'migrations'));

  const appliedMap = new Map(appliedMigrations.map(m => [m.filename, m]));

  const migrations = availableMigrations.map(m => ({
    ...m,
    appliedAt: appliedMap.get(m.filename)?.appliedAt,
  }));

  const applied = appliedMigrations.length;
  const total = availableMigrations.length;
  const pending = total - applied;

  return {
    total,
    applied,
    pending,
    migrations,
  };
}

/**
 * Executes a SQL file
 */
async function executeSqlFile(
  client: SupabaseClient,
  filePath: string,
  dryRun: boolean
): Promise<void> {
  const sql = fs.readFileSync(filePath, 'utf8');

  if (!dryRun) {
    const { error } = await client.rpc('pgclient_exec', { query: sql });
    if (error) {
      throw new Error(`Failed to execute SQL file ${filePath}: ${error.message}`);
    }
  }
}

/**
 * Runs pending migrations
 */
export async function runMigrations(options: MigrationOptions): Promise<MigrationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { client, dryRun, verbose, migrationTableName } = opts;

  try {
    await ensureMigrationsTable(client, migrationTableName!);

    const status = await getMigrationStatus(opts);

    if (status.pending === 0) {
      return {
        success: true,
        appliedMigrations: [],
      };
    }

    const pendingMigrations = status.migrations.filter(m => !m.appliedAt);
    const appliedMigrations: Migration[] = [];

    for (const migration of pendingMigrations) {
      if (verbose) {
        // eslint-disable-next-line no-console
        console.log(`Applying migration: ${migration.filename}`);
      }

      const filePath = path.join(__dirname, 'migrations', migration.filename);

      await executeSqlFile(client, filePath, dryRun!);

      if (!dryRun) {
        const insertQuery = `
          INSERT INTO ${migrationTableName} (name, filename)
          VALUES ('${migration.name}', '${migration.filename}');
        `;

        await client.rpc('pgclient_exec', { query: insertQuery });

        appliedMigrations.push(migration);
      }
    }

    return {
      success: true,
      appliedMigrations,
    };
  } catch (error) {
    return {
      success: false,
      appliedMigrations: [],
      error: error as Error,
    };
  }
}

/**
 * Rolls back the last applied migration
 */
export async function rollbackMigration(options: MigrationOptions): Promise<MigrationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { client, dryRun, verbose, migrationTableName } = opts;

  try {
    await ensureMigrationsTable(client, migrationTableName!);

    const appliedMigrations = await getAppliedMigrations(client, migrationTableName!);

    if (appliedMigrations.length === 0) {
      return {
        success: true,
        appliedMigrations: [],
      };
    }

    const lastMigration = appliedMigrations[appliedMigrations.length - 1];

    if (verbose) {
      // eslint-disable-next-line no-console
      console.log(`Rolling back migration: ${lastMigration.filename}`);
    }

    // Find and uncomment the down migration in the SQL file
    const filePath = path.join(__dirname, 'migrations', lastMigration.filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Extract down migration
    const downMatch = sql.match(/-- Down Migration\s+\/\*.*?(DROP.*?)\*\//s);

    if (!downMatch || !downMatch[1]) {
      throw new Error(`Could not find down migration in ${lastMigration.filename}`);
    }

    const downSql = downMatch[1].trim();

    if (!dryRun) {
      const { error } = await client.rpc('pgclient_exec', { query: downSql });

      if (error) {
        throw new Error(`Failed to execute rollback: ${error.message}`);
      }

      const deleteQuery = `
        DELETE FROM ${migrationTableName}
        WHERE id = ${lastMigration.id};
      `;

      await client.rpc('pgclient_exec', { query: deleteQuery });
    }

    return {
      success: true,
      appliedMigrations: [lastMigration],
    };
  } catch (error) {
    return {
      success: false,
      appliedMigrations: [],
      error: error as Error,
    };
  }
}
