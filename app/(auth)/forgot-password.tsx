import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
      className="flex-1 bg-forge-bg"
    >
      <ScrollView
        contentContainerClassName="px-8 pt-20 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-3 text-center text-[28px] font-bold text-forge-text">
          Reset Password
        </Text>

        {sent ? (
          <View>
            <Text className="text-center text-sm leading-[22px] text-forge-muted">
              Check your email for a password reset link. You can close this
              screen and sign in after resetting your password.
            </Text>
          </View>
        ) : (
          <View>
            <Text className="mb-8 text-center text-sm leading-[22px] text-forge-muted">
              Enter your email and we&apos;ll send you a reset link
            </Text>

            <Input
              className="mb-4"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <Button
              className="mt-2"
              title="Send Reset Link"
              onPress={handleReset}
              loading={loading}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
