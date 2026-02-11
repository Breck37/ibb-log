import { GearSix, Plus, UsersThree } from "phosphor-react-native";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

import { useMyGroups } from "@/lib/hooks/use-groups";

export default function GroupsScreen() {
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
            <UsersThree size={48} color="#9ca3af" weight="light" />
            <Text className="mb-2 mt-4 text-lg font-semibold text-gray-600 dark:text-gray-300">
              No groups yet
            </Text>
            <Text className="mb-6 text-center text-gray-400">
              Create or join a group to start tracking workouts together
            </Text>
            <View className="w-full flex-row gap-3">
              <Link href="/group/create" asChild>
                <Pressable className="flex-1 rounded-lg bg-blue-600 py-3 active:bg-blue-700">
                  <Text className="text-center font-semibold text-white">
                    Create Group
                  </Text>
                </Pressable>
              </Link>
              <Link href="/group/join" asChild>
                <Pressable className="flex-1 rounded-lg border border-blue-600 py-3 active:bg-blue-50">
                  <Text className="text-center font-semibold text-blue-600">
                    Join Group
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        }
        ListHeaderComponent={
          groups && groups.length > 0 ? (
            <View className="mb-4 flex-row gap-3">
              <Link href="/group/create" asChild>
                <Pressable className="flex-1 rounded-lg bg-blue-600 py-3 active:bg-blue-700">
                  <Text className="text-center font-semibold text-white">
                    Create Group
                  </Text>
                </Pressable>
              </Link>
              <Link href="/group/join" asChild>
                <Pressable className="flex-1 rounded-lg border border-blue-600 py-3 active:bg-blue-50">
                  <Text className="text-center font-semibold text-blue-600">
                    Join Group
                  </Text>
                </Pressable>
              </Link>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Link href={`/group/${item.id}`} asChild>
            <Pressable className="mb-3 rounded-xl bg-white p-4 shadow-sm active:bg-gray-50 dark:bg-gray-800">
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <UsersThree size={20} color="#3b82f6" weight="fill" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold dark:text-white">
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {item.min_workouts_per_week}x/week
                    {item.min_workout_minutes_to_qualify
                      ? ` · ${item.min_workout_minutes_to_qualify} min minimum`
                      : ""}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
