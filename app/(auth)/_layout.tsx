import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="landing" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen
        name="sign-up"
        options={{
          headerShown: true,
          title: '',
          headerTransparent: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          title: '',
          headerTransparent: true,
          headerBackTitle: '',
        }}
      />
    </Stack>
  );
}
