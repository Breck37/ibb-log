import { Eye, EyeSlash } from 'phosphor-react-native';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
  type TextInputProps,
} from 'react-native';
import { forgePalette } from '@/constants/Colors';
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
  /** Show eye icon to toggle password visibility. Defaults to false. */
  showToggle?: boolean;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      size = 'default',
      glow = false,
      showToggle = false,
      className,
      onFocus,
      onBlur,
      secureTextEntry,
      ...props
    },
    ref,
  ) => {
    const palette =
      forgePalette[useColorScheme() === 'light' ? 'light' : 'dark'];

    const [hidden, setHidden] = useState(true);
    const glowProgress = useSharedValue(0);

    // Single progress value drives border color and outer shadow simultaneously.
    const glowStyle = useAnimatedStyle(() => ({
      borderColor: glow
        ? interpolateColor(
            glowProgress.value,
            [0, 1],
            [palette.border, '#454dcc'],
          )
        : palette.border,
      shadowOpacity: glow ? glowProgress.value : 0,
      shadowRadius: glow ? 8 + glowProgress.value * 32 : 0,
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

    const isSecure = showToggle ? hidden : secureTextEntry;
    const IconComponent = hidden ? Eye : EyeSlash;

    return (
      <Animated.View
        style={[styles.shadow, glowStyle]}
        className={`rounded-lg bg-forge-surface ${className ?? ''}`}
      >
        <View className="flex-row items-center">
          <TextInput
            ref={ref}
            className="flex-1 text-forge-text"
            style={size === 'sm' ? styles.inputSm : styles.input}
            placeholderTextColor={palette.placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isSecure}
            {...props}
          />
          {showToggle && (
            <Pressable
              onPress={() => setHidden((h) => !h)}
              className="px-4 py-3"
              hitSlop={8}
            >
              <IconComponent size={18} color="#A1A1AA" />
            </Pressable>
          )}
        </View>
      </Animated.View>
    );
  },
);

Input.displayName = 'Input';

// StyleSheet required: provides base shadow properties that Reanimated's glowStyle
// merges over to animate the neon glow effect. Shadow objects cannot be expressed
// via Tailwind. bg/border/text colors use Tailwind tokens or forgePalette instead.
const styles = StyleSheet.create({
  shadow: {
    borderWidth: 1,
    shadowColor: '#454dcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  // StyleSheet padding on TextInput avoids NativeWind quirks and ensures
  // includeFontPadding:false on Android (prevents descender clipping).
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    includeFontPadding: false,
  },
  inputSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    includeFontPadding: false,
  },
});
