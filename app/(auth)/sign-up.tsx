import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/auth-provider';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, username, invite);
      setPendingConfirmation(true);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to sign up',
      );
    } finally {
      setLoading(false);
    }
  };

  if (pendingConfirmation) {
    return (
      <View className="flex-1 items-center justify-center bg-forge-bg px-8">
        <Text className="mb-3 text-center text-[28px] font-bold text-forge-text">
          Check your email
        </Text>
        <Text className="mb-2 text-center text-sm text-forge-muted">
          We sent a confirmation link to
        </Text>
        <Text className="mb-8 text-center text-sm font-semibold text-forge-text">
          {email}
        </Text>
        <Text className="text-center text-sm text-forge-muted">
          Tap the link in that email to confirm your account — then come back
          and sign in.
        </Text>
        <Link href="/(auth)/sign-in" asChild>
          <Pressable className="mt-10 items-center py-2">
            <Text className="text-sm text-primary">Back to sign in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-forge-bg"
    >
      <ScrollView
        contentContainerClassName="px-8 pt-20 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-8 text-center text-[28px] font-bold text-forge-text">
          Create Account
        </Text>

        <Input
          className="mb-4"
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          textContentType="username"
        />

        <Input
          className="mb-4"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <Input
          showToggle
          className="mb-4"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          textContentType="newPassword"
        />

        <Button
          className="mb-5 mt-2"
          title="Sign Up"
          onPress={handleSignUp}
          loading={loading}
        />

        <Link href="/(auth)/sign-in" asChild>
          <Pressable className="items-center py-2">
            <Text className="text-center text-sm text-forge-muted">
              Already have an account?{' '}
              <Text className="text-sm text-primary">Sign in</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
