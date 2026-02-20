import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image, ScrollView, Text, View } from 'react-native';

import { Forge } from '@/constants/Colors';
import type { FeedWorkout } from '@/lib/hooks/use-workouts';

type WorkoutCardProps = {
  workout: FeedWorkout;
};

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const displayName =
    workout.profiles?.display_name ?? workout.profiles?.username ?? 'You';
  const timeAgo = getTimeAgo(workout.created_at);

  return (
    <View className="mb-3 rounded-lg border border-forge-border bg-forge-surface p-4">
      {/* Header row */}
      <View className="mb-3 flex-row items-center">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-forge-elevated">
          <FontAwesome name="user" size={16} color={Forge.primary} />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-white">{displayName}</Text>
          <Text className="text-xs text-forge-muted">{timeAgo}</Text>
        </View>
        {workout.groupName ? (
          <View className="mr-2 rounded border border-forge-secondary/40 bg-forge-secondary/10 px-2.5 py-1">
            <Text className="text-xs font-medium text-forge-secondary-text">
              {workout.groupName}
            </Text>
          </View>
        ) : null}
        {workout.is_qualified && (
          <View className="rounded border border-primary/40 bg-primary/10 px-2 py-1">
            <Text className="text-xs font-medium text-primary">
              Qualified
            </Text>
          </View>
        )}
      </View>

      {/* Workout info */}
      <Text className="mb-1 font-medium text-white">
        {workout.duration_minutes} min &middot; {workout.title}
      </Text>

      {workout.description && (
        <Text className="mb-2 text-sm text-forge-muted">
          {workout.description}
        </Text>
      )}

      {workout.image_urls.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2"
          contentContainerClassName="gap-2"
        >
          {workout.image_urls.map((url) => (
            <Image
              key={url}
              source={{ uri: url }}
              className="h-40 w-40 rounded-lg"
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function getTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateString).toLocaleDateString();
}
