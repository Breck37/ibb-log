import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useJoinGroup } from "@/lib/hooks/use-groups";

export default function JoinGroupScreen() {
  const router = useRouter();
  const joinGroup = useJoinGroup();
  const [inviteCode, setInviteCode] = useState("");

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }

    try {
      const group = await joinGroup.mutateAsync(inviteCode.trim());
      router.replace(`/group/${group.id}`);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to join group",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="mb-6 text-center text-2xl font-bold dark:text-white">
          Join Group
        </Text>

        <TextInput
          className="mb-6 rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-widest dark:border-gray-600 dark:text-white"
          placeholder="Enter invite code"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          className="rounded-lg bg-blue-600 py-3 active:bg-blue-700"
          onPress={handleJoin}
          disabled={joinGroup.isPending}
        >
          <Text className="text-center text-base font-semibold text-white">
            {joinGroup.isPending ? "Joining..." : "Join Group"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
