import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { Forge } from '@/constants/Colors';
import { Input } from '@/components/ui/Input';
import { useUpdateWorkout } from '@/lib/hooks/use-workouts';
import { pickImages } from '@/lib/services/image-upload';

// Set to a number (e.g. 24) to enable time-based editing cutoff, or null for no limit.
// When you have data to decide, change this constant — no other code changes needed.
const EDIT_WINDOW_HOURS: number | null = null;

const AUTOSAVE_DELAY_MS = 2000;

export type EditableWorkout = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  image_urls: string[];
  created_at: string;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type Props = {
  workout: EditableWorkout | null;
  visible: boolean;
  onClose: () => void;
};

function isWithinEditWindow(createdAt: string): boolean {
  if (EDIT_WINDOW_HOURS === null) return true;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs <= EDIT_WINDOW_HOURS * 60 * 60 * 1000;
}

export function EditWorkoutModal({ workout, visible, onClose }: Props) {
  const updateWorkout = useUpdateWorkout();

  const [duration, setDuration] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keptImageUrls, setKeptImageUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<ImagePickerAsset[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const isDirtyRef = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Keep a ref to the latest save function so the timer always calls the freshest version
  const performSaveRef = useRef<() => Promise<void>>();

  // Populate form when modal opens or workout changes
  useEffect(() => {
    if (workout && visible) {
      setDuration(String(workout.duration_minutes));
      setTitle(workout.title);
      setDescription(workout.description ?? '');
      setKeptImageUrls(workout.image_urls);
      setNewImages([]);
      setSaveStatus('idle');
      isDirtyRef.current = false;
    }
  }, [workout?.id, visible]);

  // Cancel any pending autosave when modal closes
  useEffect(() => {
    if (!visible && autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
  }, [visible]);

  // Core save logic — reads from local state via closure, so always current
  const performSave = async () => {
    if (!workout) return;

    const titleVal = title.trim();
    const durationNum = parseInt(duration, 10);

    if (!titleVal || isNaN(durationNum) || durationNum <= 0) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    try {
      await updateWorkout.mutateAsync({
        workoutId: workout.id,
        title: titleVal,
        description: description.trim() || null,
        durationMinutes: durationNum,
        keptImageUrls,
        newImages,
      });
      // After a successful save, new images are now uploaded — clear the local list
      setNewImages([]);
      isDirtyRef.current = false;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  // Keep the ref pointing at the latest closure
  performSaveRef.current = performSave;

  const scheduleAutoSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (isDirtyRef.current) performSaveRef.current?.();
    }, AUTOSAVE_DELAY_MS);
  };

  const markDirty = () => {
    isDirtyRef.current = true;
    setSaveStatus('idle');
    scheduleAutoSave();
  };

  const handleDurationChange = (text: string) => {
    setDuration(text);
    markDirty();
  };
  const handleTitleChange = (text: string) => {
    setTitle(text);
    markDirty();
  };
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    markDirty();
  };

  const handleRemoveExistingImage = (url: string) => {
    setKeptImageUrls((prev) => prev.filter((u) => u !== url));
    markDirty();
  };
  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };
  const handlePickImages = async () => {
    const assets = await pickImages();
    if (assets.length > 0) {
      setNewImages((prev) => [...prev, ...assets]);
      markDirty();
    }
  };

  const handleSaveAndClose = async () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    await performSave();
    if (saveStatus !== 'error') onClose();
  };

  const handleCancel = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (isDirtyRef.current) {
      Alert.alert('Discard changes?', 'Your unsaved changes will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            isDirtyRef.current = false;
            onClose();
          },
        },
      ]);
    } else {
      onClose();
    }
  };

  if (!workout) return null;

  const editable = isWithinEditWindow(workout.created_at);
  const isSaving = saveStatus === 'saving' || updateWorkout.isPending;

  const statusLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? 'Saved'
        : saveStatus === 'error'
          ? 'Save failed — check your input'
          : '';

  const statusColor =
    saveStatus === 'error' ? 'text-red-500' : 'text-forge-muted';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-forge-bg"
      >
        {/* Header */}
        <View className="flex-row items-center border-b border-forge-border px-4 py-3">
          <Pressable onPress={handleCancel} hitSlop={8} className="py-1 pr-4">
            <Text className="text-forge-muted">Cancel</Text>
          </Pressable>

          <View className="flex-1 items-center">
            <Text className="font-semibold text-forge-text">Edit Workout</Text>
            {statusLabel ? (
              <Text className={`text-xs ${statusColor}`}>{statusLabel}</Text>
            ) : null}
          </View>

          <Pressable
            onPress={handleSaveAndClose}
            disabled={isSaving || !editable}
            hitSlop={8}
            className="py-1 pl-4"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Forge.primary} />
            ) : (
              <Text
                className={`font-semibold ${editable ? 'text-primary' : 'text-forge-muted'}`}
              >
                Save
              </Text>
            )}
          </Pressable>
        </View>

        {/* Body */}
        {!editable ? (
          <View className="flex-1 items-center justify-center p-8">
            <FontAwesome name="lock" size={32} color={Forge.muted} />
            <Text className="mt-4 text-center text-forge-muted">
              This workout can no longer be edited.
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="p-4 pb-10"
            keyboardShouldPersistTaps="handled"
          >
            <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-forge-muted">
              Duration (minutes)
            </Text>
            <Input
              className="mb-5"
              value={duration}
              onChangeText={handleDurationChange}
              keyboardType="number-pad"
              placeholder="45"
            />

            <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-forge-muted">
              Title
            </Text>
            <Input
              className="mb-5"
              value={title}
              onChangeText={handleTitleChange}
              placeholder="Workout title"
            />

            <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-forge-muted">
              Description
            </Text>
            <Input
              className="mb-5"
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder="How did it go? (optional)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text className="mb-2 text-xs font-medium uppercase tracking-wide text-forge-muted">
              Photos
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {keptImageUrls.map((url) => (
                <Pressable
                  key={url}
                  onPress={() => handleRemoveExistingImage(url)}
                >
                  <Image
                    source={{ uri: url }}
                    className="h-20 w-20 rounded-lg"
                  />
                  <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-red-500">
                    <Text className="text-xs font-bold text-white">×</Text>
                  </View>
                </Pressable>
              ))}

              {newImages.map((img, index) => (
                <Pressable
                  key={img.uri}
                  onPress={() => handleRemoveNewImage(index)}
                >
                  <Image
                    source={{ uri: img.uri }}
                    className="h-20 w-20 rounded-lg opacity-75"
                  />
                  <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-red-500">
                    <Text className="text-xs font-bold text-white">×</Text>
                  </View>
                  {/* "new" badge so user can distinguish uploaded vs pending */}
                  <View className="absolute bottom-0 left-0 right-0 items-center rounded-b-lg bg-black/40 py-0.5">
                    <Text className="text-[9px] font-medium text-white">
                      new
                    </Text>
                  </View>
                </Pressable>
              ))}

              <Pressable
                className="h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-forge-border active:border-primary"
                onPress={handlePickImages}
              >
                <FontAwesome name="plus" size={20} color="#9ca3af" />
              </Pressable>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
