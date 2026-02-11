import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { WorkoutCard } from '@/components/workoutCard';
import { useFeedWorkouts } from '@/lib/hooks/use-workouts';

export default function FeedScreen() {
  const { data: workouts, isLoading, error } = useFeedWorkouts();

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
          Failed to load feed: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={workouts}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerClassName="p-4"
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="mb-2 text-lg font-semibold text-gray-600 dark:text-gray-300">
              No workouts yet
            </Text>
            <Text className="text-gray-400">Log one to get started</Text>
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
                <Button
                  className="flex-1"
                  variant="outline"
                  title="Join Group"
                />
              </Link>
            </View>
          </View>
        }
        renderItem={({ item }) => <WorkoutCard workout={item} />}
      />
    </View>
  );
}
