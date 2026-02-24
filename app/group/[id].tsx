import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQuery } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { useGroupMembers } from '@/lib/hooks/use-groups';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: members } = useGroupMembers(id);

  const handleShareInvite = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my group "${group.name}" on IBB Log!\nUse invite code: ${group.invite_code}`,
      });
    } catch (error) {
      if (error instanceof Error && error.message !== 'The user did not share') {
        Alert.alert('Error', 'Could not open share sheet.');
      }
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Group not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () => (
            <Link href="/group/settings" asChild>
              <Pressable className="p-2">
                <FontAwesome name="gear" size={20} color="#666" />
              </Pressable>
            </Link>
          ),
        }}
      />
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        <View className="mb-4 rounded-lg bg-white p-4 dark:bg-gray-800">
          <Text className="text-lg font-bold dark:text-white">
            {group.name}
          </Text>
          <Pressable
            onPress={handleShareInvite}
            className="mt-2 flex-row items-center gap-2 self-start"
          >
            <Text className="text-sm text-gray-500">
              Invite code:{' '}
              <Text className="font-semibold text-gray-700 dark:text-gray-300">
                {group.invite_code}
              </Text>
            </Text>
            <FontAwesome name="share" size={13} color="#9ca3af" />
          </Pressable>
          <Text className="mt-1 text-sm text-gray-500">
            {group.min_workouts_per_week} workouts/week &middot;{' '}
            {group.min_workout_minutes_to_qualify}min minimum
          </Text>
        </View>

        <Text className="mb-2 text-lg font-semibold dark:text-white">
          Members ({members?.length ?? 0})
        </Text>
        {members?.map((member) => (
          <View
            key={member.id}
            className="mb-2 flex-row items-center rounded-lg bg-white p-3 dark:bg-gray-800"
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <FontAwesome name="user" size={16} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="font-medium dark:text-white">
                {member.profiles?.display_name ?? member.profiles?.username}
              </Text>
              <Text className="text-xs text-gray-500">{member.role}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}
