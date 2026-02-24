import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/lib/stores/settings-store';

export type FloatingAction = {
  icon: string;
  onPress: () => void;
  label?: string;
  variant?: 'default' | 'primary';
};

type FloatingActionsProps = {
  actions: FloatingAction[];
};

const TIMING_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.8, 0.25, 1),
};

export function FloatingActions({ actions }: FloatingActionsProps) {
  const insets = useSafeAreaInsets();
  const position = useSettingsStore((s) => s.floatingActionPosition);

  const translateX = useSharedValue(position.includes('right') ? 100 : -100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const right = position.includes('right');
    translateX.value = right ? 100 : -100;
    opacity.value = 0;
    translateX.value = withTiming(0, TIMING_CONFIG);
    opacity.value = withTiming(1, TIMING_CONFIG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const isRight = position.includes('right');
  const isTop = position.includes('top');

  const positionStyle = {
    position: 'absolute' as const,
    gap: 12,
    ...(isRight ? { right: 16 + insets.right } : { left: 16 + insets.left }),
    ...(isTop ? { top: insets.top + 80 } : { bottom: insets.bottom + 80 }),
  };

  return (
    <Animated.View style={[positionStyle, animatedStyle]}>
      {actions.map((action, index) => (
        <ActionButton key={index} action={action} />
      ))}
    </Animated.View>
  );
}

function ActionButton({ action }: { action: FloatingAction }) {
  const isPrimary = action.variant === 'primary';
  const glowProgress = useSharedValue(0);

  // Single progress value drives both border color and shadow intensity —
  // the border lights up and the outer halo spreads simultaneously.
  const glowStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      glowProgress.value,
      [0, 1],
      [isPrimary ? '#454dcc' : '#1E2235', '#454dcc'],
    ),
    shadowOpacity: glowProgress.value * 0.9,
    shadowRadius: 8 + glowProgress.value * 8,
  }));

  return (
    <Pressable
      onPress={action.onPress}
      onPressIn={() => {
        glowProgress.value = withTiming(1, { duration: 150 });
      }}
      onPressOut={() => {
        glowProgress.value = withTiming(0, { duration: 200 });
      }}
      accessibilityLabel={action.label}
      accessibilityRole="button"
    >
      <Animated.View
        style={[styles.button, isPrimary && styles.buttonPrimary, glowStyle]}
      >
        <Ionicons
          name={action.icon as React.ComponentProps<typeof Ionicons>['name']}
          size={22}
          color={isPrimary ? '#ffffff' : '#A1A1AA'}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#141821',
    borderWidth: 1,
    borderColor: '#1E2235',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#454dcc',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0,
  },
  buttonPrimary: {
    backgroundColor: '#454dcc',
    borderColor: '#454dcc',
  },
});
