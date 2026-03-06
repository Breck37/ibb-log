import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarbellLogo, LOGO_TEXT_DELAY } from '@/components/BarbellLogo';
import { BuildInfoButton } from '@/components/BuildInfoButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/auth-provider';

const EASE = Easing.bezier(0.25, 0.8, 0.25, 1);

export default function SignInScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { invite } = useLocalSearchParams<{ invite?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Tagline syncs with "IBB LOG" text (step 3 of logo animation)
  const taglineOpacity = useSharedValue(0);
  // Form fades in after animation completes
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    taglineOpacity.value = withDelay(
      LOGO_TEXT_DELAY,
      withTiming(1, { duration: 200, easing: EASE }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const handleAnimationComplete = () => {
    formOpacity.value = withTiming(1, { duration: 300, easing: EASE });
  };

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
        'Sign In Failed',
        error instanceof Error
          ? error.message
          : 'Please check your credentials',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-forge-bg">
      <BuildInfoButton />
      <ScrollView
        className="absolute inset-0"
        contentContainerClassName="flex-grow px-8"
        contentContainerStyle={{
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Logo + tagline */}
        <View className="mb-11 items-center gap-3.5">
          <BarbellLogo onAnimationComplete={handleAnimationComplete} />
          <Animated.Text
            className="text-xs font-medium uppercase tracking-[3px] text-forge-muted"
            style={taglineStyle}
          >
            Intent. Build. Become.
          </Animated.Text>
        </View>

        {/* Sign-in form — fades in after animation */}
        <Animated.View style={formStyle}>
          <Input
            glow
            className="mb-3"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Input
            glow
            className="mb-2"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable className="mb-5 self-end">
              <Text className="text-[13px] text-primary">Forgot password?</Text>
            </Pressable>
          </Link>

          <Button
            title="Sign In"
            variant="primary"
            className="mb-6 w-full"
            onPress={handleSignIn}
            loading={loading}
          />

          <Link
            href={
              invite
                ? { pathname: '/(auth)/sign-up', params: { invite } }
                : '/(auth)/sign-up'
            }
            asChild
          >
            <Pressable className="items-center">
              <Text className="text-sm text-forge-muted">
                Don&apos;t have an account?{' '}
                <Text className="text-primary">Sign up</Text>
              </Text>
            </Pressable>
          </Link>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
