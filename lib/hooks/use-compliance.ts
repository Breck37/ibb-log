import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { getWeekKey } from '@/lib/week-key';

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
    queryKey: ['compliance', groupId, currentWeek],
    queryFn: async () => {
      const [groupResult, membersResult, gwResult] = await Promise.all([
        supabase
          .from('groups')
          .select('min_workouts_per_week')
          .eq('id', groupId)
          .single(),
        supabase
          .from('group_members')
          .select('user_id, profiles(username, display_name)')
          .eq('group_id', groupId),
        supabase
          .from('group_workouts')
          .select('workouts(user_id)')
          .eq('group_id', groupId)
          .eq('week_key', currentWeek)
          .eq('is_qualified', true),
      ]);

      if (groupResult.error) throw groupResult.error;
      if (membersResult.error) throw membersResult.error;
      if (gwResult.error) throw gwResult.error;

      const required = groupResult.data.min_workouts_per_week;

      const qualifiedCounts: Record<string, number> = {};
      for (const gw of gwResult.data) {
        const userId = gw.workouts?.user_id;
        if (userId) {
          qualifiedCounts[userId] = (qualifiedCounts[userId] || 0) + 1;
        }
      }

      const compliance: MemberCompliance[] = membersResult.data.map(
        (member) => {
          const qualifiedCount = qualifiedCounts[member.user_id] || 0;
          return {
            userId: member.user_id,
            username: member.profiles?.username ?? 'Unknown',
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

type LeaderboardPeriod = 'weekly' | 'monthly' | 'yearly' | 'all-time';

export function useLeaderboard(groupId: string, period: LeaderboardPeriod) {
  return useQuery({
    queryKey: ['leaderboard', groupId, period],
    queryFn: async () => {
      let query = supabase
        .from('group_workouts')
        .select(
          'is_qualified, week_key, created_at, workouts(user_id, duration_minutes)',
        )
        .eq('group_id', groupId);

      const now = new Date();
      if (period === 'weekly') {
        query = query.eq('week_key', getWeekKey(now));
      } else if (period === 'monthly') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte('created_at', monthStart.toISOString());
      } else if (period === 'yearly') {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        query = query.gte('created_at', yearStart.toISOString());
      }

      const { data: groupWorkouts, error: gwError } = await query;
      if (gwError) throw gwError;

      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id, profiles(username, display_name)')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      const profileMap: Record<
        string,
        { username: string; displayName: string | null }
      > = {};
      for (const m of members) {
        profileMap[m.user_id] = {
          username: m.profiles?.username ?? 'Unknown',
          displayName: m.profiles?.display_name ?? null,
        };
      }

      const stats: Record<
        string,
        { qualified: number; totalMins: number; count: number }
      > = {};

      for (const gw of groupWorkouts) {
        const userId = gw.workouts?.user_id;
        const duration = gw.workouts?.duration_minutes ?? 0;
        if (!userId) continue;

        if (!stats[userId]) {
          stats[userId] = { qualified: 0, totalMins: 0, count: 0 };
        }
        stats[userId].totalMins += duration;
        stats[userId].count += 1;
        if (gw.is_qualified) stats[userId].qualified += 1;
      }

      const leaderboard: LeaderboardEntry[] = Object.entries(stats)
        .map(([userId, s]) => ({
          userId,
          username: profileMap[userId]?.username ?? 'Unknown',
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
