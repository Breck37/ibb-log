import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export function useReactions(workoutId: string) {
  return useQuery({
    queryKey: ["reactions", workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reactions")
        .select("*, profiles(username)")
        .eq("workout_id", workoutId);

      if (error) throw error;
      return data;
    },
    enabled: !!workoutId,
  });
}

export function useToggleReaction(workoutId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emoji: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if reaction exists
      const { data: existing } = await supabase
        .from("reactions")
        .select("id")
        .eq("workout_id", workoutId)
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
        const { error } = await supabase
          .from("reactions")
          .insert({ workout_id: workoutId, user_id: user.id, emoji });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reactions", workoutId] });
    },
  });
}

export function useComments(workoutId: string) {
  return useQuery({
    queryKey: ["comments", workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("workout_id", workoutId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!workoutId,
  });
}

export function useAddComment(workoutId: string) {
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
          workout_id: workoutId,
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
      queryClient.invalidateQueries({ queryKey: ["comments", workoutId] });
    },
  });
}
