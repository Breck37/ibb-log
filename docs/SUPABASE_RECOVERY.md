# Supabase Recovery

The free-tier project went inactive and may be paused or gone. This is how to get a
working backend again.

Everything the app needs schema-wise lives in `supabase/migrations/` and replays onto
an empty project. What does **not** live in migrations is listed in step 4 — that's the
part that bites.

> **The workout/group data is not recoverable** on the free tier (no PITR, and a
> deleted project takes its backups with it). Since the only users so far are you and
> your buddies, treat this as a fresh start rather than a restore.

---

## Step 1: Find out which situation you're in

Open [supabase.com/dashboard](https://supabase.com/dashboard) and look at the project.

| What you see                               | What it means                                       |
| ------------------------------------------ | --------------------------------------------------- |
| Project listed, "Paused", with **Restore** | Inactivity pause. Click Restore, then go to step 3. |
| Project not listed at all                  | Deleted. Go to step 2.                              |
| Project listed and healthy                 | Nothing was lost — go straight to step 3.           |

Free projects pause after a stretch of inactivity and can sit paused for a long time
before anything irreversible happens, so check before assuming the worst.

## Step 2: Create a replacement project (only if it's gone)

1. New project → same region you used before → save the database password.
2. Note the **Project URL** and **anon key** from Settings → API.
3. Note the **project ref** (the subdomain in the project URL) — you need it to deploy
   Edge Functions.

## Step 3: Apply the migrations

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
pnpm db:migrate          # supabase db push
```

On an empty project this applies `00001`–`00005` in order, which creates every table,
RLS policy, helper function, storage bucket, and the `push_tokens` table.

Then regenerate the types so they match the live DB:

```bash
pnpm db:gen-types
```

`lib/database.types.ts` currently has the `push_tokens` table and the
`register_push_token` function hand-added (the DB wasn't reachable when push was
built). Regenerating should produce an equivalent file — if the diff is large, trust
the generated one.

## Step 4: Redo the settings that aren't in migrations

This is the easy part to forget. None of it is in version control.

### Auth → URL Configuration

Add the deep-link scheme to the redirect allow list, or invite links and password
resets will silently fail to return to the app:

```
ibblog://*
```

The app sends users to `ibblog://group/join?code=...`, `ibblog://reset-password`, and
`ibblog://` — see `providers/auth-provider.tsx`.

### Auth → SMTP

Re-enter the Resend SMTP credentials for `noreply@ibb-log.com`. Without this, Supabase
falls back to its own low-rate sender and confirmation emails get throttled.

### Edge Functions

```bash
npx supabase functions deploy notify-workout --project-ref <project-ref>
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically. Only set `EXPO_ACCESS_TOKEN` if you later enable push security on the
Expo project.

## Step 5: Point the app at it

`.env.local` (not committed — see `.env.local.example`):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

And for EAS builds:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "<url>" --scope project --force
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<key>" --scope project --force
```

`--force` overwrites the secrets pointing at the old project. Builds bake these in, so
**any build made before this points at the dead database** — rebuild, don't OTA.

## Step 6: Smoke test

1. Sign up a fresh account — confirms auth, the `handle_new_user` trigger, and SMTP.
2. Create a group — confirms `groups` + `group_members` RLS.
3. Log a workout with a photo — confirms the storage bucket and policies.
4. Check `push_tokens` has a row for your user (Table Editor) — confirms registration.
5. With a second account in the same group, post a workout and watch for the push.

---

## Avoiding a repeat

Free projects pause on inactivity, which is exactly what happens to a side project
between bursts of work. Options, cheapest first:

- **Accept it** and keep this doc current. The schema replays in minutes; only data is
  at risk, and there's no real data yet.
- **Keep it warm** — any query resets the inactivity clock. A scheduled GitHub Action
  hitting the REST endpoint weekly is enough.
- **Upgrade to Pro** (~$25/mo) once your buddies are actually using it. No pausing,
  plus daily backups. Worth it the day the data starts mattering.

Before that day, take a schema + data dump you can actually restore from:

```bash
npx supabase db dump --linked -f backup-schema.sql
npx supabase db dump --linked --data-only -f backup-data.sql
```
