-- Allow group admins to delete their group.
-- Previously only an UPDATE policy existed for admins; DELETE was missing,
-- causing Supabase RLS to silently no-op delete attempts.
create policy "Group admins can delete groups"
  on public.groups for delete using (public.is_group_admin(id));
