import { Gear, ShareNetwork, User } from 'phosphor-react-native';
import { useQuery } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Forge } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useGroupMembers } from '@/lib/hooks/use-groups';

function InviteButton({ onPress }: { onPress: () => void }) {
  const glowProgress = useSharedValue(0);

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      glowProgress.value,
      [0, 1],
      ['#454dcc', '#9098f5'],
    ),
    shadowOpacity: glowProgress.value,
    shadowRadius: 8 + glowProgress.value * 32,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        glowProgress.value = withTiming(1, { duration: 150 });
      }}
      onPressOut={() => {
        glowProgress.value = withTiming(0, { duration: 200 });
      }}
    >
      <Animated.View
        className="flex-row items-center gap-1.5 rounded-lg px-4 py-2.5"
        style={[
          {
            borderWidth: 1,
            borderColor: '#454dcc',
            shadowColor: '#454dcc',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
          },
          glowStyle,
        ]}
      >
        <ShareNetwork size={14} color={Forge.primary} weight="bold" />
        <Text className="text-xs font-semibold tracking-widest text-primary">
          INVITE
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: members } = useGroupMembers(id);

  const handleShareInvite = async () => {
    if (!group) return;
    const deepLink = `ibblog://group/join?code=${group.invite_code}`;
    try {
      await Share.share({
        message: `Join my group "${group.name}" on IBB Log!\n\nTap to join: ${deepLink}\n\nOr enter code manually: ${group.invite_code}`,
        url: deepLink,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message !== 'The user did not share'
      ) {
        Alert.alert('Error', 'Could not open share sheet.');
      }
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-forge-bg">
        <ActivityIndicator size="large" color={Forge.primary} />
      </View>
    );
  }

  if (!group && !isLoading) {
    router.replace('/(tabs)/groups');
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () => (
            <Link href="/group/settings" asChild>
              <Pressable className="p-2">
                <Gear size={20} color="#A1A1AA" weight="regular" />
              </Pressable>
            </Link>
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-forge-bg"
        contentContainerClassName="p-4"
      >
        {/* Group info card */}
        <View className="mb-4 flex-row items-center rounded-xl border border-forge-border bg-forge-surface p-4">
          <View className="flex-1">
            <Text className="text-lg font-bold text-forge-text">
              {group.name}
            </Text>
            <Text className="mt-1 text-sm text-forge-muted">
              {group.min_workouts_per_week} workouts/week &middot;{' '}
              {group.min_workout_minutes_to_qualify}min minimum
            </Text>
          </View>
          <InviteButton onPress={handleShareInvite} />
        </View>

        {/* Members */}
        <Text className="mb-3 text-xs uppercase tracking-[2px] text-forge-muted">
          Members ({members?.length ?? 0})
        </Text>
        {members?.map((member) => (
          <View
            key={member.id}
            className="mb-2 flex-row items-center rounded-xl border border-forge-border bg-forge-surface p-3"
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-forge-elevated">
              <User size={16} color={Forge.primary} weight="regular" />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-forge-text">
                {member.profiles?.display_name ?? member.profiles?.username}
              </Text>
              <Text className="text-xs text-forge-muted">{member.role}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}
