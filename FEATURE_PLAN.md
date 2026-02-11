# Feature Implementation Plan

Each feature below is scoped as an independent unit of work. Descriptions are written to be self-contained — hand any section to an AI or developer and they should have enough context to implement it.

Features are ordered by recommended implementation sequence (dependencies flow downward).

---

## 1. Push Notifications Infrastructure

**Priority**: High (blocks weekly reports, achievements, and other notification features)

### Context

The app currently has zero push notification support. `expo-notifications` is not installed, iOS entitlements are not configured, and there is no server-side push delivery mechanism.

### Scope

- Install and configure `expo-notifications` and `expo-device`
- Register for push notifications on app launch, prompt user for permission
- Store the user's Expo push token in the `profiles` table (add `push_token` column)
- Create a reusable push notification service in `lib/services/push-notifications.ts` that:
  - Handles token registration and refresh
  - Provides a `sendPushNotification(userId, title, body, data)` utility
- Handle foreground, background, and killed-state notification receipt
- Set up notification tap handlers to deep link to relevant screens (e.g., tap workout notification → navigate to that workout)
- Add `expo-notifications` plugin to `app.json`

### Database Changes

- Add `push_token: text` column to `profiles` table

### Files to Create/Modify

- `lib/services/push-notifications.ts` — token registration, permission handling
- `lib/hooks/use-notifications.ts` — hook for notification listeners and handlers
- `providers/notification-provider.tsx` — wrap app root with notification setup
- `app/_layout.tsx` — integrate notification provider
- `app.json` — add expo-notifications plugin
- `supabase/migrations/` — new migration for push_token column

### Key Decisions

- Use Expo's push notification service (no need for direct APNs integration)
- Server-side sending can be done via Supabase Edge Functions or a simple fetch to Expo's push API
- Consider whether to use Supabase Edge Functions for push delivery or handle it client-side initially

---

## 2. Workout Number Labels (#1, #2, #3)

**Priority**: High (core UX improvement, no external dependencies)

### Context

The `group_workouts` table already tracks `week_key` and qualification status. Posts need a visible label showing which qualifying workout number they are for the week (e.g., #1, #2, #3). Non-qualifying workouts should show a "didn't qualify" icon instead. See PRODUCT.md → Post Labels.

### Scope

- When a workout is posted to a group, calculate its qualifying workout number for that week:
  - Query `group_workouts` for the same user, group, and `week_key` where `qualified = true`
  - The new workout's number = count of prior qualifying workouts + 1
- Store the workout number on the `group_workouts` row (add `workout_number: integer` column, nullable — null means didn't qualify)
- Update the post/card UI component to display:
  - `#N` badge for qualifying workouts
  - "Didn't qualify" icon for non-qualifying workouts
- Ensure the number is calculated at post time, not at render time (so it's stable)

### Database Changes

- Add `workout_number: integer` (nullable) column to `group_workouts`

### Files to Create/Modify

- `lib/hooks/use-workouts.ts` — update workout creation logic to calculate and store `workout_number`
- Post/card component (wherever the feed card is rendered) — render the `#N` badge or "didn't qualify" icon
- `supabase/migrations/` — new migration for workout_number column

---

## 3. Weekly Tracking & Stats Computation

**Priority**: High (foundation for stats widget and weekly reports)

### Context

The app needs to track per-user, per-group weekly progress: how many qualifying workouts completed, how many remain, and time left in the current week. This data powers both the stats widget and the weekly report. See PRODUCT.md → Weekly Tracking.

### Scope

- Create a `useWeeklyStats(groupId?)` hook that computes:
  - `completedCount`: qualifying workouts posted this week for the user in the given group
  - `remainingCount`: group's required workout count minus completedCount (min 0)
  - `totalRequired`: the group's weekly workout requirement (from `groups.workout_config`)
  - `qualified`: boolean, whether the user has met the threshold
  - `weekEndsAt`: ISO timestamp of when the current week ends (Sunday 11:59 PM in user's timezone)
  - `timeRemaining`: human-readable string (e.g., "2 days, 5 hours")
- If no `groupId` is provided, aggregate across all user's groups (show worst-case / most workouts needed)
- Use `week_key` from `lib/week-key.ts` for consistent week boundaries
- This hook queries `group_workouts` filtered by current `week_key` and user ID

### Files to Create/Modify

- `lib/hooks/use-weekly-stats.ts` — new hook
- `lib/week-key.ts` — verify/update week boundary logic to support end-of-week timestamp calculation

### Key Decisions

- Week boundaries: confirm what day the week starts (Monday vs Sunday) — this should align with `week_key` logic
- Timezone handling: use device timezone for "time remaining" display

---

## 4. Current Week Stats Widget

**Priority**: Medium (depends on #3 Weekly Tracking)

### Context

A persistent widget displayed on the Feed screen and User Profile screen showing the user's current week accountability status. See PRODUCT.md → Current Week Stats Widget.

### Scope

- Create a `WeeklyStatsWidget` component that displays:
  - Circular or linear progress indicator showing workouts completed vs required
  - Workouts completed count / total required
  - Time remaining in the week (countdown style)
  - Visual indicator of qualification status (on track / behind / qualified)
- Add the widget to the Feed screen (`app/(tabs)/index.tsx`) — likely at the top of the feed, above posts
- Add the widget to the Profile screen (`app/(tabs)/profile.tsx`)
- The widget consumes `useWeeklyStats()` from feature #3
- If user belongs to multiple groups, show the primary/worst-case stats or allow group switching

### Files to Create/Modify

- `components/weeklyStatsWidget.tsx` — new component
- `app/(tabs)/index.tsx` — integrate widget above feed
- `app/(tabs)/profile.tsx` — integrate widget on profile

### Design Notes

- Keep it compact — should not dominate the screen
- Consider a card-style container with subtle accent color changes based on status (green = qualified, yellow = on track, red = behind)

---

## 5. Achievements System

**Priority**: Medium (depends on #1 Push Notifications)

### Context

Track cumulative workout milestones and celebrate user progress. Milestones: 10, 25, 50, 100, 250, 500, 1,000. See PRODUCT.md → Achievements.

### Scope

- Create an `achievements` table to record when a user hits a milestone:
  - `id`, `user_id`, `milestone` (integer), `achieved_at` (timestamp)
  - Unique constraint on `(user_id, milestone)` to prevent duplicates
- After each workout is successfully created, check the user's total workout count:
  - Query `count(*)` from `workouts` where `user_id = current_user`
  - If the count matches a milestone threshold and no `achievements` row exists for it → insert the achievement
- On achievement creation:
  - Send a personal push notification to the user (e.g., "You just hit 100 workouts!")
  - Send a group notification to all groups the user belongs to (e.g., "Brent just hit 100 workouts!")
- Create a Supabase database trigger or handle in application code (recommend application code for simplicity)
- Display achievements on the user's profile:
  - Show earned milestones as badges/icons
  - Show next upcoming milestone and progress toward it

### Database Changes

- Create `achievements` table: `id (uuid)`, `user_id (uuid, FK)`, `milestone (integer)`, `achieved_at (timestamptz)`
- Unique constraint on `(user_id, milestone)`
- RLS: users can read their own achievements, all group members can read achievements of fellow members

### Files to Create/Modify

- `supabase/migrations/` — new migration for achievements table
- `lib/hooks/use-achievements.ts` — hook to fetch user achievements and check milestones
- `lib/hooks/use-workouts.ts` — add milestone check after workout creation
- `components/achievementBadges.tsx` — badge display component for profile
- `app/(tabs)/profile.tsx` — integrate achievement display

### Milestone Thresholds

```typescript
const MILESTONES = [10, 25, 50, 100, 250, 500, 1000] as const;
```

---

## 6. Weekly Report (End-of-Week Push Notification)

**Priority**: Medium (depends on #1 Push Notifications, #3 Weekly Tracking)

### Context

Every Monday morning, each group's members receive a push notification summarizing the previous week. See PRODUCT.md → Weekly Tracking → End-of-Week Report.

### Scope

- Create a scheduled job that runs every Monday morning (e.g., 8:00 AM ET):
  - For each group, generate a weekly summary:
    - List each member's qualifying workout count for the previous week
    - Flag who qualified and who didn't (based on group's workout requirement)
    - Include total group workout count
  - Send a push notification to every member of the group with the summary
- Storage: create a `weekly_reports` table to persist report data:
  - `id`, `group_id`, `week_key`, `report_data (jsonb)`, `created_at`
  - `report_data` contains per-member breakdown
- The notification should be tappable → deep link to a report detail view (stretch) or the group detail page

### Implementation Options

- **Supabase Edge Function + pg_cron**: Schedule a Postgres cron job that calls an Edge Function every Monday
- **Supabase Edge Function + external cron**: Use an external cron service (e.g., GitHub Actions scheduled workflow, cron-job.org) to trigger the Edge Function via HTTP
- **EAS Background Task**: Not recommended for scheduled recurring tasks

### Database Changes

- Create `weekly_reports` table: `id (uuid)`, `group_id (uuid, FK)`, `week_key (text)`, `report_data (jsonb)`, `sent_at (timestamptz)`
- Unique constraint on `(group_id, week_key)`

### Files to Create/Modify

- `supabase/functions/weekly-report/` — Supabase Edge Function
- `supabase/migrations/` — new migration for weekly_reports table and pg_cron setup
- `lib/hooks/use-weekly-report.ts` — hook to fetch report data for display (if building a report view)

### Key Decisions

- What timezone to base "Monday morning" on — group creator's timezone? Fixed timezone?
- How detailed should the notification body be — just "3/5 members qualified" or full member breakdown?
- Whether to build an in-app report view or just use the notification + group detail page

---

## 7. Workout Post Notifications

**Priority**: Medium (depends on #1 Push Notifications)

### Context

When a user posts a workout to a group, all other members of that group should receive a push notification. See PRODUCT.md → Push Notifications.

### Scope

- After a workout is posted to a group (inserted into `group_workouts`), send a push notification to all other members of that group
- Notification content: "[Username] posted a workout in [Group Name]"
- Tapping the notification should deep link to the workout detail or the group feed
- Batch notifications if a workout is posted to multiple groups (don't send duplicate notifications to users who share multiple groups with the poster)

### Implementation Options

- **Supabase Database Webhook/Trigger**: Set up a database webhook on `group_workouts` insert that calls an Edge Function to send push notifications
- **Application-side**: After successful workout post, call a push notification Edge Function from the client

### Files to Create/Modify

- `supabase/functions/notify-workout/` — Edge Function to send workout notifications
- `lib/hooks/use-workouts.ts` — trigger notification after successful post (if client-side approach)

---

## 8. Group Chat Notifications

**Priority**: Low (depends on #1 Push Notifications, assumes chat is already built)

### Context

When a user sends a message in a group chat, other group members should receive a push notification. See PRODUCT.md → Push Notifications.

### Scope

- On `group_messages` insert, send push notifications to all other members of the group
- Notification content: "[Username] in [Group Name]: [message preview]"
- Tapping the notification should deep link to the group chat
- Consider notification throttling — if a user sends 5 messages in quick succession, don't send 5 separate notifications (batch into one or debounce)

### Implementation Options

- **Supabase Database Webhook**: Trigger on `group_messages` insert → Edge Function
- Include throttling/debounce logic in the Edge Function (e.g., don't send if last notification to this user for this group was < 30 seconds ago)

### Files to Create/Modify

- `supabase/functions/notify-chat/` — Edge Function for chat notifications
- May need a `notification_log` table or in-memory throttle for debouncing

---

## 9. Public Groups Discovery

**Priority**: Low (not needed for TestFlight beta with friends)

### Context

Public groups should be discoverable on a dedicated screen where users can search, browse, and join. See PRODUCT.md → Public Groups.

### Scope

- Create a public groups browse/search screen
- List groups where `visibility = 'public'`
- Search by group name and description
- Show group avatar, name, subtitle, member count
- "Join" button that adds the user as a member
- Possibly add categories or tags to groups for better discovery (stretch)

### Files to Create/Modify

- `app/group/discover.tsx` — new screen for public group discovery
- `lib/hooks/use-groups.ts` — add queries for public group search/listing
- `app/(tabs)/_layout.tsx` — add navigation entry point (tab or header button)

---

## 10. Feed Enhancements

**Priority**: Low (feed works, these are polish items)

### Context

The feed currently exists but may need refinement per the spec. See PRODUCT.md → Feed.

### Scope

- Add filter controls: by group, by day, by week
- Add group tag/badge on each post showing which group it was posted to
- Add reaction support on posts (emoji reactions)
- Add option to view public group posts (discover content outside user's groups)
- Ensure post card displays: photo, workout details (title, description, duration), user info, timestamp, group tag, reactions

### Files to Create/Modify

- `app/(tabs)/index.tsx` — add filter UI
- Feed card component — add group tag, reaction buttons
- `lib/hooks/use-social.ts` — add/verify reaction mutations
- `lib/hooks/use-workouts.ts` — add filtered feed queries

---

## Implementation Order (Recommended)

```
#1 Push Notifications Infrastructure
 ├── #2 Workout Number Labels (independent, can parallel)
 ├── #3 Weekly Tracking & Stats
 │    └── #4 Current Week Stats Widget
 │    └── #6 Weekly Report
 ├── #5 Achievements
 ├── #7 Workout Post Notifications
 └── #8 Group Chat Notifications

#9  Public Groups Discovery (independent)
#10 Feed Enhancements (independent)
```

Features #2 and #3 can be started in parallel with #1 since they don't depend on push notifications. Feature #2 is purely UI + database, and #3 is data computation.
