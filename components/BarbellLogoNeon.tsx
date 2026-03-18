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
import Svg, {
  Defs,
  FeGaussianBlur,
  Filter,
  Text as SvgText,
} from 'react-native-svg';

const EASE = Easing.bezier(0.25, 0.8, 0.25, 1);

// Animation timing — identical to BarbellLogo
const T_SHAFT = 0;
const T_LEFT_PLATES = 200;
const T_TILT = 450;
const TILT_HOLD = 160;
const STABILIZE_DUR = 260;
const T_RIGHT_PLATES = T_TILT + 280; // 730
const ROCK_ANGLE = 3.5;
const ROCK_1_DUR = 170;
const ROCK_2_DUR = 149;
const ROCK_3_DUR = 110;
const ROCK_SETTLE_DUR = 200;
const ROCK_TOTAL = ROCK_1_DUR + ROCK_2_DUR + ROCK_3_DUR + ROCK_SETTLE_DUR;
const T_TEXT = T_TILT + 280 + TILT_HOLD + STABILIZE_DUR + ROCK_TOTAL + 20;
const TILT_DEGREES = -7;
const SHAFT_RISE = 50;
const PLATE_TRAVEL = 200;

export const LOGO_TEXT_DELAY = T_TEXT;
export const LOGO_ANIMATION_DURATION = T_TEXT + 200 + 50;

// Barbell dimensions — identical to BarbellLogo
const OVERHANG = 6;
const ROW_H = 52;
const SHAFT_H = 3;
const OUTER_PLATE_W = 14;
const INNER_PLATE_W = 10;
const PLATE_GAP = 2;
const PLATES_GROUP_W = OUTER_PLATE_W + PLATE_GAP + INNER_PLATE_W;
const SHAFT_CENTER_W = 165;
const TOTAL_W = OVERHANG * 2 + PLATES_GROUP_W * 2 + SHAFT_CENTER_W;
const PLATE_DIST = TOTAL_W / 2 - (OVERHANG + PLATES_GROUP_W / 2);

// Neon text constants — scaled to match the existing 24px / letterSpacing-6 label
const NEON = '#7B86FF';
const FONT_SIZE = 24;
const LETTER_SPACING = 6;
const STROKE_WIDTH = 1;
const SVG_H = 36; // enough vertical room for the glow blur at this font size

// Three blur layers: wide halo → mid warmth → tight edge
// stdDeviation values proportionally scaled down from the 46px NeonSignLogo
const GLOW_LAYERS = [
  { std: 7, opacity: 0.35 },
  { std: 3, opacity: 0.6 },
  { std: 1.2, opacity: 0.85 },
];

const TEXT_PROPS = {
  x: TOTAL_W / 2,
  y: SVG_H * 0.78,
  textAnchor: 'middle' as const,
  fontSize: FONT_SIZE,
  fontWeight: '600' as const,
  letterSpacing: LETTER_SPACING,
  fill: 'none',
};

type Props = {
  onAnimationComplete?: () => void;
  /** When false, renders the logo in its final static state with no animation. */
  animate?: boolean;
};

export function BarbellLogoNeon({
  onAnimationComplete,
  animate = true,
}: Props) {
  const shaftTranslateY = useSharedValue(animate ? -SHAFT_RISE : 0);
  const shaftOpacity = useSharedValue(animate ? 0 : 1);
  const shaftRotation = useSharedValue(0);
  const leftPlatesX = useSharedValue(animate ? -PLATE_TRAVEL : 0);
  const rightPlatesX = useSharedValue(animate ? PLATE_TRAVEL : 0);
  const textOpacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;

    shaftTranslateY.value = withDelay(
      T_SHAFT,
      withTiming(0, { duration: 200, easing: EASE }),
    );
    shaftOpacity.value = withDelay(
      T_SHAFT,
      withTiming(1, { duration: 180, easing: EASE }),
    );
    leftPlatesX.value = withDelay(
      T_LEFT_PLATES,
      withTiming(0, { duration: 250, easing: EASE }),
    );
    shaftRotation.value = withDelay(
      T_TILT,
      withSequence(
        withTiming(TILT_DEGREES, { duration: 280, easing: EASE }),
        withTiming(TILT_DEGREES, { duration: TILT_HOLD }),
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
    rightPlatesX.value = withDelay(
      T_RIGHT_PLATES,
      withTiming(0, { duration: 250, easing: EASE }),
    );
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
        <Animated.View style={[styles.shaft, shaftStyle]} />
        <Animated.View
          style={[styles.platesGroup, styles.leftPlates, leftPlatesStyle]}
        >
          <View style={[styles.plate, styles.outerPlate]} />
          <View style={[styles.plate, styles.innerPlate]} />
        </Animated.View>
        <Animated.View
          style={[styles.platesGroup, styles.rightPlates, rightPlatesStyle]}
        >
          <View style={[styles.plate, styles.innerPlate]} />
          <View style={[styles.plate, styles.outerPlate]} />
        </Animated.View>
      </View>

      {/* Neon stroke text — same size as original, glow from letter outlines */}
      <Animated.View style={textStyle}>
        <Svg width={TOTAL_W} height={SVG_H}>
          <Defs>
            {GLOW_LAYERS.map(({ std }, i) => (
              <Filter
                key={i}
                id={`nb${i}`}
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <FeGaussianBlur in="SourceGraphic" stdDeviation={std} />
              </Filter>
            ))}
          </Defs>

          {/* Blurred glow layers — wide → tight */}
          {GLOW_LAYERS.map(({ opacity }, i) => (
            <SvgText
              key={i}
              {...TEXT_PROPS}
              stroke={NEON}
              strokeWidth={STROKE_WIDTH}
              opacity={opacity}
              filter={`url(#nb${i})`}
            >
              IBB LOG
            </SvgText>
          ))}

          {/* Sharp core stroke — the crisp neon tube wall */}
          <SvgText
            {...TEXT_PROPS}
            stroke={NEON}
            strokeWidth={STROKE_WIDTH}
            opacity={1}
          >
            IBB LOG
          </SvgText>
        </Svg>
      </Animated.View>
    </View>
  );
}

// StyleSheet required: style values derived from computed JS dimension constants
// and shadow properties used as Reanimated animation targets.
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
    backgroundColor: '#7878A0',
  },
});
