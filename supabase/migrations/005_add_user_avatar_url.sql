-- Run once in the Supabase SQL Editor for existing installations.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
