-- ============================================================================
-- Push notification tokens
-- ============================================================================
--
-- Deliberately a separate table rather than a `push_token` column on `profiles`:
-- `profiles` carries an "Anyone can view profiles" policy, and an Expo push token is
-- a bearer credential — anyone holding it can push arbitrary notifications to that
-- device. A dedicated table lets us lock reads down to the owner. It also lets one
-- user register more than one device.
--
-- Edge Functions read this table with the service role key, which bypasses RLS.

create table public.push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  -- Expo push token, e.g. 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'.
  -- Unique because it identifies a physical device install: if a second user signs
  -- in on the same device, the row's user_id must move rather than duplicate.
  token text not null unique,
  platform text check (platform in ('ios', 'android')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

create trigger push_tokens_updated_at
  before update on public.push_tokens
  for each row execute function public.handle_updated_at();

alter table public.push_tokens enable row level security;

-- Owner-only access. No policy grants SELECT to anyone else, so one user can never
-- read another's token.
create policy "Users can view own push tokens"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "Users can register own push tokens"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own push tokens"
  on public.push_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete own push tokens"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

-- Registration goes through this function rather than a plain upsert from the client.
-- When a second user signs in on a device that already registered its token, the row
-- has to be reassigned — but the owner-only UPDATE policy above evaluates against the
-- *existing* row, so the new user would be blocked. SECURITY DEFINER lets the claim
-- succeed while still pinning ownership to the caller's own auth.uid().
create function public.register_push_token(p_token text, p_platform text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.push_tokens (user_id, token, platform)
  values (auth.uid(), p_token, p_platform)
  on conflict (token) do update
    set user_id = auth.uid(),
        platform = coalesce(excluded.platform, push_tokens.platform),
        updated_at = now();
end;
$$;

revoke all on function public.register_push_token(text, text) from public;
grant execute on function public.register_push_token(text, text) to authenticated;
