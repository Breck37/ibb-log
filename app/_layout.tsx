import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import 'react-native-reanimated';

import '../global.css';
import { BiometricLockScreen } from '@/components/BiometricLockScreen';
import { darkTheme, lightTheme } from '@/constants/Colors';
import { AuthProvider } from '@/providers/auth-provider';
import { BiometricProvider, useBiometric } from '@/providers/biometric-provider';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AppShell({ colorScheme }: { colorScheme: 'light' | 'dark' | null }) {
  const { isLocked } = useBiometric();

  return (
    <View
      style={colorScheme === 'dark' ? darkTheme : lightTheme}
      className="flex-1"
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="reset-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="workout/[id]"
            options={{ title: 'Workout Details' }}
          />
          <Stack.Screen name="group/[id]" options={{ title: 'Group' }} />
          <Stack.Screen
            name="group/create"
            options={{ title: 'Create Group', presentation: 'modal' }}
          />
          <Stack.Screen
            name="group/join"
            options={{ title: 'Join Group', presentation: 'modal' }}
          />
          <Stack.Screen
            name="group/settings"
            options={{ title: 'Group Settings' }}
          />
        </Stack>
      </ThemeProvider>
      {isLocked && <BiometricLockScreen />}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BiometricProvider>
          <AppShell colorScheme={colorScheme} />
        </BiometricProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
