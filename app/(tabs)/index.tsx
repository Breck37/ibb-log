import { Link } from 'expo-router';
import { GearSix, Plus, SignOut, User } from 'phosphor-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { WorkoutCard } from '@/components/workoutCard';
import { useFeedWorkouts } from '@/lib/hooks/use-workouts';
import { useAuth } from '@/providers/auth-provider';

export default function FeedScreen() {
  const { data: workouts, isLoading, error } = useFeedWorkouts();
  const { signOut } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';

  const handleSignOut = async () => {
    setMenuVisible(false);
    try {
      await signOut();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to sign out',
      );
    }
  };

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
      {/* Settings menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable className="flex-1" onPress={() => setMenuVisible(false)}>
          <View className="absolute left-4 top-24 rounded-xl bg-white shadow-lg dark:bg-gray-800">
            <Link href="/(tabs)/profile" asChild>
              <Pressable
                className="flex-row items-center gap-3 px-4 py-3"
                onPress={() => setMenuVisible(false)}
              >
                <User size={20} color="#6b7280" weight="regular" />
                <Text className="text-base dark:text-white">Profile</Text>
              </Pressable>
            </Link>
            <View className="mx-4 h-px bg-gray-200 dark:bg-gray-700" />
            <Pressable
              className="flex-row items-center gap-3 px-4 py-3"
              onPress={handleSignOut}
            >
              <SignOut size={20} color="#ef4444" weight="regular" />
              <Text className="text-base text-red-500">Sign Out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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
          <View className="mb-4">
            {/* Header row: settings gear (left), title (center), + (right) */}
            <View className="mb-2 flex-row items-center justify-between">
              <Pressable
                onPress={() => setMenuVisible(true)}
                className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800"
              >
                <GearSix size={24} color={iconColor} weight="regular" />
              </Pressable>

              <View className="items-center">
                <Text className="text-2xl font-bold dark:text-white">
                  IBB Log
                </Text>
                <Text className="text-sm text-gray-500">
                  Track workouts. Stay accountable.
                </Text>
              </View>

              <Link href="/(tabs)/log" asChild>
                <Pressable className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800">
                  <Plus size={24} color={iconColor} weight="bold" />
                </Pressable>
              </Link>
            </View>
          </View>
        }
        renderItem={({ item }) => <WorkoutCard workout={item} />}
      />
    </View>
  );
}
