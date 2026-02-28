import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const EASE = Easing.bezier(0.25, 0.8, 0.25, 1);

// Animation timing
const T_SHAFT = 0; // shaft drops in
const T_PLATES = 200; // plates slide in from sides (after shaft lands)
const T_TEXT = 480; // text fades in (after plates settle)

const SHAFT_RISE = 50; // px above natural position shaft starts
const PLATE_TRAVEL = 200; // px outside natural position plates start

export const LOGO_TEXT_DELAY = T_TEXT;
export const LOGO_ANIMATION_DURATION = T_TEXT + 200 + 50;

type Props = {
  onAnimationComplete?: () => void;
  /** When false, renders the logo in its final static state with no animation. */
  animate?: boolean;
};

export function BarbellLogo({ onAnimationComplete, animate = true }: Props) {
  const shaftTranslateY = useSharedValue(animate ? -SHAFT_RISE : 0);
  const shaftOpacity = useSharedValue(animate ? 0 : 1);
  // Left plates start far to the left, right plates start far to the right
  const leftPlatesX = useSharedValue(animate ? -PLATE_TRAVEL : 0);
  const rightPlatesX = useSharedValue(animate ? PLATE_TRAVEL : 0);
  const textOpacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;

    // Step 1: Shaft drops in from above
    shaftTranslateY.value = withDelay(
      T_SHAFT,
      withTiming(0, { duration: 200, easing: EASE }),
    );
    shaftOpacity.value = withDelay(
      T_SHAFT,
      withTiming(1, { duration: 180, easing: EASE }),
    );

    // Step 2: Left and right plates slide in from their respective sides simultaneously
    leftPlatesX.value = withDelay(
      T_PLATES,
      withTiming(0, { duration: 250, easing: EASE }),
    );
    rightPlatesX.value = withDelay(
      T_PLATES,
      withTiming(0, { duration: 250, easing: EASE }),
    );

    // Step 3: Text fades in — callback fires here to signal animation complete
    textOpacity.value = withDelay(
      T_TEXT,
      withTiming(1, { duration: 200, easing: EASE }, (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shaftStyle = useAnimatedStyle(() => ({
    opacity: shaftOpacity.value,
    transform: [{ translateY: shaftTranslateY.value }],
  }));

  const leftPlatesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftPlatesX.value }],
  }));

  const rightPlatesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightPlatesX.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.barbellRow}>
        {/* Left plates slide in from the left */}
        <Animated.View style={[styles.platesGroup, leftPlatesStyle]}>
          <View style={[styles.plate, styles.outerPlate]} />
          <View style={[styles.plate, styles.innerPlate]} />
        </Animated.View>

        {/* Shaft drops in from above */}
        <Animated.View style={[styles.shaft, shaftStyle]} />

        {/* Right plates slide in from the right */}
        <Animated.View style={[styles.platesGroup, rightPlatesStyle]}>
          <View style={[styles.plate, styles.innerPlate]} />
          <View style={[styles.plate, styles.outerPlate]} />
        </Animated.View>
      </View>

      <Animated.Text style={[styles.logoText, textStyle]}>
        IBB LOG
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  barbellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  platesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  plate: {
    backgroundColor: '#E4E4E7',
    borderRadius: 2,
  },
  outerPlate: {
    width: 14,
    height: 52,
  },
  innerPlate: {
    width: 10,
    height: 40,
  },
  shaft: {
    width: 160,
    height: 3,
    backgroundColor: '#A1A1AA',
  },
  logoText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 6,
    color: '#A1A1AA',
  },
});
