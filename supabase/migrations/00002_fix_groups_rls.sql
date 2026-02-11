-- Fix groups SELECT policy to allow authenticated users to query the table.
-- The previous policy denied access entirely when a user had no groups,
-- causing "permission denied for table groups" errors.
drop policy if exists "Users can view groups" on public.groups;

create policy "Authenticated users can view groups"
  on public.groups for select using (auth.uid() is not null);

-- Grant table-level permissions for existing tables.
-- (00001 now uses ALTER DEFAULT PRIVILEGES for future tables, but tables
-- created before that change still need explicit grants.)
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to anon;
