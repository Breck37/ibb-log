import type { ImagePickerAsset } from 'expo-image-picker';

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import {
  EditWorkoutModal,
  type EditableWorkout,
} from '@/components/EditWorkoutModal';
import { Input } from '@/components/ui/Input';
import { WorkoutCard } from '@/components/WorkoutCard';
import { useMyGroups } from '@/lib/hooks/use-groups';
import { useCreateWorkout, useMyWorkouts } from '@/lib/hooks/use-workouts';
import { pickImages } from '@/lib/services/image-upload';

export default function LogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: groups } = useMyGroups();
  const createWorkout = useCreateWorkout();
  const { data: recentWorkouts } = useMyWorkouts(5);

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[] | null>(
    null,
  );
  const [duration, setDuration] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImagePickerAsset[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<EditableWorkout | null>(
    null,
  );

  // Auto-select all groups until the user interacts with the selector
  const effectiveGroupIds =
    selectedGroupIds !== null
      ? selectedGroupIds
      : (groups?.map((g) => g.id) ?? []);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const current = prev !== null ? prev : (groups?.map((g) => g.id) ?? []);
      return current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId];
    });
  };

  const handlePickImages = async () => {
    const assets = await pickImages();
    if (assets.length > 0) {
      setImages((prev) => [...prev, ...assets]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!duration || parseInt(duration, 10) <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }

    try {
      await createWorkout.mutateAsync({
        groupIds: effectiveGroupIds,
        durationMinutes: parseInt(duration, 10),
        title: title.trim(),
        description: description.trim() || undefined,
        images,
      });

      setDuration('');
      setTitle('');
      setDescription('');
      setImages([]);
      setSelectedGroupIds(null);
      router.navigate('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to log workout',
      );
    }
  };

  const showGroupSelector = groups && groups.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-forge-bg"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branded header */}
        <View className="mb-6 flex-row items-center gap-3">
          <View className="h-6 w-[2px] bg-primary" />
          <View>
            <Text
              className="text-2xl font-bold text-forge-text"
              style={{ letterSpacing: 4 }}
            >
              LOG
            </Text>
            <Text className="text-xs text-forge-muted">Record your work</Text>
          </View>
        </View>

        {showGroupSelector && (
          <>
            <Text className="mb-2 text-xs uppercase tracking-[2px] text-forge-muted">
              Post to Groups
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerClassName="gap-2"
            >
              {groups.map((group) => (
                <Pressable
                  key={group.id}
                  className={`rounded-full px-4 py-2 ${
                    effectiveGroupIds.includes(group.id)
                      ? 'bg-primary'
                      : 'border border-forge-border bg-forge-elevated'
                  }`}
                  onPress={() => toggleGroup(group.id)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      effectiveGroupIds.includes(group.id)
                        ? 'text-white'
                        : 'text-forge-muted'
                    }`}
                  >
                    {group.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <Text className="mb-2 text-xs uppercase tracking-[2px] text-forge-muted">
          Duration (minutes)
        </Text>
        <Input
          glow
          className="mb-4"
          placeholder="45"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
        />

        <Text className="mb-2 text-xs uppercase tracking-[2px] text-forge-muted">
          Title
        </Text>
        <Input
          glow
          className="mb-4"
          placeholder="e.g. Push day: bench, OHP, dips..."
          value={title}
          onChangeText={setTitle}
        />

        <Text className="mb-2 text-xs uppercase tracking-[2px] text-forge-muted">
          Description (optional)
        </Text>
        <Input
          glow
          className="mb-4"
          placeholder="How did it go?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text className="mb-2 text-xs uppercase tracking-[2px] text-forge-muted">
          Photos
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {images.map((img, index) => (
            <Pressable key={img.uri} onPress={() => removeImage(index)}>
              <Image
                source={{ uri: img.uri }}
                className="h-20 w-20 rounded-lg"
              />
              <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-red-500">
                <Text className="text-xs font-bold text-white">×</Text>
              </View>
            </Pressable>
          ))}
          <Pressable
            className="h-20 w-20 items-center justify-center rounded-lg border border-dashed border-forge-border"
            onPress={handlePickImages}
          >
            <Text className="text-2xl text-forge-muted">+</Text>
          </Pressable>
        </View>

        <Button
          title="Log Workout"
          loading={createWorkout.isPending}
          className="mb-8"
          onPress={handleSubmit}
        />

        {recentWorkouts && recentWorkouts.length > 0 && (
          <View className="mt-8">
            <Text className="mb-3 text-xs uppercase tracking-[2px] text-forge-muted">
              Recent Workouts
            </Text>
            {recentWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onEdit={() => setEditingWorkout(workout)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <EditWorkoutModal
        workout={editingWorkout}
        visible={!!editingWorkout}
        onClose={() => setEditingWorkout(null)}
      />
    </KeyboardAvoidingView>
  );
}
