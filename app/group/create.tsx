import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useCreateGroup } from "@/lib/hooks/use-groups";

export default function CreateGroupScreen() {
  const router = useRouter();
  const createGroup = useCreateGroup();
  const [name, setName] = useState("");
  const [minWorkoutsPerWeek, setMinWorkoutsPerWeek] = useState("3");
  const [minMinutes, setMinMinutes] = useState("30");

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a group name");
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
        "Error",
        error instanceof Error ? error.message : "Failed to create group",
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
        contentContainerClassName="p-6"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-6 text-2xl font-bold dark:text-white">
          Create Group
        </Text>

        <Text className="mb-2 font-medium dark:text-gray-300">Group Name</Text>
        <TextInput
          className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-base dark:border-gray-600 dark:text-white"
          placeholder="e.g. Morning Crew"
          value={name}
          onChangeText={setName}
        />

        <Text className="mb-2 font-medium dark:text-gray-300">
          Min Workouts Per Week
        </Text>
        <TextInput
          className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-base dark:border-gray-600 dark:text-white"
          placeholder="3"
          value={minWorkoutsPerWeek}
          onChangeText={setMinWorkoutsPerWeek}
          keyboardType="number-pad"
        />

        <Text className="mb-2 font-medium dark:text-gray-300">
          Min Minutes to Qualify
        </Text>
        <TextInput
          className="mb-6 rounded-lg border border-gray-300 px-4 py-3 text-base dark:border-gray-600 dark:text-white"
          placeholder="30"
          value={minMinutes}
          onChangeText={setMinMinutes}
          keyboardType="number-pad"
        />

        <Pressable
          className="rounded-lg bg-blue-600 py-3 active:bg-blue-700"
          onPress={handleCreate}
          disabled={createGroup.isPending}
        >
          <Text className="text-center text-base font-semibold text-white">
            {createGroup.isPending ? "Creating..." : "Create Group"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
