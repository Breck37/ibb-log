// Notifies the other members of every group a workout was posted to.
//
// Invoked from the client right after a successful post:
//   supabase.functions.invoke('notify-workout', { body: { workoutId } })
//
// Runs server-side rather than from the app because push tokens are owner-only under
// RLS (migration 00005) — the poster cannot read their group-mates' tokens, and
// shouldn't be able to.
//
// Deploy: supabase functions deploy notify-workout --project-ref <ref>

import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  sendExpoPushNotifications,
  type ExpoPushMessage,
} from '../_shared/expo-push.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Caller-scoped client: used only to resolve who is asking.
  const asCaller = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: { headers: { Authorization: authHeader } },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await asCaller.auth.getUser();

  if (userError || !user) {
    return json({ error: 'Not authenticated' }, 401);
  }

  let workoutId: string | undefined;
  try {
    ({ workoutId } = await req.json());
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!workoutId) {
    return json({ error: 'workoutId is required' }, 400);
  }

  // Service-role client: needs to read other users' push tokens, which RLS forbids.
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Confirm the caller owns this workout before fanning anything out.
  const { data: workout, error: workoutError } = await admin
    .from('workouts')
    .select('id, user_id, title')
    .eq('id', workoutId)
    .single();

  if (workoutError || !workout) {
    return json({ error: 'Workout not found' }, 404);
  }
  if (workout.user_id !== user.id) {
    return json({ error: 'Not your workout' }, 403);
  }

  const { data: posterProfile } = await admin
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single();

  const posterName =
    posterProfile?.display_name || posterProfile?.username || 'Someone';

  // Which groups did this workout go to?
  const { data: groupWorkouts, error: gwError } = await admin
    .from('group_workouts')
    .select('group_id, groups(id, name)')
    .eq('workout_id', workoutId);

  if (gwError) {
    return json({ error: gwError.message }, 500);
  }
  if (!groupWorkouts?.length) {
    return json({ sent: 0, reason: 'Workout not posted to any group' });
  }

  const groupNames = new Map<string, string>();
  for (const row of groupWorkouts) {
    const group = row.groups as { id: string; name: string } | null;
    if (group) groupNames.set(group.id, group.name);
  }

  const { data: members, error: membersError } = await admin
    .from('group_members')
    .select('user_id, group_id')
    .in('group_id', [...groupNames.keys()])
    .neq('user_id', user.id);

  if (membersError) {
    return json({ error: membersError.message }, 500);
  }
  if (!members?.length) {
    return json({ sent: 0, reason: 'No other members to notify' });
  }

  // One notification per recipient, even when they share several groups with the
  // poster. First group wins for the name shown.
  const recipientGroup = new Map<string, string>();
  for (const member of members) {
    if (!recipientGroup.has(member.user_id)) {
      recipientGroup.set(member.user_id, member.group_id);
    }
  }

  const { data: tokens, error: tokensError } = await admin
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', [...recipientGroup.keys()]);

  if (tokensError) {
    return json({ error: tokensError.message }, 500);
  }
  if (!tokens?.length) {
    return json({ sent: 0, reason: 'No registered devices' });
  }

  const messages: ExpoPushMessage[] = tokens.map((row) => {
    const groupId = recipientGroup.get(row.user_id)!;
    const groupName = groupNames.get(groupId) ?? 'your group';
    return {
      to: row.token,
      title: groupName,
      body: `${posterName} posted a workout: ${workout.title}`,
      sound: 'default',
      // Consumed by useNotificationRouting to deep link the tap.
      data: { type: 'workout_posted', workoutId, groupId },
    };
  });

  const result = await sendExpoPushNotifications(messages);

  // Prune tokens Expo told us are dead so the next send is cheaper.
  if (result.invalidTokens.length > 0) {
    await admin.from('push_tokens').delete().in('token', result.invalidTokens);
  }

  return json({
    sent: result.sent,
    pruned: result.invalidTokens.length,
    errors: result.errors,
  });
});
