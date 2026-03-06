import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/auth-provider';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, username);
      Alert.alert('Success', 'Check your email for a confirmation link!', [
        {
          text: 'OK',
          onPress: () =>
            router.replace(
              invite
                ? { pathname: '/(auth)/sign-in', params: { invite } }
                : '/(auth)/sign-in',
            ),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to sign up',
      );
    } finally {
      setLoading(false);
    }
  };

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
          className="mb-4"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
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
