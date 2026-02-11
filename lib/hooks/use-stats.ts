import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { getWeekKey } from "@/lib/week-key";

export type UserStats = {
  totalWorkouts: number;
  totalMinutes: number;
  avgMinutes: number;
  longestWorkout: number;
  thisWeekCount: number;
  thisMonthCount: number;
  currentStreak: number;
  bestStreak: number;
  dayDistribution: number[]; // index 0 = Sunday, 6 = Saturday
};

/**
 * Computes user stats client-side from the workouts table.
 * When this gets slow, move streak/distribution to Postgres functions.
 */
export function useUserStats() {
  return useQuery({
    queryKey: ["workouts", "stats"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("workouts")
        .select("duration_minutes, created_at, group_workouts(week_key, is_qualified)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const workouts = data ?? [];
      if (workouts.length === 0) return emptyStats();

      const now = new Date();
      const currentWeekKey = getWeekKey(now);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let totalMinutes = 0;
      let longestWorkout = 0;
      let thisWeekCount = 0;
      let thisMonthCount = 0;
      const dayDistribution = [0, 0, 0, 0, 0, 0, 0];
      const qualifiedWeekKeys = new Set<string>();

      for (const w of workouts) {
        totalMinutes += w.duration_minutes;
        if (w.duration_minutes > longestWorkout) {
          longestWorkout = w.duration_minutes;
        }

        const createdAt = new Date(w.created_at);
        dayDistribution[createdAt.getDay()]++;

        if (createdAt >= monthStart) thisMonthCount++;

        // Check if this workout falls in the current week
        const workoutWeekKey = getWeekKey(createdAt);
        if (workoutWeekKey === currentWeekKey) thisWeekCount++;

        // Collect week keys where user had a qualifying workout
        const gwList = w.group_workouts ?? [];
        for (const gw of gwList) {
          if (gw.is_qualified) {
            qualifiedWeekKeys.add(gw.week_key);
          }
        }
      }

      const { currentStreak, bestStreak } = computeStreaks(
        qualifiedWeekKeys,
        currentWeekKey,
      );

      return {
        totalWorkouts: workouts.length,
        totalMinutes,
        avgMinutes: Math.round(totalMinutes / workouts.length),
        longestWorkout,
        thisWeekCount,
        thisMonthCount,
        currentStreak,
        bestStreak,
        dayDistribution,
      } satisfies UserStats;
    },
  });
}

function emptyStats(): UserStats {
  return {
    totalWorkouts: 0,
    totalMinutes: 0,
    avgMinutes: 0,
    longestWorkout: 0,
    thisWeekCount: 0,
    thisMonthCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    dayDistribution: [0, 0, 0, 0, 0, 0, 0],
  };
}

/**
 * Walks backwards from the current week to compute current and best streaks.
 * A "streak" is consecutive ISO weeks with at least one qualifying workout.
 */
function computeStreaks(
  qualifiedWeekKeys: Set<string>,
  currentWeekKey: string,
): { currentStreak: number; bestStreak: number } {
  if (qualifiedWeekKeys.size === 0) return { currentStreak: 0, bestStreak: 0 };

  // Sort week keys to walk them in order
  const sorted = [...qualifiedWeekKeys].sort();
  const allWeeks = generateWeekRange(sorted[0], currentWeekKey);

  let currentStreak = 0;
  let bestStreak = 0;
  let streak = 0;

  for (const week of allWeeks) {
    if (qualifiedWeekKeys.has(week)) {
      streak++;
      if (streak > bestStreak) bestStreak = streak;
    } else {
      streak = 0;
    }
  }

  // Current streak: only counts if the latest week in the streak
  // includes the current week or the immediately preceding week
  currentStreak = streak;
  const lastWeek = allWeeks[allWeeks.length - 1];
  if (lastWeek === currentWeekKey && !qualifiedWeekKeys.has(currentWeekKey)) {
    currentStreak = 0;
  }

  return { currentStreak, bestStreak };
}

/** Generates all ISO week keys between start and end inclusive. */
function generateWeekRange(start: string, end: string): string[] {
  const weeks: string[] = [];
  let [year, weekNum] = parseWeekKey(start);
  const [endYear, endWeekNum] = parseWeekKey(end);

  while (year < endYear || (year === endYear && weekNum <= endWeekNum)) {
    weeks.push(`${year}-W${String(weekNum).padStart(2, "0")}`);
    weekNum++;
    const maxWeeks = getISOWeeksInYear(year);
    if (weekNum > maxWeeks) {
      weekNum = 1;
      year++;
    }
  }

  return weeks;
}

function parseWeekKey(key: string): [number, number] {
  const [yearStr, weekStr] = key.split("-W");
  return [parseInt(yearStr, 10), parseInt(weekStr, 10)];
}

function getISOWeeksInYear(year: number): number {
  // A year has 53 ISO weeks if Jan 1 is Thursday, or Dec 31 is Thursday
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  return jan1.getDay() === 4 || dec31.getDay() === 4 ? 53 : 52;
}
