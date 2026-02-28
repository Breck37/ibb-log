import { Link } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';

import { BarbellLogo } from '@/components/BarbellLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/auth-provider';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to sign in',
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
      <View className="flex-1 justify-center px-8">
        <View className="mb-10 items-center">
          <BarbellLogo animate={false} />
        </View>

        <Input
          glow
          className="mb-4"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <Input
          glow
          className="mb-6"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        <Button
          className="mb-4"
          title="Sign In"
          onPress={handleSignIn}
          loading={loading}
        />

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable>
            <Text className="mb-4 text-center text-sm text-primary">
              Forgot password?
            </Text>
          </Pressable>
        </Link>

        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <Text className="text-center text-sm text-forge-muted">
              Don't have an account?{' '}
              <Text className="text-primary">Sign up</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
