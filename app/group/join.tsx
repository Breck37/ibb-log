import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useJoinGroup } from '@/lib/hooks/use-groups';
import { setPendingInvite, useAuth } from '@/providers/auth-provider';

export default function JoinGroupScreen() {
  const router = useRouter();
  const joinGroup = useJoinGroup();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { user, isLoading } = useAuth();
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    if (code) setInviteCode(code);
  }, [code]);

  // When this screen mounts with a code but no session, store the code in the
  // module-level variable so useProtectedRoute can redirect to join after sign-in.
  // This is the most reliable source — Expo Router always routes here directly
  // from the deep link before any auth redirect happens.
  useEffect(() => {
    if (isLoading) return;
    if (!user && code) {
      setPendingInvite(code);
    }
  }, [user, isLoading, code]);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      const group = await joinGroup.mutateAsync(inviteCode.trim());
      router.replace(`/group/${group.id}`);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to join group',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="mb-6 text-center text-2xl font-bold dark:text-white">
          Join Group
        </Text>

        <Input
          className="mb-6 text-center text-lg tracking-widest"
          placeholder="Enter invite code"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          title="Join Group"
          onPress={handleJoin}
          loading={joinGroup.isPending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
