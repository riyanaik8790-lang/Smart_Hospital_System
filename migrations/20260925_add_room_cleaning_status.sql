-- Run once against an existing PostgreSQL/Supabase database.
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS cleaning_started_at TIMESTAMPTZ;
