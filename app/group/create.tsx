import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateGroup } from '@/lib/hooks/use-groups';

export default function CreateGroupScreen() {
  const router = useRouter();
  const createGroup = useCreateGroup();
  const [name, setName] = useState('');
  const [minWorkoutsPerWeek, setMinWorkoutsPerWeek] = useState('3');
  const [minMinutes, setMinMinutes] = useState('30');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      const group = await createGroup.mutateAsync({
        name: name.trim(),
        min_workouts_per_week: parseInt(minWorkoutsPerWeek, 10) || 3,
        min_workout_minutes_to_qualify: parseInt(minMinutes, 10) || 30,
      });
      router.replace(`/group/${group.id}`);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create group',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-6 text-2xl font-bold dark:text-white">
          Create Group
        </Text>

        <Text className="mb-2 font-medium dark:text-gray-300">Group Name</Text>
        <Input
          className="mb-4"
          placeholder="e.g. Morning Crew"
          value={name}
          onChangeText={setName}
        />

        <Text className="mb-2 font-medium dark:text-gray-300">
          Min Workouts Per Week
        </Text>
        <Input
          className="mb-4"
          placeholder="3"
          value={minWorkoutsPerWeek}
          onChangeText={setMinWorkoutsPerWeek}
          keyboardType="number-pad"
        />

        <Text className="mb-2 font-medium dark:text-gray-300">
          Min Minutes to Qualify
        </Text>
        <Input
          className="mb-6"
          placeholder="30"
          value={minMinutes}
          onChangeText={setMinMinutes}
          keyboardType="number-pad"
        />

        <Button
          title="Create Group"
          onPress={handleCreate}
          loading={createGroup.isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
