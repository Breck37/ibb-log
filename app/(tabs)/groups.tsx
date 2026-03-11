import { Link } from 'expo-router';
import { UsersThree } from 'phosphor-react-native';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Forge } from '@/constants/Colors';
import { useMyGroups } from '@/lib/hooks/use-groups';

function AnimatedCard({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const translateY = useSharedValue(16);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = Math.min(index, 6) * 60;
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: 420,
        easing: Easing.bezier(0.25, 0.8, 0.25, 1),
      }),
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

export default function GroupsScreen() {
  const { data: groups, isLoading, error } = useMyGroups();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-forge-bg">
        <ActivityIndicator size="large" color={Forge.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-forge-bg px-4">
        <Text className="text-primary">
          Failed to load groups: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-forge-bg">
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 20 }} className="mb-6 gap-5">
            {/* Branded header */}
            <View className="flex-row items-center gap-3">
              <View className="h-6 w-[2px] bg-primary" />
              <View>
                <Text
                  className="text-2xl font-bold text-forge-text"
                  style={{ letterSpacing: 4 }}
                >
                  GROUPS
                </Text>
                <Text className="text-xs text-forge-muted">Train together</Text>
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-3">
              <Link href="/group/create" asChild>
                <Button className="flex-1" title="Create Group" />
              </Link>
              <Link href="/group/join" asChild>
                <Button
                  className="flex-1"
                  variant="outline"
                  title="Join Group"
                />
              </Link>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <UsersThree size={40} color="#A1A1AA" weight="light" />
            <Text className="mb-1 mt-5 text-base font-bold tracking-widest text-forge-text">
              NO GROUPS YET
            </Text>
            <Text className="text-sm text-forge-muted">
              Create or join one to get started.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedCard index={index}>
            <Link href={`/group/${item.id}`} asChild>
              <Pressable className="mb-3 rounded-xl border border-forge-border bg-forge-surface active:opacity-70">
                <View className="flex-row items-center p-4">
                  <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-forge-elevated">
                    <UsersThree size={20} color={Forge.primary} weight="fill" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-forge-text">
                      {item.name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-forge-muted">
                      {item.min_workouts_per_week}x/week
                      {item.min_workout_minutes_to_qualify
                        ? ` · ${item.min_workout_minutes_to_qualify} min minimum`
                        : ''}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          </AnimatedCard>
        )}
      />
    </View>
  );
}
