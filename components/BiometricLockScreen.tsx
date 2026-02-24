import * as LocalAuthentication from 'expo-local-authentication';
import { ScanFace, FingerprintSimple } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useBiometric } from '@/providers/biometric-provider';

export function BiometricLockScreen() {
  const { unlock } = useBiometric();
  const [failed, setFailed] = useState(false);
  const [authType, setAuthType] = useState<'face' | 'fingerprint'>('face');

  const glowProgress = useSharedValue(0);
  const iconStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowProgress.value * 0.9,
    shadowRadius: 8 + glowProgress.value * 20,
  }));

  useEffect(() => {
    // Determine auth type for icon
    LocalAuthentication.supportedAuthenticationTypesAsync().then((types) => {
      if (
        types.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT,
        )
      ) {
        setAuthType('fingerprint');
      }
    });

    // Auto-trigger on mount
    triggerUnlock();
  }, []);

  const triggerUnlock = async () => {
    setFailed(false);
    glowProgress.value = withTiming(1, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.8, 0.25, 1),
    });
    const success = await unlock();
    if (!success) {
      glowProgress.value = withTiming(0, { duration: 300 });
      setFailed(true);
    }
  };

  const Icon = authType === 'fingerprint' ? FingerprintSimple : ScanFace;

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>IBB LOG</Text>

      <Pressable onPress={triggerUnlock} style={styles.iconWrapper}>
        <Animated.View style={[styles.iconGlow, iconStyle]}>
          <Icon size={72} color="#454dcc" weight="thin" />
        </Animated.View>
      </Pressable>

      <Text style={styles.prompt}>
        {failed ? 'Authentication failed' : 'Tap to unlock'}
      </Text>

      {failed && (
        <Pressable onPress={triggerUnlock} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0D12',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    zIndex: 999,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 6,
    marginBottom: 16,
    opacity: 0.5,
  },
  iconWrapper: {
    padding: 24,
  },
  iconGlow: {
    shadowColor: '#454dcc',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0,
  },
  prompt: {
    color: '#A1A1AA',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#1E2235',
    borderRadius: 8,
  },
  retryText: {
    color: '#454dcc',
    fontSize: 14,
    fontWeight: '500',
  },
});
