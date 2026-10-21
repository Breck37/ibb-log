# Push Notifications

## How it fits together

```
sign in
  └─ NotificationProvider
       └─ registerForPushNotificationsAsync()   permission prompt → Expo push token
            └─ register_push_token RPC          → push_tokens row (owner-only RLS)

post a workout
  └─ useCreateWorkout
       └─ functions.invoke('notify-workout')    fire-and-forget
            └─ Edge Function (service role)     reads group members' tokens
                 └─ Expo push API               → group-mates' devices
                      └─ tap
                           └─ useNotificationRouting → /workout/[id]
```

| File                                        | Role                                                  |
| ------------------------------------------- | ----------------------------------------------------- |
| `lib/services/push-notifications.ts`        | Permissions, token resolution, save/remove            |
| `lib/hooks/use-notifications.ts`            | Receipt + tap listeners, deep-link routing            |
| `providers/notification-provider.tsx`       | Registers on sign-in, exposes `pushToken`             |
| `supabase/migrations/00005_push_tokens.sql` | `push_tokens` table + `register_push_token` RPC       |
| `supabase/functions/_shared/expo-push.ts`   | Expo push API client (chunking, dead-token detection) |
| `supabase/functions/notify-workout/`        | Fan-out on workout post                               |

## Design notes

**Why a `push_tokens` table instead of a column on `profiles`.** `profiles` carries an
"Anyone can view profiles" policy. An Expo push token is a bearer credential — anyone
holding it can send that device arbitrary notifications. A dedicated table keeps reads
owner-only. It also lets one user register more than one device.

**Why registration goes through an RPC.** When a second user signs in on a device that
already registered its token, the row has to change hands. The owner-only `UPDATE`
policy evaluates against the _existing_ row, so a plain upsert would be rejected. The
`register_push_token` function is `SECURITY DEFINER` and pins ownership to
`auth.uid()`, so the claim succeeds without loosening RLS.

**Why sending happens server-side.** The poster can't read their group-mates' tokens —
RLS forbids it, by design. The Edge Function uses the service role key, which bypasses
RLS.

**Why the invoke is fire-and-forget.** The workout is already committed by then. A push
failure must never surface as a failed post.

**Dead tokens** get pruned automatically: Expo reports `DeviceNotRegistered` for
uninstalled apps, and the function deletes those rows.

## Setup checklist

1. **Apple Developer Portal** — enable the Push Notifications capability on App ID
   `com.bdotdev.ibblog`, create an APNs key (`.p8`, one download only), note the Key ID
   and Team ID.
2. **EAS** — `eas credentials` and upload the APNs key.
3. **Supabase** — apply migration 00005 (`pnpm db:migrate`) and deploy the function:
   ```bash
   npx supabase functions deploy notify-workout --project-ref <project-ref>
   ```
4. **Build** — push needs a native build. `expo-notifications` was already a dependency
   but the plugin config changed, so OTA is not enough:
   ```bash
   pnpm build:prod:ios
   ```

## Testing

**You need a physical device.** Simulators are never issued a push token —
`registerForPushNotificationsAsync` returns `{ token: null }` there by design, so
nothing breaks, you just get no push.

### Verify registration

After signing in on a device, check the `push_tokens` table in the Supabase Table
Editor. One row per device, `token` starting `ExponentPushToken[`.

### Send a test push by hand

Grab the token from that table, then:

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "title": "Morning Crew",
    "body": "Brent posted a workout: Push day",
    "data": { "type": "workout_posted", "workoutId": "<a-real-workout-uuid>" }
  }'
```

Tapping it should land you on that workout's detail screen. Test all three states —
app foregrounded, backgrounded, and fully killed — the cold-start path is handled
separately via `getLastNotificationResponseAsync`.

### Verify the real fan-out

Needs two accounts in one group:

1. Sign in as A on one device, B on another (or B in the simulator — B just won't get
   the push).
2. Both join the same group.
3. A posts a workout.
4. B's device gets "**<group name>** — A posted a workout: <title>".

Function logs are under Edge Functions → `notify-workout` → Logs in the dashboard. The
response body reports `{ sent, pruned, errors }`, which is usually enough to tell a
permissions problem from a token problem.

## Not built yet

These were the other things push was blocking. The delivery plumbing
(`_shared/expo-push.ts`) is reusable for all of them:

- **Achievements** (FEATURE_PLAN #5) — milestone notifications, personal + group
- **Weekly report** (#6) — needs a scheduled function (pg_cron or an external cron)
- **Group chat notifications** (#8) — chat UI doesn't exist yet either
