import type { ImagePickerAsset } from "expo-image-picker";

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMyGroups } from "@/lib/hooks/use-groups";
import { useCreateWorkout } from "@/lib/hooks/use-workouts";
import { pickImages } from "@/lib/services/image-upload";

export default function LogScreen() {
  const router = useRouter();
  const { data: groups } = useMyGroups();
  const createWorkout = useCreateWorkout();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [routine, setRoutine] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<ImagePickerAsset[]>([]);

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
    if (!selectedGroupId) {
      Alert.alert("Error", "Please select a group");
      return;
    }
    if (!duration || parseInt(duration, 10) <= 0) {
      Alert.alert("Error", "Please enter a valid duration");
      return;
    }
    if (!routine.trim()) {
      Alert.alert("Error", "Please describe your routine");
      return;
    }

    try {
      await createWorkout.mutateAsync({
        groupId: selectedGroupId,
        durationMinutes: parseInt(duration, 10),
        routine: routine.trim(),
        notes: notes.trim() || undefined,
        images,
      });

      Alert.alert("Success", "Workout logged!");
      setDuration("");
      setRoutine("");
      setNotes("");
      setImages([]);
      router.navigate("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to log workout",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-2 font-medium dark:text-gray-300">Group</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerClassName="gap-2"
        >
          {groups?.map((group) => (
            <Pressable
              key={group.id}
              className={`rounded-full px-4 py-2 ${
                selectedGroupId === group.id
                  ? "bg-blue-600"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
              onPress={() => setSelectedGroupId(group.id)}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedGroupId === group.id
                    ? "text-white"
                    : "dark:text-white"
                }`}
              >
                {group.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text className="mb-2 font-medium dark:text-gray-300">
          Duration (minutes)
        </Text>
        <TextInput
          className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-base dark:border-gray-600 dark:text-white"
          placeholder="45"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
        />

        <Text className="mb-2 font-medium dark:text-gray-300">Routine</Text>
        <TextInput
          className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-base dark:border-gray-600 dark:text-white"
          placeholder="e.g. Push day: bench, OHP, dips..."
          value={routine}
          onChangeText={setRoutine}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text className="mb-2 font-medium dark:text-gray-300">
          Notes (optional)
        </Text>
        <TextInput
          className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-base dark:border-gray-600 dark:text-white"
          placeholder="How did it go?"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />

        <Text className="mb-2 font-medium dark:text-gray-300">Photos</Text>
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
            className="h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
            onPress={handlePickImages}
          >
            <Text className="text-2xl text-gray-400">+</Text>
          </Pressable>
        </View>

        <Pressable
          className="rounded-lg bg-blue-600 py-3 active:bg-blue-700"
          onPress={handleSubmit}
          disabled={createWorkout.isPending}
        >
          <Text className="text-center text-base font-semibold text-white">
            {createWorkout.isPending ? "Logging..." : "Log Workout"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
