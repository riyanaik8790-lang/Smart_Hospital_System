-- Run once against an existing database.
-- Existing accounts retain access; only accounts created by the Admin flow are
-- marked as needing a first-login password change.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
