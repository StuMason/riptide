-- Migration: 003_user_sessions
-- Description: Create user sessions table with RLS

-- Up Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  auth_session_id UUID,
  device_info JSONB DEFAULT '{}'::jsonb,
  location_info JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN DEFAULT true,
  is_revoked BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own sessions
CREATE POLICY user_sessions_select_policy ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own sessions
CREATE POLICY user_sessions_update_policy ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to manage all sessions
CREATE POLICY user_sessions_service_policy ON user_sessions
  USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_auth_session_id_idx ON user_sessions(auth_session_id);

-- Down Migration
/* -- Uncomment to run down migration
DROP INDEX IF EXISTS user_sessions_auth_session_id_idx;
DROP INDEX IF EXISTS user_sessions_user_id_idx;
DROP POLICY IF EXISTS user_sessions_service_policy ON user_sessions;
DROP POLICY IF EXISTS user_sessions_update_policy ON user_sessions;
DROP POLICY IF EXISTS user_sessions_select_policy ON user_sessions;
DROP TABLE IF EXISTS user_sessions;
*/ 