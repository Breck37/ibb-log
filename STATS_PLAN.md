# Stats Plan

## Why not AsyncStorage?

AsyncStorage is device-local. It gets wiped on app deletion, doesn't sync across devices, and can't power group stats or EOY recaps that involve aggregating data across users. The workout data already lives in Supabase — stats should be derived from the same source of truth.

## The good news: we're already tracking what matters

The `workouts` and `group_workouts` tables already capture the raw data needed for rich stats:

- **Duration** (`duration_minutes`)
- **Qualification status** (`is_qualified`)
- **Timestamps** (`created_at`)
- **Group association** (`group_workouts.group_id`)
- **User association** (`user_id`)

Every stat — streaks, totals, averages, personal records, group rankings — can be derived from what we're already storing. No schema changes needed to start.

## Current implementation (Layer 1: Query-time)

### `useUserStats()` — `lib/hooks/use-stats.ts`

Fetches all user workouts in a single query and computes stats client-side:

| Stat | How |
|---|---|
| Total workouts | `workouts.length` |
| Total minutes | Sum of `duration_minutes` |
| Avg minutes | `totalMinutes / totalWorkouts` |
| Longest workout | Max `duration_minutes` |
| This week count | Filter by current ISO week key |
| This month count | Filter by current month start |
| Current streak | Walk backwards from current week through qualified week keys |
| Best streak | Max consecutive qualified weeks across all time |
| Day distribution | Count workouts by `getDay()` — ready for a heatmap UI later |

Displayed on the Profile screen as a stat tile grid.

### What's not implemented yet

- `useGroupStats(groupId)` — group-level aggregations (total workouts, compliance rate, most active member)
- Group detail screen stats section
- Day-of-week heatmap visualization

## Layer 2: Materialized stats (when needed)

### When to trigger this migration

- User count exceeds ~200 active users
- `useUserStats()` query takes >500ms (measurable via React Query's `dataUpdatedAt`)
- EOY recap feature is greenlit (querying a full year across all users will be slow)

### Schema

```sql
CREATE TABLE user_stats_cache (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_workouts integer NOT NULL DEFAULT 0,
  total_minutes integer NOT NULL DEFAULT 0,
  avg_minutes integer NOT NULL DEFAULT 0,
  longest_workout integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  -- Stored as JSON array [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  day_distribution jsonb NOT NULL DEFAULT '[0,0,0,0,0,0,0]',
  last_workout_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE group_stats_cache (
  group_id uuid PRIMARY KEY REFERENCES groups(id) ON DELETE CASCADE,
  total_workouts integer NOT NULL DEFAULT 0,
  total_minutes integer NOT NULL DEFAULT 0,
  active_member_count integer NOT NULL DEFAULT 0,
  avg_compliance_rate numeric(5,2) NOT NULL DEFAULT 0,
  group_streak integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Update strategy

**Option A: Postgres trigger (recommended for simplicity)**

```sql
CREATE FUNCTION update_user_stats_on_workout()
RETURNS trigger AS $$
BEGIN
  -- Increment counters on INSERT
  -- Recalculate avg, update longest if beaten
  -- Streak recalc only needed on INSERT (not UPDATE/DELETE of workouts)
  UPDATE user_stats_cache SET
    total_workouts = total_workouts + 1,
    total_minutes = total_minutes + NEW.duration_minutes,
    avg_minutes = (total_minutes + NEW.duration_minutes) / (total_workouts + 1),
    longest_workout = GREATEST(longest_workout, NEW.duration_minutes),
    last_workout_at = NEW.created_at,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_stats
AFTER INSERT ON workouts
FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_workout();
```

Streaks are the exception — they can't be incrementally updated with a simple trigger. Options:
1. Recompute streaks on read (hybrid: cache everything except streaks)
2. A scheduled Supabase Edge Function that runs weekly to update streak values
3. A more complex trigger that walks the week keys (not worth the complexity early on)

**Option B: Supabase Edge Function cron (recommended for streaks + group stats)**

A weekly Edge Function that:
1. Iterates all users, computes current/best streak from `group_workouts.week_key`
2. Computes group-level stats (compliance rate, group streak)
3. Upserts into `user_stats_cache` and `group_stats_cache`

Run on Sunday night after the week closes. Latency doesn't matter for cached stats.

### Migration path

1. Create the cache tables
2. Backfill with a one-time query that computes stats from existing data
3. Add triggers for real-time incremental updates (totals, avg, longest, day distribution)
4. Add weekly cron for streaks and group stats
5. Update `useUserStats()` to read from `user_stats_cache` instead of computing client-side
6. Keep the client-side computation as a fallback / for cache misses

### What stays client-side even after materialization

- "This week" and "this month" counts — these are time-relative and cheap to compute
- Any stat the user can filter by date range (future feature)

## EOY Recap (future)

No new tables needed. The recap is a read-only view over existing data, filtered to a calendar year. The materialized cache speeds it up but isn't required.

**Individual recap query shape:**
```sql
SELECT
  count(*) as total_workouts,
  sum(duration_minutes) as total_minutes,
  max(duration_minutes) as longest_workout,
  extract(dow from created_at) as favorite_day, -- mode
  to_char(created_at, 'YYYY-MM') as most_active_month -- mode
FROM workouts
WHERE user_id = $1
  AND created_at >= '2026-01-01'
  AND created_at < '2027-01-01';
```

Group recap is similar, joined through `group_workouts`.

## Implementation order

1. ~~Create `useUserStats()` hook~~ ✅
2. ~~Add stats section to Profile screen~~ ✅
3. Create `useGroupStats(groupId)` hook
4. Add stats to group detail screen
5. **(When needed)** Create cache tables + triggers
6. **(When needed)** Add weekly Edge Function for streaks
7. **(When needed)** EOY recap screen
