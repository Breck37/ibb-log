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
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMyGroups } from "@/lib/hooks/use-groups";
import { useCreateWorkout } from "@/lib/hooks/use-workouts";
import { pickImages } from "@/lib/services/image-upload";

export default function LogScreen() {
  const router = useRouter();
  const { data: groups } = useMyGroups();
  const createWorkout = useCreateWorkout();

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImagePickerAsset[]>([]);

  // Auto-select all groups when they load and none are selected yet
  const effectiveGroupIds =
    selectedGroupIds.length > 0
      ? selectedGroupIds
      : (groups?.map((g) => g.id) ?? []);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      // Initialize from all groups if first interaction
      const current = prev.length > 0 ? prev : groups?.map((g) => g.id) ?? [];
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
      Alert.alert("Error", "Please enter a valid duration");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (images.length === 0) {
      Alert.alert("Error", "Please add at least one photo");
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

      Alert.alert("Success", "Workout logged!");
      setDuration("");
      setTitle("");
      setDescription("");
      setImages([]);
      setSelectedGroupIds([]);
      router.navigate("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to log workout",
      );
    }
  };

  const showGroupSelector = groups && groups.length > 1;

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
        {showGroupSelector && (
          <>
            <Text className="mb-2 font-medium dark:text-gray-300">
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
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                  onPress={() => toggleGroup(group.id)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      effectiveGroupIds.includes(group.id)
                        ? "text-white"
                        : "dark:text-white"
                    }`}
                  >
                    {group.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <Text className="mb-2 font-medium dark:text-gray-300">
          Duration (minutes)
        </Text>
        <Input
          className="mb-4"
          placeholder="45"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
        />

        <Text className="mb-2 font-medium dark:text-gray-300">Title</Text>
        <Input
          className="mb-4"
          placeholder="e.g. Push day: bench, OHP, dips..."
          value={title}
          onChangeText={setTitle}
        />

        <Text className="mb-2 font-medium dark:text-gray-300">
          Description (optional)
        </Text>
        <Input
          className="mb-4"
          placeholder="How did it go?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
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

        <Button
          title="Log Workout"
          onPress={handleSubmit}
          loading={createWorkout.isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
