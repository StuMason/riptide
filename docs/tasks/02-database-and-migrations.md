# Task 02: Database Schema and Migrations

> ✅ **COMPLETED**

## Objectives

- ✅ Design the database schema for user profiles and API tokens
- ✅ Create migration scripts for initializing the database
- ✅ Build migration utilities for checking status and applying migrations
- ✅ Ensure migrations work with Supabase local development

## Tasks

- ✅ Design the following database table schemas:
  - ✅ User Profiles - storing user profile information
  - ✅ API Tokens - storing user-generated API tokens
  - ✅ User Sessions - for managing user sessions
- ✅ Create SQL migration files for each table
- ✅ Build utility functions for:
  - ✅ Checking migration status
  - ✅ Running migrations automatically
  - ✅ Rolling back migrations if needed
- ✅ Implement a migration status checker
- ✅ Test migrations on a local Supabase instance

## Implementation Details

### Database Schema

Three primary tables were designed with Row Level Security (RLS) policies:

1. **profiles**
   - Links to `auth.users` with ON DELETE CASCADE
   - Stores display name and avatar URL
   - RLS policies ensure users can only access their own profile

2. **api_tokens**
   - Stores user-generated API tokens
   - Includes hashed tokens, name, and expiration
   - RLS policies ensure users can only access their own tokens

3. **user_sessions**
   - Manages user session data
   - Enables multi-device login tracking
   - RLS policies restrict access to user's own sessions

### Migration System

Implemented a wrapper around the Supabase CLI for managing migrations:

- Created SQL migration files for each table schema
- Built TypeScript utilities for migration management
- Implemented CLI commands for managing migrations
- Added npm scripts for convenient migration operations

### Approach

Instead of building a custom migration system, we leveraged Supabase's built-in migration capabilities:

- Uses Supabase CLI for migration management
- Provides a simple JS/TS API for executing Supabase CLI commands
- Ensures proper type definitions for TypeScript projects
- Supports idempotent migrations with proper error handling

## Acceptance Criteria

- ✅ All required database tables must have proper schemas with correctly typed columns
- ✅ SQL migration files must be created for each table
- ✅ Migration utilities must be able to check migration status and run migrations automatically
- ✅ Migrations must work with local Supabase instances
- ✅ Migrations must be idempotent (can be run multiple times without side effects)
- ✅ The database schema must support all RipTide features

## Testing

- ✅ Unit tests for migration utilities
- ✅ Test coverage for error handling scenarios
- ✅ Setup for integration tests with Supabase CLI

## Usage

The migration system can be used in two ways:

1. **Via npm scripts**:
   ```bash
   npm run migrate:init     # Initialize Supabase project
   npm run migrate:new      # Create a new migration
   npm run migrate:list     # Check migration status
   npm run migrate:push     # Apply pending migrations
   npm run migrate:reset    # Reset database and reapply migrations
   ```

2. **Programmatically**:
   ```typescript
   import { 
     initializeSupabase, 
     createMigration, 
     listMigrations, 
     applyMigrations 
   } from '@masonator/riptide';
   
   // Initialize a project
   const initResult = initializeSupabase();
   
   // Create a migration
   const createResult = createMigration('create_profiles_table');
   
   // Apply migrations
   const applyResult = await applyMigrations();
   ``` 