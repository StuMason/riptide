import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as migrate from './migrate';
import { mockClient } from './mocks';
import { MockRpcResponse } from './types';
import fs from 'fs';
import path from 'path';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('fs');
vi.mock('path');

// Mock the module-level functions that access external resources
const mockGetAvailableMigrations = vi.fn();
vi.mock('./migrate', async () => {
  const actual = await vi.importActual<typeof import('./migrate')>('./migrate');
  return {
    ...actual,
    getAvailableMigrations: (...args: Parameters<typeof migrate.getAvailableMigrations>) => 
      mockGetAvailableMigrations(...args)
  };
}, { partial: true });

// Define types for mocks
interface MockRpcResponse {
  data: unknown;
  error: { message: string } | null;
}

// Mock Supabase client
const mockClient = {
  rpc: vi.fn<[string, Record<string, unknown>], Promise<MockRpcResponse>>(),
} as unknown as SupabaseClient;

describe('Migration Utilities', () => {
  // Default mock implementations
  const mockAvailableMigrations = [
    {
      id: 1,
      name: '01_create_profiles',
      filename: '01_create_profiles.sql',
      content: 'CREATE TABLE profiles (id UUID PRIMARY KEY);',
    },
    {
      id: 2,
      name: '02_create_api_tokens',
      filename: '02_create_api_tokens.sql',
      content: 'CREATE TABLE api_tokens (id UUID PRIMARY KEY);',
    },
    {
      id: 3,
      name: '03_create_user_sessions',
      filename: '03_create_user_sessions.sql',
      content: 'CREATE TABLE user_sessions (id UUID PRIMARY KEY);',
    },
  ];
  
  let mockGetAvailableMigrations = vi.fn().mockReturnValue(mockAvailableMigrations);
  
  // Set up fs.readdirSync mock
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock path.join to return the input
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.readdirSync to return migration files
    vi.mocked(fs.readdirSync).mockReturnValue([
      '01_create_profiles.sql',
      '02_create_api_tokens.sql',
      '03_create_user_sessions.sql',
    ] as unknown as fs.Dirent[]);
    
    // Mock fs.readFileSync to return SQL content
    vi.mocked(fs.readFileSync).mockImplementation((filePath: string) => {
      const filename = path.basename(filePath as string);
      const mockMigration = mockAvailableMigrations.find(m => m.filename === filename);
      return mockMigration ? mockMigration.content : '';
    });
    
    // Override getAvailableMigrations in the module
    mockGetAvailableMigrations = vi.fn().mockReturnValue(mockAvailableMigrations);
    
    // Override the getAvailableMigrations function in the migrate module
    vi.spyOn(migrate, 'getAvailableMigrations').mockImplementation(
      mockGetAvailableMigrations
    );
    
    // Default successful response for RPC calls
    vi.mocked(mockClient.rpc).mockResolvedValue({
      data: [],
      error: null,
    } as MockRpcResponse);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('getMigrationStatus', () => {
    it('should create migrations table if it does not exist', async () => {
      // First call should check if table exists - return empty array (table doesn't exist)
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      } as MockRpcResponse);

      // Second call should create the table - return success
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({
        data: null,
        error: null,
      } as MockRpcResponse);

      // Third call should get applied migrations - return empty array (no migrations applied yet)
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      } as MockRpcResponse);

      await migrate.getMigrationStatus({ client: mockClient, migrationTableName: 'migrations' });

      // Verify that the creation query was executed
      expect(mockClient.rpc).toHaveBeenCalledWith(
        'pgclient_exec',
        expect.objectContaining({
          query: expect.stringContaining('CREATE TABLE IF NOT EXISTS migrations'),
        })
      );
    });
    
    it('should return correct migration status when no migrations are applied', async () => {
      // First call should check if table exists - return some data (table exists)
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({
        data: [{ table_name: 'migrations' }],
        error: null,
      } as MockRpcResponse);

      // Second call should get applied migrations - return empty array (no migrations applied)
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      } as MockRpcResponse);

      const status = await migrate.getMigrationStatus({ client: mockClient, migrationTableName: 'migrations' });
      
      expect(status.total).toBe(3);
      expect(status.applied).toBe(0);
      expect(status.pending).toBe(3);
      expect(status.pendingMigrations.length).toBe(3);
      expect(status.pendingMigrations[0].name).toBe('01_create_profiles');
    });
    
    it('should return correct migration status when some migrations are applied', async () => {
      // First call should check if table exists - return some data (table exists)
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({
        data: [{ table_name: 'migrations' }],
        error: null,
      } as MockRpcResponse);

      // Second call should get applied migrations - return some applied migrations
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({
        data: [
          { id: 1, name: '01_create_profiles', created_at: new Date().toISOString() },
        ],
        error: null,
      } as MockRpcResponse);

      const status = await migrate.getMigrationStatus({ client: mockClient, migrationTableName: 'migrations' });
      
      expect(status.total).toBe(3);
      expect(status.applied).toBe(1);
      expect(status.pending).toBe(2);
      expect(status.pendingMigrations.length).toBe(2);
      expect(status.pendingMigrations[0].name).toBe('02_create_api_tokens');
    });
  });
  
  describe('runMigrations', () => {
    it('should not apply any migrations if there are no pending migrations', async () => {
      // Mock getMigrationStatus to return no pending migrations
      const mockStatus = {
        total: 3,
        applied: 3,
        pending: 0,
        pendingMigrations: [],
        appliedMigrations: mockAvailableMigrations,
      };
      
      vi.spyOn(migrate, 'getMigrationStatus').mockResolvedValue(mockStatus);
      
      const result = await migrate.runMigrations({ client: mockClient, migrationTableName: 'migrations' });
      
      expect(result.success).toBe(true);
      expect(result.appliedMigrations.length).toBe(0);
    });
    
    it('should apply pending migrations', async () => {
      // Mock migration status
      const mockStatus = {
        total: 3,
        applied: 1,
        pending: 2,
        pendingMigrations: [
          mockAvailableMigrations[1],
          mockAvailableMigrations[2],
        ],
        appliedMigrations: [mockAvailableMigrations[0]],
      };
      
      vi.spyOn(migrate, 'getMigrationStatus').mockResolvedValue(mockStatus);
      
      // Ensure RPC calls return success
      vi.mocked(mockClient.rpc)
        .mockResolvedValueOnce({ data: null, error: null } as MockRpcResponse) // Apply SQL
        .mockResolvedValueOnce({ data: null, error: null } as MockRpcResponse) // Record migration
        .mockResolvedValueOnce({ data: null, error: null } as MockRpcResponse) // Apply SQL
        .mockResolvedValueOnce({ data: null, error: null } as MockRpcResponse); // Record migration
      
      const result = await migrate.runMigrations({ client: mockClient, migrationTableName: 'migrations' });
      
      expect(result.success).toBe(true);
      expect(result.appliedMigrations.length).toBe(2);
    });
    
    it('should handle errors during migration', async () => {
      // Mock migration status
      const mockStatus = {
        total: 2,
        applied: 1,
        pending: 1,
        pendingMigrations: [mockAvailableMigrations[1]],
        appliedMigrations: [mockAvailableMigrations[0]],
      };
      
      vi.spyOn(migrate, 'getMigrationStatus').mockResolvedValue(mockStatus);
      
      // Setup mock file content
      vi.mocked(fs.readFileSync).mockReturnValue('CREATE TABLE test (id INT);');
      
      // First migration fails
      vi.mocked(mockClient.rpc)
        .mockResolvedValueOnce({ data: null, error: { message: 'SQL error' } } as MockRpcResponse); // SQL execution fails
      
      const result = await migrate.runMigrations({ client: mockClient, migrationTableName: 'migrations' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('rollbackMigration', () => {
    it('should not rollback if no migrations are applied', async () => {
      // Mock empty applied migrations
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({ data: [], error: null } as MockRpcResponse);
      
      const result = await migrate.rollbackMigration({ client: mockClient, migrationTableName: 'migrations' });
      
      expect(result.success).toBe(true);
      expect(result.appliedMigrations.length).toBe(0);
    });
    
    it('should rollback the last applied migration', async () => {
      // Mock one applied migration
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({
        data: [{ id: 1, name: '01_create_profiles', created_at: '2023-01-01' }],
        error: null,
      } as MockRpcResponse);
      
      // Mock successful SQL execution
      vi.mocked(mockClient.rpc)
        .mockResolvedValueOnce({ data: null, error: null } as MockRpcResponse) // Execute down migration
        .mockResolvedValueOnce({ data: null, error: null } as MockRpcResponse); // Delete migration record
      
      const result = await migrate.rollbackMigration({ client: mockClient, migrationTableName: 'migrations' });
      
      expect(result.success).toBe(true);
      expect(result.appliedMigrations.length).toBe(1);
      expect(mockClient.rpc).toHaveBeenCalledWith('pgclient_exec', { 
        query: expect.stringContaining('DROP TABLE')
      });
    });
    
    it('should handle errors during rollback', async () => {
      // Mock one applied migration
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({
        data: [{ id: 1, name: '01_create_profiles', created_at: '2023-01-01' }],
        error: null,
      } as MockRpcResponse);
      
      // Mock SQL execution error
      vi.mocked(mockClient.rpc).mockResolvedValueOnce({ data: null, error: { message: 'SQL error' } } as MockRpcResponse);
      
      const result = await migrate.rollbackMigration({ client: mockClient, migrationTableName: 'migrations' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
