# Database and Migrations

## Objectives

- Design database schema for RipTide
- Create migration scripts
- Build migration utilities
- Ensure compatibility with local Supabase development

## Tasks

1. Design extended profile table schema
2. Design API tokens table schema
3. Design sessions table schema
4. Create SQL migration files for all tables
5. Build migration utility functions
6. Implement migration status checking
7. Create automated migration execution utilities
8. Test migrations on local Supabase instance

## Acceptance Criteria

- All required database tables have proper schemas
- SQL migration files are created for each table
- Migration utilities can check migration status
- Migration utilities can run migrations automatically
- Migrations work with local Supabase instances
- Migrations are idempotent (can be run multiple times safely)
- Database schema supports all RipTide features 