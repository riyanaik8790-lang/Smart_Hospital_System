-- Run once against an existing database before deploying the account-management UI.
-- Kept separate because CREATE TABLE IF NOT EXISTS does not add columns to old tables.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Optional link for installations that use Supabase Auth as well as this
-- application users table. NULL is valid for the project's current JWT login.
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique
  ON users (auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_active_role_idx ON users (is_active, role);
