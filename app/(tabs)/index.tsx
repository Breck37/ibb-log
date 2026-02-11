import { Link } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { useMyGroups } from "@/lib/hooks/use-groups";

export default function FeedScreen() {
  const { data: groups, isLoading, error } = useMyGroups();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-red-500">
          Failed to load groups: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="mb-2 text-lg font-semibold text-gray-600 dark:text-gray-300">
              No groups yet
            </Text>
            <Text className="text-gray-400">
              Create or join a group to get started
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View className="mb-4 gap-4">
            <View className="items-center">
              <Text className="text-2xl font-bold dark:text-white">
                IBB Log
              </Text>
              <Text className="text-sm text-gray-500">
                Track workouts. Stay accountable.
              </Text>
            </View>
            <View className="flex-row gap-3">
            <Link href="/group/create" asChild>
              <Button className="flex-1" title="Create Group" />
            </Link>
            <Link href="/group/join" asChild>
              <Button className="flex-1" variant="outline" title="Join Group" />
            </Link>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/group/${item.id}`} asChild>
            <Pressable className="mb-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
              <Text className="text-lg font-semibold dark:text-white">
                {item.name}
              </Text>
              <Text className="mt-1 text-sm text-gray-500">
                {item.min_workouts_per_week}x/week &middot;{" "}
                {item.min_workout_minutes_to_qualify}min minimum
              </Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
