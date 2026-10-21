import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Payload we attach to every notification we send, used to route a tap.
 * Mirrors the `data` object built in `supabase/functions/notify-workout`.
 */
export type NotificationData = {
  type?: 'workout_posted' | 'group_message' | 'achievement' | 'weekly_report';
  workoutId?: string;
  groupId?: string;
};

function readData(notification: Notifications.Notification): NotificationData {
  return (notification.request.content.data ?? {}) as NotificationData;
}

/**
 * Wires up notification receipt and tap handling.
 *
 * Mounted once, from the notification provider. Handles three cases:
 *  - foreground receipt (refresh the data the notification refers to)
 *  - tap while running or backgrounded
 *  - tap that cold-started the app (the response is waiting for us on mount)
 */
export function useNotificationRouting() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Guards against handling the cold-start response twice: the OS also delivers it
  // to the response listener on some launches.
  const handledColdStartRef = useRef(false);

  const handleTap = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = readData(response.notification);

      // Object form rather than a template string: `typedRoutes` is on, so this is
      // the shape that stays type-checked against the route tree.
      if (data.workoutId) {
        router.push({
          pathname: '/workout/[id]',
          params: { id: data.workoutId },
        });
        return;
      }
      if (data.groupId) {
        router.push({ pathname: '/group/[id]', params: { id: data.groupId } });
      }
    },
    [router],
  );

  useEffect(() => {
    // A notification arrived while the app was open — the screen behind it is now
    // stale, so refetch rather than making the user pull to refresh.
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['group-workouts'] });
    });

    const responseSub =
      Notifications.addNotificationResponseReceivedListener(handleTap);

    // Cold start: the app was launched by a notification tap, which happened before
    // any listener existed.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response || handledColdStartRef.current) return;
      handledColdStartRef.current = true;
      handleTap(response);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [handleTap, queryClient]);
}
