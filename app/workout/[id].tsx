import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { PaperPlaneRight, User } from 'phosphor-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useAddComment,
  useComments,
  useReactions,
  useToggleReaction,
} from '@/lib/hooks/use-social';
import { supabase } from '@/lib/supabase';

const REACTION_EMOJIS = ['💪', '🔥', '👏', '🎯', '⭐'];

export default function WorkoutDetailScreen() {
  const { id: groupWorkoutId } = useLocalSearchParams<{ id: string }>();
  const [commentText, setCommentText] = useState('');

  const { data: groupWorkout, isLoading } = useQuery({
    queryKey: ['group-workout', groupWorkoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_workouts')
        .select(
          '*, workouts(*, profiles(username, display_name, avatar_url)), groups(name)',
        )
        .eq('id', groupWorkoutId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!groupWorkoutId,
  });

  const { data: reactions } = useReactions(groupWorkoutId);
  const toggleReaction = useToggleReaction(groupWorkoutId);
  const { data: comments } = useComments(groupWorkoutId);
  const addComment = useAddComment(groupWorkoutId);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await addComment.mutateAsync({ body: commentText.trim() });
    setCommentText('');
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const workout = groupWorkout?.workouts;

  if (!groupWorkout || !workout) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Workout not found</Text>
      </View>
    );
  }

  const reactionGroups = (reactions ?? []).reduce(
    (acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const displayName =
    workout.profiles?.display_name ?? workout.profiles?.username ?? 'Unknown';

  return (
    <>
      <Stack.Screen options={{ title: `${displayName}'s Workout` }} />
      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10">
        <View className="mb-4 rounded-lg bg-white p-4 dark:bg-gray-800">
          <View className="mb-3 flex-row items-center">
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <User size={20} color="#3b82f6" weight="fill" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold dark:text-white">
                {displayName}
              </Text>
              <Text className="text-sm text-gray-500">
                {new Date(workout.created_at).toLocaleString()}
              </Text>
            </View>
            {groupWorkout.groups?.name && (
              <View className="rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-700">
                <Text className="text-xs text-gray-600 dark:text-gray-300">
                  {groupWorkout.groups.name}
                </Text>
              </View>
            )}
          </View>

          <View className="mb-2 flex-row items-center gap-2">
            <Text className="text-2xl font-bold dark:text-white">
              {workout.duration_minutes} min
            </Text>
            {groupWorkout.is_qualified && (
              <View className="rounded-full bg-green-100 px-2 py-1">
                <Text className="text-xs font-medium text-green-700">
                  Qualified
                </Text>
              </View>
            )}
          </View>

          <Text className="mb-1 text-base font-medium dark:text-white">
            {workout.title}
          </Text>
          {workout.description && (
            <Text className="text-gray-600 dark:text-gray-400">
              {workout.description}
            </Text>
          )}

          {workout.image_urls.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerClassName="gap-2"
            >
              {workout.image_urls.map((url) => (
                <Image
                  key={url}
                  source={{ uri: url }}
                  className="h-60 w-60 rounded-lg"
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Reactions */}
        <View className="mb-4 flex-row flex-wrap gap-2">
          {REACTION_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              className={`flex-row items-center rounded-full px-3 py-1.5 ${
                reactionGroups[emoji]
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
              onPress={() => toggleReaction.mutate(emoji)}
            >
              <Text className="text-base">{emoji}</Text>
              {reactionGroups[emoji] && (
                <Text className="ml-1 text-sm font-medium dark:text-white">
                  {reactionGroups[emoji]}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Comments */}
        <Text className="mb-2 text-lg font-semibold dark:text-white">
          Comments ({comments?.length ?? 0})
        </Text>

        {comments?.map((comment) => (
          <View
            key={comment.id}
            className={`mb-2 rounded-lg bg-white p-3 dark:bg-gray-800 ${
              comment.parent_id ? 'ml-8' : ''
            }`}
          >
            <Text className="text-xs font-medium text-blue-600">
              {comment.profiles?.display_name ?? comment.profiles?.username}
            </Text>
            <Text className="mt-1 dark:text-white">{comment.body}</Text>
            <Text className="mt-1 text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleString()}
            </Text>
          </View>
        ))}

        {/* Add comment */}
        <View className="mt-2 flex-row gap-2">
          <TextInput
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:text-white"
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <Pressable
            className="items-center justify-center rounded-lg bg-blue-600 px-4 active:bg-blue-700"
            onPress={handleComment}
            disabled={addComment.isPending || !commentText.trim()}
          >
            <PaperPlaneRight size={16} color="white" weight="fill" />
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
