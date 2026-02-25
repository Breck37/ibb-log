import { Button, Input } from '@/components/ui/';
import { Camera, User } from 'phosphor-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useState } from 'react';

import { EditWorkoutModal, type EditableWorkout } from '@/components/EditWorkoutModal';
import type { FeedWorkout } from '@/lib/hooks/use-workouts';
import {
  useSettingsStore,
  type FloatingActionPosition,
} from '@/lib/stores/settings-store';
import { useBiometric } from '@/providers/biometric-provider';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WorkoutCard } from '@/components/WorkoutCard';
import { useMyGroups } from '@/lib/hooks/use-groups';
import { useUserStats } from '@/lib/hooks/use-stats';
import { useMyWorkouts } from '@/lib/hooks/use-workouts';
import { pickSingleImage, uploadAvatar } from '@/lib/services/image-upload';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { Forge } from '@/constants/Colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const floatingActionPosition = useSettingsStore(
    (s) => s.floatingActionPosition,
  );
  const setFloatingActionPosition = useSettingsStore(
    (s) => s.setFloatingActionPosition,
  );
  const {
    biometricSupported,
    biometricEnabled,
    enableBiometric,
    disableBiometric,
  } = useBiometric();

  const handleBiometricToggle = async (val: boolean) => {
    if (val) {
      const success = await enableBiometric();
      if (!success) {
        Alert.alert('Authentication failed', 'Could not enable Face ID.');
      }
    } else {
      disableBiometric();
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<EditableWorkout | null>(null);

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to sign out',
      );
    }
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  const profileHeader = (
    <View style={{ paddingTop: insets.top + 20 }}>
      {/* Branded header */}
      <View className="mb-6 flex-row items-center gap-3">
        <View className="h-6 w-[2px] bg-primary" />
        <View>
          <Text
            className="text-2xl font-bold text-forge-text"
            style={{ letterSpacing: 4 }}
          >
            PROFILE
          </Text>
          <Text className="text-xs text-forge-muted">
            {profile?.username ? `@${profile.username}` : 'Your account'}
          </Text>
        </View>
      </View>

      {/* Avatar section */}
      <View className="mb-6 items-center">
        <Pressable onPress={handleAvatarPress} className="mb-3">
          {isUploadingAvatar ? (
            <View className="h-24 w-24 items-center justify-center rounded-full bg-forge-elevated">
              <ActivityIndicator />
            </View>
          ) : profile?.avatar_url ? (
            <View>
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
              <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-primary">
                <Camera size={12} color="#fff" weight="regular" />
              </View>
            </View>
          ) : (
            <View>
              <View className="h-24 w-24 items-center justify-center rounded-full bg-forge-elevated">
                <User size={36} color={Forge.primary} weight="regular" />
              </View>
              <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full bg-primary">
                <Camera size={12} color="#fff" weight="regular" />
              </View>
            </View>
          )}
        </Pressable>

        {isEditing ? (
          <View className="w-full gap-3 px-4">
            <View>
              <Text className="mb-1 text-xs uppercase tracking-[2px] text-forge-muted">
                Display Name
              </Text>
              <Input
                size="sm"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display name"
              />
            </View>
            <View>
              <Text className="mb-1 text-xs uppercase tracking-[2px] text-forge-muted">
                Username
              </Text>
              <Input
                size="sm"
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
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
            <Text className="text-xl font-bold text-forge-text">
              {profile?.display_name ?? profile?.username ?? 'Loading...'}
            </Text>
            <Text className="text-sm text-forge-muted">
              @{profile?.username ?? '...'}
            </Text>
            <Text className="mt-1 text-xs text-forge-muted">{user?.email}</Text>
            {memberSince && (
              <Text className="mt-1 text-xs text-forge-muted">
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
          <Text className="mb-3 text-xs uppercase tracking-[2px] text-forge-muted">
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
          <Text className="mb-3 text-xs uppercase tracking-[2px] text-forge-muted">
            Groups
          </Text>
          {groups.map((group) => (
            <Link key={group.id} href={`/group/${group.id}`} asChild>
              <Pressable className="mb-2 rounded-lg border border-forge-border bg-forge-surface p-3 active:opacity-70">
                <Text className="font-medium text-forge-text">
                  {group.name}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      <View className="mb-6">
        <Text className="mb-3 text-xs uppercase tracking-[2px] text-forge-muted">
          Preferences
        </Text>
        <View className="rounded-xl border border-forge-border bg-forge-surface p-4">
          <Text className="mb-3 text-sm font-medium text-forge-text">
            Floating Button Position
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(
              [
                'top-left',
                'top-right',
                'bottom-left',
                'bottom-right',
              ] as FloatingActionPosition[]
            ).map((pos) => (
              <Pressable
                key={pos}
                className={`flex-1 rounded-lg border py-2 ${
                  floatingActionPosition === pos
                    ? 'border-primary bg-primary/10'
                    : 'border-forge-border'
                }`}
                onPress={() => setFloatingActionPosition(pos)}
              >
                <Text
                  className={`text-center text-xs font-medium capitalize ${
                    floatingActionPosition === pos
                      ? 'text-primary'
                      : 'text-forge-muted'
                  }`}
                >
                  {pos.replace('-', '\n')}
                </Text>
              </Pressable>
            ))}
          </View>

          {biometricSupported && (
            <View className="mt-4 flex-row items-center justify-between border-t border-forge-border pt-3">
              <Text className="text-sm font-medium text-forge-text">
                Face ID / Touch ID
              </Text>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#3a3a3a', true: '#454dcc' }}
                thumbColor="#ffffff"
              />
            </View>
          )}
        </View>
      </View>

      <Button
        variant="danger"
        title="Sign Out"
        onPress={handleSignOut}
        className="mb-6"
      />

      {workouts && workouts.length > 0 && (
        <Text className="mb-2 text-xs uppercase tracking-[2px] text-forge-muted">
          Your Workouts
        </Text>
      )}
    </View>
  );

  return (
    <FlatList
      className="flex-1 bg-forge-bg"
      contentContainerClassName="px-4"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      data={workouts ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={profileHeader}
      ListEmptyComponent={
        <View className="items-center py-8">
          <Text className="text-forge-muted">No workouts yet</Text>
        </View>
      }
      renderItem={({ item }: { item: FeedWorkout }) => (
        <WorkoutCard workout={item} onEdit={() => setEditingWorkout(item)} />
      )}
    />

    <EditWorkoutModal
      workout={editingWorkout}
      visible={!!editingWorkout}
      onClose={() => setEditingWorkout(null)}
    />
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="min-w-[22%] flex-1 items-center rounded-lg border border-forge-border bg-forge-surface p-3">
      <Text className="text-lg font-bold text-primary">{value}</Text>
      <Text className="text-xs text-forge-muted">{label}</Text>
    </View>
  );
}
