import { Link } from "expo-router";
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

import { useAuth } from "@/providers/auth-provider";

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, username);
      Alert.alert("Success", "Check your email for a confirmation link!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to sign up",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="mb-8 text-center text-3xl font-bold">
          Create Account
        </Text>

        <TextInput
          className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-base dark:border-gray-600 dark:text-white"
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          textContentType="username"
        />

        <TextInput
          className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-base dark:border-gray-600 dark:text-white"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <TextInput
          className="mb-6 rounded-lg border border-gray-300 px-4 py-3 text-base dark:border-gray-600 dark:text-white"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
        />

        <Pressable
          className="mb-4 rounded-lg bg-blue-600 py-3 active:bg-blue-700"
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text className="text-center text-base font-semibold text-white">
            {loading ? "Creating account..." : "Sign Up"}
          </Text>
        </Pressable>

        <Link href="/(auth)/sign-in" asChild>
          <Pressable>
            <Text className="text-center text-sm text-blue-600">
              Already have an account? Sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
