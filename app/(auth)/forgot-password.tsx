import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/auth-provider';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send reset link',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="mb-2 text-center text-3xl font-bold">
          Reset Password
        </Text>

        {sent ? (
          <View>
            <Text className="mt-4 text-center text-base text-gray-400">
              Check your email for a password reset link. You can close this
              screen and sign in after resetting your password.
            </Text>
          </View>
        ) : (
          <View>
            <Text className="mb-8 text-center text-lg text-gray-400">
              Enter your email and we'll send you a reset link
            </Text>

            <Input
              className="mb-6"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <Button
              title="Send Reset Link"
              onPress={handleReset}
              loading={loading}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
