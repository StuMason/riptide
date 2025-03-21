/**
 * Database utilities for RipTide
 * @packageDocumentation
 */

export * from './types';
export * from './migrate';

// Export any database model types and functions
export const MIGRATION_TABLE = 'riptide_migrations';

/**
 * Utility function to create Supabase RPC function for executing SQL
 *
 * This function should be created in your Supabase project:
 *
 * ```sql
 * create or replace function pgclient_exec(query text)
 * returns json
 * language plpgsql
 * security definer
 * as $$
 * declare
 *   result json;
 * begin
 *   execute query into result;
 *   return result;
 * exception
 *   when others then
 *     return json_build_object('error', SQLERRM);
 * end;
 * $$;
 * ```
 */
export const PGCLIENT_EXEC_FUNCTION = `
create or replace function pgclient_exec(query text)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  execute query into result;
  return result;
exception
  when others then
    return json_build_object('error', SQLERRM);
end;
$$;
`;
