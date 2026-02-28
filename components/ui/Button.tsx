import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'default' | 'sm';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const bgColors: Record<ButtonVariant, string> = {
  primary: '#454dcc',
  outline: 'transparent',
  danger: 'transparent',
  ghost: 'transparent',
};

const bgPressedColors: Record<ButtonVariant, string> = {
  primary: '#373ea3',
  outline: 'rgba(69,77,204,0.10)',
  danger: 'rgba(69,77,204,0.10)',
  ghost: 'transparent',
};

const borderRestColors: Record<ButtonVariant, string> = {
  primary: '#454dcc',
  outline: '#454dcc',
  danger: 'rgba(69,77,204,0.60)',
  ghost: 'transparent',
};

const textColors: Record<ButtonVariant, string> = {
  primary: '#ffffff',
  outline: '#454dcc',
  danger: '#454dcc',
  ghost: '#A1A1AA',
};

const paddingV: Record<ButtonSize, number> = {
  default: 12,
  sm: 8,
};

const paddingH: Record<ButtonSize, number> = {
  default: 0,
  sm: 24,
};

const fontSizes: Record<ButtonSize, number> = {
  default: 16,
  sm: 14,
};

export function Button({
  title,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled,
  className,
  onPressIn: onPressInProp,
  onPressOut: onPressOutProp,
  ...props
}: ButtonProps) {
  const glowProgress = useSharedValue(0);

  // Single progress value drives border color, background, and shadow halo simultaneously.
  const glowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      glowProgress.value,
      [0, 1],
      [bgColors[variant], bgPressedColors[variant]],
    ),
    borderColor: interpolateColor(
      glowProgress.value,
      [0, 1],
      [borderRestColors[variant], '#6c73e8'],
    ),
    shadowOpacity: glowProgress.value * 0.85,
    shadowRadius: 6 + glowProgress.value * 14,
  }));

  return (
    <Pressable
      className={className}
      disabled={disabled || loading}
      onPressIn={(e) => {
        glowProgress.value = withTiming(1, { duration: 150 });
        onPressInProp?.(e);
      }}
      onPressOut={(e) => {
        glowProgress.value = withTiming(0, { duration: 200 });
        onPressOutProp?.(e);
      }}
      {...props}
    >
      <Animated.View
        style={[
          styles.base,
          glowStyle,
          {
            paddingVertical: paddingV[size],
            paddingHorizontal: paddingH[size],
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: textColors[variant], fontSize: fontSizes[size] },
          ]}
        >
          {loading ? 'Loading...' : title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#454dcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
