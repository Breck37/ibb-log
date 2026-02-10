-- Fix infinite recursion in group_members RLS policy.
-- The SELECT policy on group_members was querying group_members itself,
-- which re-triggered the same policy, causing infinite recursion.
-- Solution: use a security definer function to bypass RLS for membership checks.

create or replace function public.is_group_member(check_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = check_group_id
      and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Drop the recursive policy
drop policy "Members can view group members" on public.group_members;

-- Replace with a policy that uses the security definer function
create policy "Members can view group members"
  on public.group_members for select using (
    public.is_group_member(group_id)
  );

-- Groups SELECT: allow any authenticated user to read group metadata.
-- Group data (name, invite_code, settings) isn't sensitive — the sensitive
-- content (workouts, messages) is protected by its own policies.
-- This also avoids the chicken-and-egg problem where INSERT...RETURNING
-- requires the new row to pass the SELECT policy before the creator
-- has been added to group_members.
drop policy "Members can view their groups" on public.groups;

create policy "Authenticated users can view groups"
  on public.groups for select using (auth.uid() is not null);

-- Fix groups UPDATE policy
drop policy "Group admins can update groups" on public.groups;

create policy "Group admins can update groups"
  on public.groups for update using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
        and group_members.role = 'admin'
    )
  );
-- Note: the admin check above still works because by the time we evaluate
-- an UPDATE policy on groups, we're reading group_members with a SELECT
-- that now uses the security definer function (no recursion).

-- Fix workouts SELECT policy (also queries group_members)
drop policy "Members can view group workouts" on public.workouts;

create policy "Members can view group workouts"
  on public.workouts for select using (
    public.is_group_member(group_id)
  );

-- Fix group_messages SELECT policy
drop policy "Members can view group messages" on public.group_messages;

create policy "Members can view group messages"
  on public.group_messages for select using (
    public.is_group_member(group_id)
  );

-- Fix group_messages INSERT policy
drop policy "Members can send group messages" on public.group_messages;

create policy "Members can send group messages"
  on public.group_messages for insert with check (
    auth.uid() = user_id
    and public.is_group_member(group_id)
  );

-- Fix reactions SELECT policy (joins through workouts -> group_members)
drop policy "Members can view reactions" on public.reactions;

create policy "Members can view reactions"
  on public.reactions for select using (
    exists (
      select 1 from public.workouts w
      where w.id = reactions.workout_id
        and public.is_group_member(w.group_id)
    )
  );

-- Fix comments SELECT policy (same pattern as reactions)
drop policy "Members can view comments" on public.comments;

create policy "Members can view comments"
  on public.comments for select using (
    exists (
      select 1 from public.workouts w
      where w.id = comments.workout_id
        and public.is_group_member(w.group_id)
    )
  );
