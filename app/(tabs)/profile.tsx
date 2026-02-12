import { Button, Input } from '@/components/ui/';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Camera, User } from 'phosphor-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';

import { WorkoutCard } from '@/components/workoutCard';
import { useMyGroups } from '@/lib/hooks/use-groups';
import { useUserStats } from '@/lib/hooks/use-stats';
import { useMyWorkouts } from '@/lib/hooks/use-workouts';
import { pickSingleImage, uploadAvatar } from '@/lib/services/image-upload';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: groups } = useMyGroups();
  const { data: workouts } = useMyWorkouts();
  const { data: stats } = useUserStats();

  const handleStartEditing = () => {
    setDisplayName(profile?.display_name ?? '');
    setUsername(profile?.username ?? '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updates: { display_name?: string | null; username?: string } = {
        display_name: displayName.trim() || null,
      };
      if (username.trim()) {
        updates.username = username.trim();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save profile',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarPress = async () => {
    if (!user) return;
    try {
      const asset = await pickSingleImage();
      if (!asset) return;

      setIsUploadingAvatar(true);
      const publicUrl = await uploadAvatar(user.id, asset.uri);

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to upload avatar',
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  const profileHeader = (
    <>
      <View className="mb-6 items-center">
        <Pressable onPress={handleAvatarPress} className="mb-3">
          {isUploadingAvatar ? (
            <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-100">
              <ActivityIndicator />
            </View>
          ) : profile?.avatar_url ? (
            <View>
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
              <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-blue-600">
                <Camera size={12} color="#fff" weight="fill" />
              </View>
            </View>
          ) : (
            <View>
              <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-100">
                <User size={36} color="#3b82f6" weight="fill" />
              </View>
              <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-blue-600">
                <Camera size={12} color="#fff" weight="fill" />
              </View>
            </View>
          )}
        </Pressable>

        {isEditing ? (
          <View className="w-full gap-3 px-4">
            <View>
              <Text className="mb-1 text-xs font-medium text-gray-500">
                Display Name
              </Text>
              <Input
                size="sm"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display name"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View>
              <Text className="mb-1 text-xs font-medium text-gray-500">
                Username
              </Text>
              <Input
                size="sm"
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
            </View>
            <View className="flex-row gap-3">
              <Button
                className="flex-1"
                variant="outline"
                title="Cancel"
                onPress={() => setIsEditing(false)}
              />
              <Button
                className="flex-1"
                title="Save"
                onPress={handleSave}
                loading={isSaving}
              />
            </View>
          </View>
        ) : (
          <>
            <Text className="text-xl font-bold dark:text-white">
              {profile?.display_name ?? profile?.username ?? 'Loading...'}
            </Text>
            <Text className="text-sm text-gray-500">
              @{profile?.username ?? '...'}
            </Text>
            <Text className="mt-1 text-xs text-gray-400">{user?.email}</Text>
            {memberSince && (
              <Text className="mt-1 text-xs text-gray-400">
                Member since {memberSince}
              </Text>
            )}
            <Button
              className="mt-3"
              variant="outline"
              size="sm"
              title="Edit Profile"
              onPress={handleStartEditing}
            />
          </>
        )}
      </View>

      {stats && stats.totalWorkouts > 0 && (
        <View className="mb-6">
          <Text className="mb-2 text-sm font-semibold text-gray-500">
            Stats
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <StatTile label="Workouts" value={stats.totalWorkouts} />
            <StatTile
              label="Total hrs"
              value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`}
            />
            <StatTile label="Avg min" value={stats.avgMinutes} />
            <StatTile label="Longest" value={`${stats.longestWorkout}m`} />
            <StatTile label="This week" value={stats.thisWeekCount} />
            <StatTile label="This month" value={stats.thisMonthCount} />
            <StatTile label="Streak" value={`${stats.currentStreak}w`} />
            <StatTile label="Best streak" value={`${stats.bestStreak}w`} />
          </View>
        </View>
      )}

      {groups && groups.length > 0 && (
        <View className="mb-6">
          <Text className="mb-2 text-sm font-semibold text-gray-500">
            Groups
          </Text>
          {groups.map((group) => (
            <Link key={group.id} href={`/group/${group.id}`} asChild>
              <Pressable className="mb-2 rounded-lg bg-white p-3 shadow-sm active:bg-gray-50 dark:bg-gray-800">
                <Text className="font-medium dark:text-white">
                  {group.name}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      {workouts && workouts.length > 0 && (
        <Text className="mb-2 text-sm font-semibold text-gray-500">
          Your Workouts
        </Text>
      )}
    </>
  );

  return (
    <FlatList
      className="flex-1"
      contentContainerClassName="p-4"
      data={workouts ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={profileHeader}
      ListEmptyComponent={
        <View className="items-center py-8">
          <Text className="text-gray-400">No workouts yet</Text>
        </View>
      }
      renderItem={({ item }) => <WorkoutCard workout={item} />}
    />
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="min-w-[22%] flex-1 items-center rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
      <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">
        {value}
      </Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}
