import { Link } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Forge } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { WorkoutCard } from '@/components/WorkoutCard';
import { useFeedWorkouts } from '@/lib/hooks/use-workouts';

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

export default function FeedScreen() {
  const { data: workouts, isLoading, error } = useFeedWorkouts();
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
          Failed to load feed: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-forge-bg">
      <FlatList
        data={workouts}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentContainerClassName="px-4"
        ListEmptyComponent={
          <View className="items-center py-24">
            <Text className="mb-1 text-base font-bold tracking-widest text-forge-text">
              NO WORKOUTS YET
            </Text>
            <Text className="text-sm text-forge-muted">
              Log one to get started.
            </Text>
          </View>
        }
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
                  FEED
                </Text>
                <Text className="text-xs text-forge-muted">Group activity</Text>
              </View>
            </View>

            {/* Group actions */}
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
        renderItem={({ item, index }) => (
          <AnimatedCard index={index}>
            <WorkoutCard workout={item} />
          </AnimatedCard>
        )}
      />
    </View>
  );
}
