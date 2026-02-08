import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/lib/supabase";

/**
 * Subscribes to Supabase realtime changes for a group's workouts
 * and invalidates TanStack Query cache on changes.
 */
export function useRealtimeFeed(groupId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`feed:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workouts",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["workouts", groupId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reactions",
        },
        (payload) => {
          const workoutId =
            (payload.new as Record<string, unknown>)?.workout_id ??
            (payload.old as Record<string, unknown>)?.workout_id;
          if (workoutId) {
            queryClient.invalidateQueries({
              queryKey: ["reactions", workoutId],
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
        },
        (payload) => {
          const workoutId =
            (payload.new as Record<string, unknown>)?.workout_id ??
            (payload.old as Record<string, unknown>)?.workout_id;
          if (workoutId) {
            queryClient.invalidateQueries({
              queryKey: ["comments", workoutId],
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
}
