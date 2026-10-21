import * as Notifications from 'expo-notifications';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { useNotificationRouting } from '@/lib/hooks/use-notifications';
import {
  registerForPushNotificationsAsync,
  savePushToken,
} from '@/lib/services/push-notifications';
import { useAuth } from '@/providers/auth-provider';

type NotificationContextType = {
  /** This device's Expo push token, or null if push isn't available. */
  pushToken: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  /** Re-runs the permission prompt + registration. Safe to call repeatedly. */
  register: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
  pushToken: null,
  permissionStatus: null,
  register: async () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

/**
 * Registers this device for push on sign-in and keeps the token row current.
 *
 * Must be mounted inside AuthProvider (it reads the session) and inside
 * QueryClientProvider (the routing hook invalidates queries).
 */
export function NotificationProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);

  // The user id we last registered for, so we don't re-prompt on every render but do
  // re-register when a different account signs in on this device.
  const registeredForRef = useRef<string | null>(null);

  useNotificationRouting();

  const register = useCallback(async () => {
    const { token, status } = await registerForPushNotificationsAsync();
    setPermissionStatus(status);
    setPushToken(token);

    if (!token) return;
    try {
      await savePushToken(token);
    } catch (error) {
      // A failed save just means this device won't receive pushes — not worth
      // interrupting the user over.
      console.warn('[push] Failed to save push token:', error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      registeredForRef.current = null;
      setPushToken(null);
      return;
    }
    if (registeredForRef.current === user.id) return;
    registeredForRef.current = user.id;
    register();
  }, [user, register]);

  return (
    <NotificationContext.Provider
      value={{ pushToken, permissionStatus, register }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
