// Minimal client for Expo's push API.
// https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Expo accepts at most 100 messages per request.
const CHUNK_SIZE = 100;

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
};

type ExpoPushTicket =
  | { status: 'ok'; id: string }
  | {
      status: 'error';
      message: string;
      details?: { error?: string };
    };

export type SendResult = {
  sent: number;
  /** Tokens Expo reported as no longer valid — safe to delete. */
  invalidTokens: string[];
  errors: string[];
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Sends messages to Expo, returning which tokens are dead so the caller can prune
 * them. Never throws for a per-message failure — a bad token shouldn't fail the batch.
 */
export async function sendExpoPushNotifications(
  messages: ExpoPushMessage[],
): Promise<SendResult> {
  const result: SendResult = { sent: 0, invalidTokens: [], errors: [] };
  if (messages.length === 0) return result;

  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');

  for (const batch of chunk(messages, CHUNK_SIZE)) {
    let response: Response;
    try {
      response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          // Only needed if the Expo project enforces push security.
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(batch),
      });
    } catch (error) {
      result.errors.push(`network: ${String(error)}`);
      continue;
    }

    if (!response.ok) {
      result.errors.push(`expo ${response.status}: ${await response.text()}`);
      continue;
    }

    const payload = (await response.json()) as { data?: ExpoPushTicket[] };
    const tickets = payload.data ?? [];

    tickets.forEach((ticket, index) => {
      if (ticket.status === 'ok') {
        result.sent += 1;
        return;
      }
      result.errors.push(ticket.message);
      // The device uninstalled the app or the token rotated.
      if (ticket.details?.error === 'DeviceNotRegistered') {
        result.invalidTokens.push(batch[index].to);
      }
    });
  }

  return result;
}
