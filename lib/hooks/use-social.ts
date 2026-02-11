import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export function useReactions(groupWorkoutId: string) {
  return useQuery({
    queryKey: ["reactions", groupWorkoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reactions")
        .select("*, profiles(username)")
        .eq("group_workout_id", groupWorkoutId);

      if (error) throw error;
      return data;
    },
    enabled: !!groupWorkoutId,
  });
}

export function useToggleReaction(groupWorkoutId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emoji: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("reactions")
        .select("id")
        .eq("group_workout_id", groupWorkoutId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reactions").insert({
          group_workout_id: groupWorkoutId,
          user_id: user.id,
          emoji,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", groupWorkoutId],
      });
    },
  });
}

export function useComments(groupWorkoutId: string) {
  return useQuery({
    queryKey: ["comments", groupWorkoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("group_workout_id", groupWorkoutId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!groupWorkoutId,
  });
}

export function useAddComment(groupWorkoutId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      body,
      parentId,
    }: {
      body: string;
      parentId?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          group_workout_id: groupWorkoutId,
          user_id: user.id,
          body,
          parent_id: parentId ?? null,
        })
        .select("*, profiles(username, display_name)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", groupWorkoutId],
      });
    },
  });
}
