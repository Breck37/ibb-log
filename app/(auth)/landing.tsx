import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarbellLogo, LOGO_TEXT_DELAY } from '@/components/BarbellLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/auth-provider';

const EASE = Easing.bezier(0.25, 0.8, 0.25, 1);

export default function LandingScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Logo + tagline */}
        <View style={styles.logoSection}>
          <BarbellLogo onAnimationComplete={handleAnimationComplete} />
          <Animated.Text style={[styles.tagline, taglineStyle]}>
            Intent. Build. Become.
          </Animated.Text>
        </View>

        {/* Sign-in form — fades in after animation */}
        <Animated.View style={[styles.form, formStyle]}>
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
            <Pressable style={styles.forgotRow}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </Pressable>
          </Link>

          <Button
            title="Sign In"
            variant="primary"
            className="w-full"
            style={styles.signInButton}
            onPress={handleSignIn}
            loading={loading}
          />

          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={styles.signUpRow}>
              <Text style={styles.mutedText}>
                Don't have an account?{' '}
                <Text style={styles.primaryText}>Sign up</Text>
              </Text>
            </Pressable>
          </Link>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 32,
  },
  logoSection: {
    alignItems: 'center',
    gap: 14,
    marginBottom: 44,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 3,
    color: '#A1A1AA',
    textTransform: 'uppercase',
  },
  form: {},
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotLink: {
    fontSize: 13,
    color: '#454dcc',
  },
  signInButton: {
    marginBottom: 24,
  },
  signUpRow: {
    alignItems: 'center',
  },
  mutedText: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  primaryText: {
    color: '#454dcc',
  },
});
