import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Forge } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function GroupSettingsScreen() {
  const { id, isAdmin: isAdminParam } = useLocalSearchParams<{
    id: string;
    isAdmin: string;
  }>();
  const isAdmin = isAdminParam === '1';
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

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

  const [name, setName] = useState('');
  const [minWorkouts, setMinWorkouts] = useState('');
  const [minMinutes, setMinMinutes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setMinWorkouts(String(group.min_workouts_per_week));
      setMinMinutes(String(group.min_workout_minutes_to_qualify));
    }
  }, [group]);

  const handleSave = async () => {
    const minWorkoutsNum = parseInt(minWorkouts, 10);
    const minMinutesNum = parseInt(minMinutes, 10);

    if (!name.trim() || isNaN(minWorkoutsNum) || isNaN(minMinutesNum)) {
      Alert.alert('Error', 'Please fill in all fields with valid values.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: name.trim(),
          min_workouts_per_week: minWorkoutsNum,
          min_workout_minutes_to_qualify: minMinutesNum,
        })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.back();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save settings.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-forge-bg">
        <ActivityIndicator size="large" color={Forge.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ title: isAdmin ? 'Group Settings' : 'Group Info' }}
      />
      <ScrollView
        className="flex-1 bg-forge-bg"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-forge-muted">
          Group Name
        </Text>
        <Input
          className="mb-5"
          value={name}
          onChangeText={setName}
          placeholder="Group name"
          editable={isAdmin}
        />

        <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-forge-muted">
          Minimum Workouts per Week
        </Text>
        <Input
          className="mb-5"
          value={minWorkouts}
          onChangeText={setMinWorkouts}
          keyboardType="number-pad"
          placeholder="3"
          editable={isAdmin}
        />

        <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-forge-muted">
          Minimum Minutes to Qualify
        </Text>
        <Input
          className="mb-8"
          value={minMinutes}
          onChangeText={setMinMinutes}
          keyboardType="number-pad"
          placeholder="30"
          editable={isAdmin}
        />

        {isAdmin && (
          <Button title="Save Changes" loading={saving} onPress={handleSave} />
        )}
      </ScrollView>
    </>
  );
}
