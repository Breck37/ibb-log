-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view any profile"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Groups
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invite_code text unique default substring(gen_random_uuid()::text, 1, 8) not null,
  min_workouts_per_week int default 3 not null,
  min_workout_minutes_to_qualify int default 30 not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.groups enable row level security;

-- Group members
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' not null check (role in ('admin', 'member')),
  joined_at timestamptz default now() not null,
  unique (group_id, user_id)
);

alter table public.group_members enable row level security;

-- Groups: members can view, admins can update
create policy "Members can view their groups"
  on public.groups for select using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Any authenticated user can create groups"
  on public.groups for insert with check (auth.uid() = created_by);

create policy "Group admins can update groups"
  on public.groups for update using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
        and group_members.role = 'admin'
    )
  );

-- Group members: members can view, admins can manage
create policy "Members can view group members"
  on public.group_members for select using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Users can join groups"
  on public.group_members for insert with check (auth.uid() = user_id);

create policy "Users can leave groups"
  on public.group_members for delete using (auth.uid() = user_id);

-- Workouts
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  duration_minutes int not null check (duration_minutes > 0),
  routine text not null,
  notes text,
  image_urls text[] default '{}' not null,
  week_key text not null, -- ISO week: '2026-W06'
  is_qualified boolean default false not null,
  created_at timestamptz default now() not null
);

create index workouts_group_week on public.workouts (group_id, week_key);
create index workouts_user_group on public.workouts (user_id, group_id);

alter table public.workouts enable row level security;

create policy "Members can view group workouts"
  on public.workouts for select using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = workouts.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Users can insert own workouts"
  on public.workouts for insert with check (auth.uid() = user_id);

create policy "Users can update own workouts"
  on public.workouts for update using (auth.uid() = user_id);

create policy "Users can delete own workouts"
  on public.workouts for delete using (auth.uid() = user_id);

-- Reactions
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now() not null,
  unique (workout_id, user_id, emoji)
);

alter table public.reactions enable row level security;

create policy "Members can view reactions"
  on public.reactions for select using (
    exists (
      select 1 from public.workouts w
      join public.group_members gm on gm.group_id = w.group_id
      where w.id = reactions.workout_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Users can add reactions"
  on public.reactions for insert with check (auth.uid() = user_id);

create policy "Users can remove own reactions"
  on public.reactions for delete using (auth.uid() = user_id);

-- Comments
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz default now() not null
);

alter table public.comments enable row level security;

create policy "Members can view comments"
  on public.comments for select using (
    exists (
      select 1 from public.workouts w
      join public.group_members gm on gm.group_id = w.group_id
      where w.id = comments.workout_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Users can add comments"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.comments for update using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- Group messages
create table public.group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now() not null
);

alter table public.group_messages enable row level security;

create policy "Members can view group messages"
  on public.group_messages for select using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = group_messages.group_id
        and group_members.user_id = auth.uid()
    )
  );

create policy "Members can send group messages"
  on public.group_messages for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_members
      where group_members.group_id = group_messages.group_id
        and group_members.user_id = auth.uid()
    )
  );

-- Enable realtime on feed-related tables
alter publication supabase_realtime add table public.workouts;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.group_messages;

-- Auto-create profile on user signup (trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger groups_updated_at
  before update on public.groups
  for each row execute function public.handle_updated_at();
