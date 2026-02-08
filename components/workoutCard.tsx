import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

type WorkoutCardProps = {
  workout: {
    id: string;
    duration_minutes: number;
    routine: string;
    notes: string | null;
    image_urls: string[];
    is_qualified: boolean;
    created_at: string;
    profiles: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
};

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const displayName =
    workout.profiles?.display_name ?? workout.profiles?.username ?? "Unknown";
  const timeAgo = getTimeAgo(workout.created_at);

  return (
    <Link href={`/workout/${workout.id}`} asChild>
      <Pressable className="mb-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <View className="mb-2 flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <FontAwesome name="user" size={16} color="#3b82f6" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold dark:text-white">{displayName}</Text>
            <Text className="text-xs text-gray-500">{timeAgo}</Text>
          </View>
          {workout.is_qualified && (
            <View className="rounded-full bg-green-100 px-2 py-1">
              <Text className="text-xs font-medium text-green-700">
                Qualified
              </Text>
            </View>
          )}
        </View>

        <Text className="mb-1 font-medium dark:text-white">
          {workout.duration_minutes} min &middot; {workout.routine}
        </Text>

        {workout.notes && (
          <Text className="mb-2 text-sm text-gray-600 dark:text-gray-400">
            {workout.notes}
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
      </Pressable>
    </Link>
  );
}

function getTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateString).toLocaleDateString();
}
