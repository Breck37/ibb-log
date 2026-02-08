import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { getWeekKey } from "@/lib/week-key";
import { uploadMultipleImages } from "@/lib/services/image-upload";

import type { ImagePickerAsset } from "expo-image-picker";

type WorkoutInput = {
  groupId: string;
  durationMinutes: number;
  routine: string;
  notes?: string;
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

      // Fetch group to check qualification
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("min_workout_minutes_to_qualify")
        .eq("id", input.groupId)
        .single();

      if (groupError) throw groupError;

      const isQualified =
        input.durationMinutes >= group.min_workout_minutes_to_qualify;

      let imageUrls: string[] = [];
      if (input.images.length > 0) {
        imageUrls = await uploadMultipleImages(user.id, input.images);
      }

      const { data, error } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          group_id: input.groupId,
          duration_minutes: input.durationMinutes,
          routine: input.routine,
          notes: input.notes || null,
          image_urls: imageUrls,
          week_key: getWeekKey(),
          is_qualified: isQualified,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["workouts", variables.groupId],
      });
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
    },
  });
}

export function useGroupWorkouts(groupId: string) {
  return useQuery({
    queryKey: ["workouts", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}
