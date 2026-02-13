import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { getWeekKey } from '@/lib/week-key';
import { uploadMultipleImages } from '@/lib/services/image-upload';

import type { ImagePickerAsset } from 'expo-image-picker';

type WorkoutInput = {
  groupIds: string[];
  durationMinutes: number;
  title: string;
  description?: string;
  images: ImagePickerAsset[];
};

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WorkoutInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrls: string[] = [];
      if (input.images.length > 0) {
        imageUrls = await uploadMultipleImages(user.id, input.images);
      }

      // Create the workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          duration_minutes: input.durationMinutes,
          image_urls: imageUrls,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Post to selected groups
      if (input.groupIds.length > 0) {
        // Fetch group configs for qualification check
        const { data: groups, error: groupsError } = await supabase
          .from('groups')
          .select('id, min_workout_minutes_to_qualify')
          .in('id', input.groupIds);

        if (groupsError) throw groupsError;

        const weekKey = getWeekKey();
        const groupWorkoutRows = groups.map((group) => ({
          workout_id: workout.id,
          group_id: group.id,
          week_key: weekKey,
          is_qualified:
            input.durationMinutes >= group.min_workout_minutes_to_qualify,
        }));

        const { error: gwError } = await supabase
          .from('group_workouts')
          .insert(groupWorkoutRows);

        if (gwError) throw gwError;
      }

      return workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['group-workouts'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
  });
}

export function useGroupWorkouts(groupId: string) {
  return useQuery({
    queryKey: ['group-workouts', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_workouts')
        .select('*, workouts(*, profiles(username, display_name, avatar_url))')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}

export type FeedWorkout = {
  id: string;
  duration_minutes: number;
  title: string;
  description: string | null;
  image_urls: string[];
  created_at: string;
  is_qualified: boolean;
  groupName: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function useFeedWorkouts() {
  return useQuery({
    queryKey: ['workouts', 'feed'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch group workouts (visible via RLS to group members)
      const { data: groupData, error: groupError } = await supabase
        .from('group_workouts')
        .select(
          'is_qualified, groups(name), workouts(*, profiles(username, display_name, avatar_url))',
        )
        .order('created_at', { ascending: false });

      if (groupError) throw groupError;

      const groupFeed = (groupData ?? []).map((row) => ({
        id: row.workouts!.id,
        duration_minutes: row.workouts!.duration_minutes,
        title: row.workouts!.title,
        description: row.workouts!.description,
        image_urls: row.workouts!.image_urls ?? [],
        created_at: row.workouts!.created_at,
        is_qualified: row.is_qualified,
        groupName: row.groups?.name ?? '',
        profiles: row.workouts!.profiles,
      }));

      // Fetch user's own workouts that aren't posted to any group
      const groupWorkoutIds = new Set(groupFeed.map((w) => w.id));

      const { data: ownData, error: ownError } = await supabase
        .from('workouts')
        .select('*, profiles(username, display_name, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ownError) throw ownError;

      const ungroupedFeed = (ownData ?? [])
        .filter((w) => !groupWorkoutIds.has(w.id))
        .map((w) => ({
          id: w.id,
          duration_minutes: w.duration_minutes,
          title: w.title,
          description: w.description,
          image_urls: w.image_urls ?? [],
          created_at: w.created_at,
          is_qualified: false,
          groupName: '',
          profiles: w.profiles,
        }));

      return [...groupFeed, ...ungroupedFeed].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ) satisfies FeedWorkout[];
    },
  });
}

export function useMyWorkouts(limit?: number) {
  return useQuery({
    queryKey: ['workouts', 'mine', limit],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('workouts')
        .select('*, group_workouts(is_qualified, groups(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => {
        const firstGw = row.group_workouts?.[0];
        return {
          id: row.id,
          duration_minutes: row.duration_minutes,
          title: row.title,
          description: row.description,
          image_urls: row.image_urls ?? [],
          created_at: row.created_at,
          is_qualified: firstGw?.is_qualified ?? false,
          groupName: firstGw?.groups?.name ?? '',
          profiles: null,
        } satisfies FeedWorkout;
      });
    },
  });
}
