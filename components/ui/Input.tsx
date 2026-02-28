import React, { useCallback } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type InputSize = 'default' | 'sm';

interface InputProps extends TextInputProps {
  size?: InputSize;
  className?: string;
  /** Enable the neon glow effect on focus. Defaults to false. */
  glow?: boolean;
}

const paddingClasses: Record<InputSize, string> = {
  default: 'px-4 py-4 text-base',
  sm: 'px-3 py-2 text-sm',
};

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    { size = 'default', glow = false, className, onFocus, onBlur, ...props },
    ref,
  ) => {
    const glowProgress = useSharedValue(0);

    // Single progress value drives border color and outer shadow simultaneously.
    const glowStyle = useAnimatedStyle(() => ({
      borderColor: glow
        ? interpolateColor(glowProgress.value, [0, 1], ['#1E2235', '#454dcc'])
        : '#1E2235',
      shadowOpacity: glow ? glowProgress.value * 0.9 : 0,
      shadowRadius: glow ? 8 + glowProgress.value * 8 : 0,
    }));

    const handleFocus = useCallback(
      (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
        if (glow) glowProgress.value = withTiming(1, { duration: 150 });
        onFocus?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [glow, onFocus],
    );

    const handleBlur = useCallback(
      (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
        if (glow) glowProgress.value = withTiming(0, { duration: 200 });
        onBlur?.(e);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [glow, onBlur],
    );

    return (
      <Animated.View
        style={[styles.wrapper, glowStyle]}
        className={`rounded-lg ${className ?? ''}`}
      >
        <TextInput
          ref={ref}
          className={`flex-1 dark:text-white ${paddingClasses[size]}`}
          placeholderTextColor="#4B5563"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: '#1E2235',
    backgroundColor: '#141821',
    shadowColor: '#454dcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
});
