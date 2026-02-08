import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { getWeekKey } from "@/lib/week-key";

export type MemberCompliance = {
  userId: string;
  username: string;
  displayName: string | null;
  qualifiedCount: number;
  required: number;
  isCompliant: boolean;
};

export function useWeeklyCompliance(groupId: string, weekKey?: string) {
  const currentWeek = weekKey ?? getWeekKey();

  return useQuery({
    queryKey: ["compliance", groupId, currentWeek],
    queryFn: async () => {
      // Get group requirements + members
      const [groupResult, membersResult, workoutsResult] = await Promise.all([
        supabase
          .from("groups")
          .select("min_workouts_per_week")
          .eq("id", groupId)
          .single(),
        supabase
          .from("group_members")
          .select("user_id, profiles(username, display_name)")
          .eq("group_id", groupId),
        supabase
          .from("workouts")
          .select("user_id, is_qualified")
          .eq("group_id", groupId)
          .eq("week_key", currentWeek)
          .eq("is_qualified", true),
      ]);

      if (groupResult.error) throw groupResult.error;
      if (membersResult.error) throw membersResult.error;
      if (workoutsResult.error) throw workoutsResult.error;

      const required = groupResult.data.min_workouts_per_week;

      // Count qualified workouts per user
      const qualifiedCounts: Record<string, number> = {};
      for (const w of workoutsResult.data) {
        qualifiedCounts[w.user_id] = (qualifiedCounts[w.user_id] || 0) + 1;
      }

      const compliance: MemberCompliance[] = membersResult.data.map(
        (member) => {
          const qualifiedCount = qualifiedCounts[member.user_id] || 0;
          return {
            userId: member.user_id,
            username: member.profiles?.username ?? "Unknown",
            displayName: member.profiles?.display_name ?? null,
            qualifiedCount,
            required,
            isCompliant: qualifiedCount >= required,
          };
        },
      );

      return compliance;
    },
    enabled: !!groupId,
  });
}

export type LeaderboardEntry = {
  userId: string;
  username: string;
  displayName: string | null;
  totalQualifiedWorkouts: number;
  totalMinutes: number;
  avgMinutes: number;
};

type LeaderboardPeriod = "weekly" | "monthly" | "yearly" | "all-time";

export function useLeaderboard(groupId: string, period: LeaderboardPeriod) {
  return useQuery({
    queryKey: ["leaderboard", groupId, period],
    queryFn: async () => {
      let query = supabase
        .from("workouts")
        .select("user_id, duration_minutes, is_qualified, week_key, created_at")
        .eq("group_id", groupId);

      // Apply time filter
      const now = new Date();
      if (period === "weekly") {
        const weekKey = getWeekKey(now);
        query = query.eq("week_key", weekKey);
      } else if (period === "monthly") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte("created_at", monthStart.toISOString());
      } else if (period === "yearly") {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        query = query.gte("created_at", yearStart.toISOString());
      }

      const { data: workouts, error: workoutsError } = await query;
      if (workoutsError) throw workoutsError;

      // Get member profiles
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, profiles(username, display_name)")
        .eq("group_id", groupId);

      if (membersError) throw membersError;

      const profileMap: Record<
        string,
        { username: string; displayName: string | null }
      > = {};
      for (const m of members) {
        profileMap[m.user_id] = {
          username: m.profiles?.username ?? "Unknown",
          displayName: m.profiles?.display_name ?? null,
        };
      }

      // Aggregate stats per user
      const stats: Record<
        string,
        { qualified: number; totalMins: number; count: number }
      > = {};

      for (const w of workouts) {
        if (!stats[w.user_id]) {
          stats[w.user_id] = { qualified: 0, totalMins: 0, count: 0 };
        }
        stats[w.user_id].totalMins += w.duration_minutes;
        stats[w.user_id].count += 1;
        if (w.is_qualified) stats[w.user_id].qualified += 1;
      }

      const leaderboard: LeaderboardEntry[] = Object.entries(stats)
        .map(([userId, s]) => ({
          userId,
          username: profileMap[userId]?.username ?? "Unknown",
          displayName: profileMap[userId]?.displayName ?? null,
          totalQualifiedWorkouts: s.qualified,
          totalMinutes: s.totalMins,
          avgMinutes: s.count > 0 ? Math.round(s.totalMins / s.count) : 0,
        }))
        .sort((a, b) => b.totalQualifiedWorkouts - a.totalQualifiedWorkouts);

      return leaderboard;
    },
    enabled: !!groupId,
  });
}
