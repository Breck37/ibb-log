import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * How a notification behaves when it arrives while the app is in the foreground.
 * Without this, foreground notifications are silently swallowed by the OS.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * The Expo push token for this device, cached at module level.
 *
 * Needed because sign-out has to delete the token row *before* the session is torn
 * down (RLS requires an authenticated caller), and the auth provider has no access to
 * React state in the notification provider.
 */
let lastKnownToken: string | null = null;

export function getCachedPushToken() {
  return lastKnownToken;
}

/** EAS project id — required by `getExpoPushTokenAsync` in bare/production builds. */
function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

export type PushRegistration = {
  token: string | null;
  status: Notifications.PermissionStatus;
};

/**
 * Requests notification permission and resolves this device's Expo push token.
 *
 * Returns `token: null` without throwing when push is unavailable — a simulator, or a
 * user who declined the prompt. Callers should treat that as "no push for this
 * device", not as an error.
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistration> {
  // Push tokens are only issued to physical devices. Simulators always fail.
  if (!Device.isDevice) {
    return { token: null, status: Notifications.PermissionStatus.UNDETERMINED };
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  // Only prompt if the user hasn't answered yet. Re-asking after a denial does
  // nothing on iOS — they have to change it in Settings.
  if (status !== Notifications.PermissionStatus.GRANTED) {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== Notifications.PermissionStatus.GRANTED) {
    return { token: null, status };
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn(
      '[push] No EAS projectId found — cannot resolve a push token.',
    );
    return { token: null, status };
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    lastKnownToken = data;
    return { token: data, status };
  } catch (error) {
    console.warn('[push] Failed to get Expo push token:', error);
    return { token: null, status };
  }
}

/**
 * Stores the token against the signed-in user.
 *
 * Goes through the `register_push_token` RPC rather than a direct upsert so a device
 * that changes hands between users reassigns cleanly — see migration 00005.
 */
export async function savePushToken(token: string) {
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });
  if (error) throw error;
}

/**
 * Removes this device's token. Must run while the session is still valid, so call it
 * before `supabase.auth.signOut()`.
 */
export async function removePushToken(token = lastKnownToken) {
  if (!token) return;
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('token', token);
  if (error) {
    // Never block sign-out on this. A stale row is harmless: sends to it will come
    // back as DeviceNotRegistered and get pruned by the Edge Function.
    console.warn('[push] Failed to remove push token:', error.message);
  }
  lastKnownToken = null;
}
