import * as LocalAuthentication from 'expo-local-authentication';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { useSettingsStore } from '@/lib/stores/settings-store';

import { useAuth } from './auth-provider';

type BiometricContextType = {
  isLocked: boolean;
  biometricSupported: boolean;
  biometricEnabled: boolean;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => void;
  unlock: () => Promise<boolean>;
};

const BiometricContext = createContext<BiometricContextType>({
  isLocked: false,
  biometricSupported: false,
  biometricEnabled: false,
  enableBiometric: async () => false,
  disableBiometric: () => {},
  unlock: async () => false,
});

export function useBiometric() {
  return useContext(BiometricContext);
}

export function BiometricProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const { biometricEnabled, setBiometricEnabled } = useSettingsStore();
  const [isLocked, setIsLocked] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const lockedThisSession = useRef(false);

  // Check hardware support once on mount
  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(hasHardware && isEnrolled);
    })();
  }, []);

  // Lock the app when a session first becomes available and biometric is enabled
  useEffect(() => {
    if (session && biometricEnabled && !lockedThisSession.current) {
      lockedThisSession.current = true;
      setIsLocked(true);
    }
  }, [session, biometricEnabled]);

  const authenticate = useCallback(async (promptMessage: string) => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    if (!result.success && result.error === 'not_available') {
      // Face ID / biometric permission was denied in system settings
      Alert.alert(
        'Permission Required',
        Platform.OS === 'ios'
          ? 'Face ID access is disabled for IBB Log. Enable it in Settings → IBB Log → Face ID.'
          : 'Biometric access is disabled. Enable it in your device Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () =>
              Platform.OS === 'ios'
                ? Linking.openURL('app-settings:')
                : Linking.openSettings(),
          },
        ],
      );
    }

    return result.success;
  }, []);

  const unlock = useCallback(async () => {
    const success = await authenticate('Unlock IBB Log');
    if (success) setIsLocked(false);
    return success;
  }, [authenticate]);

  const enableBiometric = useCallback(async () => {
    const success = await authenticate('Confirm your identity to enable Face ID');
    if (success) setBiometricEnabled(true);
    return success;
  }, [authenticate, setBiometricEnabled]);

  const disableBiometric = useCallback(() => {
    setBiometricEnabled(false);
    setIsLocked(false);
    lockedThisSession.current = false;
  }, [setBiometricEnabled]);

  return (
    <BiometricContext.Provider
      value={{
        isLocked,
        biometricSupported,
        biometricEnabled,
        enableBiometric,
        disableBiometric,
        unlock,
      }}
    >
      {children}
    </BiometricContext.Provider>
  );
}
