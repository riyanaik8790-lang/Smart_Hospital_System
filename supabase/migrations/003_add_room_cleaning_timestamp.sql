-- Run in the Supabase SQL Editor when deploying room cleaning workflow.
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS cleaning_started_at timestamptz;
