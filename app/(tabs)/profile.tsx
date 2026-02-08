import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useQuery } from "@tanstack/react-query";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to sign out",
      );
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4">
      <View className="mb-6 items-center">
        <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <FontAwesome name="user" size={32} color="#3b82f6" />
        </View>
        <Text className="text-xl font-bold dark:text-white">
          {profile?.display_name ?? profile?.username ?? "Loading..."}
        </Text>
        <Text className="text-sm text-gray-500">
          @{profile?.username ?? "..."}
        </Text>
        <Text className="mt-1 text-xs text-gray-400">{user?.email}</Text>
      </View>

      <Pressable
        className="rounded-lg border border-red-300 py-3 active:bg-red-50"
        onPress={handleSignOut}
      >
        <Text className="text-center font-medium text-red-600">Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}
