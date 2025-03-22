-- Migration: 002_api_tokens
-- Description: Create API tokens table with RLS

-- Up Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_revoked BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own tokens
CREATE POLICY api_tokens_select_policy ON api_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own tokens
CREATE POLICY api_tokens_insert_policy ON api_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own tokens
CREATE POLICY api_tokens_update_policy ON api_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own tokens
CREATE POLICY api_tokens_delete_policy ON api_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to manage all tokens
CREATE POLICY api_tokens_service_policy ON api_tokens
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS api_tokens_user_id_idx ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS api_tokens_token_hash_idx ON api_tokens(token_hash);

-- Down Migration
/* -- Uncomment to run down migration
DROP INDEX IF EXISTS api_tokens_token_hash_idx;
DROP INDEX IF EXISTS api_tokens_user_id_idx;
DROP POLICY IF EXISTS api_tokens_service_policy ON api_tokens;
DROP POLICY IF EXISTS api_tokens_delete_policy ON api_tokens;
DROP POLICY IF EXISTS api_tokens_update_policy ON api_tokens;
DROP POLICY IF EXISTS api_tokens_insert_policy ON api_tokens;
DROP POLICY IF EXISTS api_tokens_select_policy ON api_tokens;
DROP TABLE IF EXISTS api_tokens;
*/ 