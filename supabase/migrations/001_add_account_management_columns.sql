-- Run once in the Supabase SQL Editor.
-- Makes existing user accounts active and adds columns required by login
-- and account deactivation.

alter table public.users
  add column if not exists is_active boolean not null default true,
  add column if not exists deleted_at timestamptz,
  add column if not exists auth_user_id uuid unique;

update public.users
set is_active = true
where is_active is null;
