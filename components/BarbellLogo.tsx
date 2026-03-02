import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const EASE = Easing.bezier(0.25, 0.8, 0.25, 1);

// Animation timing
const T_SHAFT = 0;
const T_LEFT_PLATES = 200; // left plates slide in (250ms → done at 450)
const T_TILT = 450; // shaft tilts left-down (280ms → done at 730)
const TILT_HOLD = 160; // hold at full tilt; right plates START during this hold
const STABILIZE_DUR = 260; // shaft levels AFTER hold expires

// Right plates begin moving the moment tilting finishes — shaft is still fully
// tilted and holding, so the plates slide in at an angle. The hold runs for
// another 160ms after this, giving the plates a head start before any leveling.
const T_RIGHT_PLATES = T_TILT + 280; // 730

// Rock sequence — whole barbell oscillates to a stop after balancing.
// Using sine easing so each swing feels like a real pendulum arc.
const ROCK_ANGLE = 3.5; // degrees, first swing amplitude
const ROCK_1_DUR = 170; // swing right
const ROCK_2_DUR = 149; // swing left  (60% amplitude)
const ROCK_3_DUR = 110; // swing right (25% amplitude)
const ROCK_SETTLE_DUR = 200; // ease back to level
const ROCK_TOTAL = ROCK_1_DUR + ROCK_2_DUR + ROCK_3_DUR + ROCK_SETTLE_DUR; // 870ms

// Text appears once the whole rock sequence finishes
const T_TEXT = T_TILT + 280 + TILT_HOLD + STABILIZE_DUR + ROCK_TOTAL + 20;

// Shaft tilt: negative = left side dips down, right side floats up
const TILT_DEGREES = -7;

const SHAFT_RISE = 50; // px above start position
const PLATE_TRAVEL = 200; // px off-screen plates start from

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
  const shaftRotation = useSharedValue(0);
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

    // Step 2: Left plates slide in
    leftPlatesX.value = withDelay(
      T_LEFT_PLATES,
      withTiming(0, { duration: 250, easing: EASE }),
    );

    // Step 3: Full shaft rotation sequence —
    //   tilt left (weight on left) → hold → snap to level (right plates arrive)
    //   → rock back and forth with decaying amplitude → settle perfectly level
    // The plates follow automatically since their styles derive from shaftRotation.
    shaftRotation.value = withDelay(
      T_TILT,
      withSequence(
        withTiming(TILT_DEGREES, { duration: 280, easing: EASE }),
        withTiming(TILT_DEGREES, { duration: TILT_HOLD }), // hold (same value = pause)
        withTiming(0, { duration: STABILIZE_DUR, easing: EASE }),
        withTiming(ROCK_ANGLE, {
          duration: ROCK_1_DUR,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(-ROCK_ANGLE * 0.6, {
          duration: ROCK_2_DUR,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(ROCK_ANGLE * 0.25, {
          duration: ROCK_3_DUR,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: ROCK_SETTLE_DUR,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );

    // Step 4: Right plates slide in as the shaft is springing back to level
    rightPlatesX.value = withDelay(
      T_RIGHT_PLATES,
      withTiming(0, { duration: 250, easing: EASE }),
    );

    // Step 5: Text fades in once everything is balanced
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
    transform: [
      { translateY: shaftTranslateY.value },
      { rotate: `${shaftRotation.value}deg` },
    ],
  }));

  // When the shaft tilts, the plates need to move vertically AND rotate by the same
  // angle — as if they're physically attached to the shaft. The pivot is the shaft
  // center, not the plate group center, so we compute the vertical displacement with
  // basic trig: dy = ±PLATE_DIST * sin(θ).
  // Left plates sit left of center → they go DOWN when shaft tilts left (-θ).
  // Right plates sit right of center → they go UP.
  const leftPlatesStyle = useAnimatedStyle(() => {
    const rad = (shaftRotation.value * Math.PI) / 180;
    return {
      transform: [
        { translateX: leftPlatesX.value },
        { translateY: -PLATE_DIST * Math.sin(rad) },
        { rotate: `${shaftRotation.value}deg` },
      ],
    };
  });

  const rightPlatesStyle = useAnimatedStyle(() => {
    const rad = (shaftRotation.value * Math.PI) / 180;
    return {
      transform: [
        { translateX: rightPlatesX.value },
        { translateY: PLATE_DIST * Math.sin(rad) },
        { rotate: `${shaftRotation.value}deg` },
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.barbellRow}>
        {/* Shaft spans full width including overhang past the plates */}
        <Animated.View style={[styles.shaft, shaftStyle]} />

        {/* Left plates slide in from the left, inset by OVERHANG */}
        <Animated.View
          style={[styles.platesGroup, styles.leftPlates, leftPlatesStyle]}
        >
          <View style={[styles.plate, styles.outerPlate]} />
          <View style={[styles.plate, styles.innerPlate]} />
        </Animated.View>

        {/* Right plates slide in from the right, inset by OVERHANG */}
        <Animated.View
          style={[styles.platesGroup, styles.rightPlates, rightPlatesStyle]}
        >
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

// Barbell dimensions
const OVERHANG = 6; // shaft visible past the outer plates on each end
const ROW_H = 52;
const SHAFT_H = 3;
const OUTER_PLATE_W = 14;
const INNER_PLATE_W = 10;
const PLATE_GAP = 2;
const PLATES_GROUP_W = OUTER_PLATE_W + PLATE_GAP + INNER_PLATE_W;
const SHAFT_CENTER_W = 165; // visible shaft between the two plate groups
const TOTAL_W = OVERHANG * 2 + PLATES_GROUP_W * 2 + SHAFT_CENTER_W;
// Horizontal distance from shaft center to each plate group center.
// Used to compute vertical displacement when the shaft rotates.
const PLATE_DIST = TOTAL_W / 2 - (OVERHANG + PLATES_GROUP_W / 2);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  barbellRow: {
    width: TOTAL_W,
    height: ROW_H,
  },
  shaft: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (ROW_H - SHAFT_H) / 2,
    height: SHAFT_H,
    backgroundColor: '#454dcc',
    // Glow — the shaft is the light source
    shadowColor: '#454dcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  platesGroup: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: PLATE_GAP,
  },
  leftPlates: {
    left: OVERHANG,
  },
  rightPlates: {
    right: OVERHANG,
  },
  plate: {
    // Cool chrome steel — blue-shifted from warm gray to feel lit by the neon shaft
    backgroundColor: '#9898B4',
    borderRadius: 2,
  },
  outerPlate: {
    width: OUTER_PLATE_W,
    height: 52,
  },
  innerPlate: {
    width: INNER_PLATE_W,
    height: 40,
    // Slightly darker — recessed behind the outer plate
    backgroundColor: '#7878A0',
  },
  logoText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 6,
    color: '#454dcc',
    textShadowColor: '#454dcc',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
