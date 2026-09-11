-- Run once in the Supabase SQL Editor.
-- Adds the optional application-user link used to hide doctors whose
-- corresponding staff account has been deactivated.

alter table public.doctors
  add column if not exists user_id bigint unique references public.users(user_id);
