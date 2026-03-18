import { useEffect } from 'react';
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

// Power-on completes at ~700ms — tagline can fade in after.
export const LOGO_TEXT_DELAY = 700;

// Neon tube color — same hue as brand accent (#454dcc) but luminous enough
// to read as a glowing glass tube.
const NEON = '#7B86FF';

// Each blur layer: { stdDeviation, opacity }
// Wide ambient halo → medium tube warmth → tight hot edge → sharp core stroke
const GLOW_LAYERS = [
  { std: 14, opacity: 0.35 },
  { std: 6, opacity: 0.6 },
  { std: 2.5, opacity: 0.85 },
];

const SVG_W = 300;
const SVG_H = 100;
const FONT_SIZE = 46;
const STROKE_WIDTH = 1.5; // the "tube" wall thickness

const TEXT_BASE = {
  x: SVG_W / 2,
  y: SVG_H * 0.72,
  textAnchor: 'middle' as const,
  fontSize: FONT_SIZE,
  fontWeight: '700' as const,
  letterSpacing: 6,
  // No fill — the stroke IS the neon tube
  fill: 'none',
};

type Props = {
  onAnimationComplete?: () => void;
  /** When false, renders the final static state with no animation. */
  animate?: boolean;
  /**
   * Neon tube color. Use a bright, saturated color — dark colors won't read
   * as neon. Defaults to the brand accent in its lit-up luminous form.
   */
  color?: string;
};

/**
 * "IBB LOG" as a neon sign: stroke-only SVG text (no fill) so each glyph
 * reads as a glowing glass tube, not a filled solid shape.
 *
 * Four stacked SVG Text layers share the same position:
 *   1–3  Blurred stroke copies — wide halo → mid warmth → tight edge glow
 *   4    Sharp stroke on top — the crisp neon tube wall
 *
 * Each blur layer uses a dedicated <Filter> so stdDeviation and opacity can
 * be tuned independently. Filter regions are oversized (-100%/300%) to ensure
 * the blur never gets clipped at the element boundary.
 *
 * Animation: deliberate power-on ramp (50% → 100%) — no flicker, no bounce.
 */
export function NeonSignLogo({
  onAnimationComplete,
  animate = true,
  color = NEON,
}: Props) {
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;

    opacity.value = withDelay(
      100,
      withSequence(
        withTiming(0.5, { duration: 380, easing: EASE }),
        withTiming(1, { duration: 280, easing: EASE }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={containerStyle}>
      <Svg width={SVG_W} height={SVG_H}>
        <Defs>
          {GLOW_LAYERS.map(({ std }, i) => (
            <Filter
              key={i}
              id={`g${i}`}
              // Oversized region so the blur is never clipped
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
        {GLOW_LAYERS.map(({ opacity: layerOpacity }, i) => (
          <SvgText
            key={i}
            {...TEXT_BASE}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            opacity={layerOpacity}
            filter={`url(#g${i})`}
          >
            IBB LOG
          </SvgText>
        ))}

        {/* Sharp core stroke on top — the crisp neon tube wall */}
        <SvgText
          {...TEXT_BASE}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          opacity={1}
        >
          IBB LOG
        </SvgText>
      </Svg>
    </Animated.View>
  );
}
