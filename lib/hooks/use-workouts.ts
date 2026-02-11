import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { getWeekKey } from "@/lib/week-key";
import { uploadMultipleImages } from "@/lib/services/image-upload";

import type { ImagePickerAsset } from "expo-image-picker";

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
      if (!user) throw new Error("Not authenticated");

      let imageUrls: string[] = [];
      if (input.images.length > 0) {
        imageUrls = await uploadMultipleImages(user.id, input.images);
      }

      // Create the workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
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
          .from("groups")
          .select("id, min_workout_minutes_to_qualify")
          .in("id", input.groupIds);

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
          .from("group_workouts")
          .insert(groupWorkoutRows);

        if (gwError) throw gwError;
      }

      return workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["group-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
    },
  });
}

export function useGroupWorkouts(groupId: string) {
  return useQuery({
    queryKey: ["group-workouts", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_workouts")
        .select(
          "*, workouts(*, profiles(username, display_name, avatar_url))",
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}
