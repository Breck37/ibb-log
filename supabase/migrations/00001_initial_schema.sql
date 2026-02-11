-- ============================================================================
-- IBB Log — Initial Schema
-- ============================================================================
-- Clean slate: drops everything and rebuilds from scratch.
-- Run via: supabase db push (after clearing remote via SQL editor)
-- ============================================================================

drop schema public cascade;
create schema public;
grant all on schema public to postgres, anon, authenticated, service_role;

-- Grant table-level permissions so authenticated/anon roles can access tables.
-- (RLS policies still control which rows are visible.)
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon;

-- ============================================================================
-- Utility Functions (no table dependencies)
-- ============================================================================

-- Auto-set updated_at on row update.
create function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Auto-create profile on auth.users signup.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- Tables
-- ============================================================================

-- PROFILES (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- GROUPS
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  subtitle text,
  avatar_url text,
  visibility text default 'private' not null check (visibility in ('public', 'private')),
  invite_code text unique default substring(gen_random_uuid()::text, 1, 8) not null,
  min_workouts_per_week int default 3 not null,
  min_workout_minutes_to_qualify int default 30 not null,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- GROUP MEMBERS
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' not null check (role in ('admin', 'member')),
  joined_at timestamptz default now() not null,
  unique (group_id, user_id)
);

-- GROUP INVITES
create table public.group_invites (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  invited_by uuid references public.profiles(id) on delete cascade not null,
  invited_user_id uuid references public.profiles(id) on delete cascade,
  invited_email text,
  role text default 'member' not null check (role in ('admin', 'member')),
  token text unique default gen_random_uuid()::text not null,
  status text default 'pending' not null check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now() not null,
  expires_at timestamptz default (now() + interval '7 days') not null,
  -- Must have either a user_id or an email
  check (invited_user_id is not null or invited_email is not null)
);

-- WORKOUTS (user-owned, can exist without groups)
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  duration_minutes int not null check (duration_minutes > 0),
  image_urls text[] default '{}' not null,
  created_at timestamptz default now() not null
);

-- GROUP WORKOUTS (junction: workout posted to a group)
create table public.group_workouts (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  week_key text not null, -- ISO week: '2026-W06'
  is_qualified boolean default false not null,
  created_at timestamptz default now() not null,
  unique (workout_id, group_id)
);

-- REACTIONS (per-group, on group_workouts)
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  group_workout_id uuid references public.group_workouts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now() not null,
  unique (group_workout_id, user_id, emoji)
);

-- COMMENTS (per-group, on group_workouts)
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  group_workout_id uuid references public.group_workouts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- GROUP MESSAGES (chat)
create table public.group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now() not null
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_group_workouts_group_week on public.group_workouts (group_id, week_key);
create index idx_group_workouts_workout on public.group_workouts (workout_id);
create index idx_workouts_user on public.workouts (user_id);
create index idx_group_invites_token on public.group_invites (token);
create index idx_group_invites_email on public.group_invites (invited_email) where invited_email is not null;
create index idx_group_invites_user on public.group_invites (invited_user_id) where invited_user_id is not null;
create index idx_comments_group_workout on public.comments (group_workout_id);
create index idx_reactions_group_workout on public.reactions (group_workout_id);
create index idx_group_messages_group on public.group_messages (group_id, created_at);

-- ============================================================================
-- Triggers
-- ============================================================================

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger groups_updated_at
  before update on public.groups
  for each row execute function public.handle_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Security Definer Functions (require group_members table to exist)
-- ============================================================================

-- Checks group membership without triggering RLS recursion.
create function public.is_group_member(check_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = check_group_id
      and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Checks if user is an admin of a group.
create function public.is_group_admin(check_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = check_group_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.workouts enable row level security;
alter table public.group_workouts enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.group_messages enable row level security;

-- PROFILES
create policy "Anyone can view profiles"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete using (auth.uid() = id);

-- GROUPS
-- Public groups: any authenticated user can see.
-- Private groups: only members can see.
-- This also allows INSERT...RETURNING to work (creator can see the row).
create policy "Users can view groups"
  on public.groups for select using (
    visibility = 'public'
    or auth.uid() = created_by
    or public.is_group_member(id)
  );

create policy "Authenticated users can create groups"
  on public.groups for insert with check (auth.uid() = created_by);

create policy "Group admins can update groups"
  on public.groups for update using (public.is_group_admin(id));

-- GROUP MEMBERS
create policy "Members can view group members"
  on public.group_members for select using (public.is_group_member(group_id));

-- Insert is handled through invite acceptance flow or group creation.
-- Group creators insert themselves as admin directly.
create policy "Users can join groups"
  on public.group_members for insert with check (auth.uid() = user_id);

create policy "Users can leave groups"
  on public.group_members for delete using (auth.uid() = user_id);

-- Admins can remove members
create policy "Admins can remove group members"
  on public.group_members for delete using (public.is_group_admin(group_id));

-- GROUP INVITES
-- Users can see invites they sent or received
create policy "Users can view their invites"
  on public.group_invites for select using (
    auth.uid() = invited_by
    or auth.uid() = invited_user_id
  );

-- Members can create invites, but only admins can set role to 'admin'
create policy "Members can create invites"
  on public.group_invites for insert with check (
    auth.uid() = invited_by
    and public.is_group_member(group_id)
    and (
      role = 'member'
      or public.is_group_admin(group_id)
    )
  );

-- Invited users can update their invite status (accept/decline)
create policy "Invited users can respond to invites"
  on public.group_invites for update using (
    auth.uid() = invited_user_id
  );

-- Inviters can delete their own invites
create policy "Inviters can delete invites"
  on public.group_invites for delete using (auth.uid() = invited_by);

-- WORKOUTS
-- Users can see their own workouts + workouts posted to their groups
create policy "Users can view workouts"
  on public.workouts for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.group_workouts gw
      where gw.workout_id = workouts.id
        and public.is_group_member(gw.group_id)
    )
  );

create policy "Users can create own workouts"
  on public.workouts for insert with check (auth.uid() = user_id);

create policy "Users can update own workouts"
  on public.workouts for update using (auth.uid() = user_id);

create policy "Users can delete own workouts"
  on public.workouts for delete using (auth.uid() = user_id);

-- GROUP WORKOUTS
create policy "Members can view group workouts"
  on public.group_workouts for select using (public.is_group_member(group_id));

create policy "Users can post workouts to their groups"
  on public.group_workouts for insert with check (
    public.is_group_member(group_id)
    and exists (
      select 1 from public.workouts w
      where w.id = group_workouts.workout_id
        and w.user_id = auth.uid()
    )
  );

create policy "Users can remove own workout from group"
  on public.group_workouts for delete using (
    exists (
      select 1 from public.workouts w
      where w.id = group_workouts.workout_id
        and w.user_id = auth.uid()
    )
  );

-- REACTIONS
create policy "Members can view reactions"
  on public.reactions for select using (
    exists (
      select 1 from public.group_workouts gw
      where gw.id = reactions.group_workout_id
        and public.is_group_member(gw.group_id)
    )
  );

create policy "Members can add reactions"
  on public.reactions for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_workouts gw
      where gw.id = reactions.group_workout_id
        and public.is_group_member(gw.group_id)
    )
  );

create policy "Users can remove own reactions"
  on public.reactions for delete using (auth.uid() = user_id);

-- COMMENTS
create policy "Members can view comments"
  on public.comments for select using (
    exists (
      select 1 from public.group_workouts gw
      where gw.id = comments.group_workout_id
        and public.is_group_member(gw.group_id)
    )
  );

create policy "Members can add comments"
  on public.comments for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_workouts gw
      where gw.id = comments.group_workout_id
        and public.is_group_member(gw.group_id)
    )
  );

create policy "Users can update own comments"
  on public.comments for update using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- GROUP MESSAGES
create policy "Members can view group messages"
  on public.group_messages for select using (public.is_group_member(group_id));

create policy "Members can send group messages"
  on public.group_messages for insert with check (
    auth.uid() = user_id
    and public.is_group_member(group_id)
  );

-- ============================================================================
-- Realtime
-- ============================================================================

alter publication supabase_realtime add table public.group_workouts;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.group_messages;
