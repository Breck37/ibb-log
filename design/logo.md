# IBB Log — Programmatic Logo

## Overview

The IBB Log logo is built entirely from React Native `View` primitives — no image asset,
no SVG. The component lives at `components/BarbellLogo.tsx`.

## Shape: Horizontal Barbell

```
 ██ ▓  ─────────────────────────  ▓ ██
         I B B   L O G
```

### Shaft

| Property | Value     |
| -------- | --------- |
| Width    | 160px     |
| Height   | 3px       |
| Color    | `#A1A1AA` |

### Plates (each side, inner → outer)

| Element            | Width | Height | Color     |
| ------------------ | ----- | ------ | --------- |
| Inner plate        | 10px  | 40px   | `#E4E4E7` |
| Outer plate        | 14px  | 52px   | `#E4E4E7` |
| Gap between plates | 2px   | —      | —         |

The outer plate is tallest, giving the stacked-disc silhouette.

### "IBB LOG" Label

| Property          | Value     |
| ----------------- | --------- |
| Font size         | 13px      |
| Font weight       | 600       |
| Letter spacing    | 6px       |
| Color             | `#A1A1AA` |
| Gap below barbell | 16px      |

---

## Animation Sequence

Implemented in `BarbellLogo.tsx` using `react-native-reanimated`.

| Step | Element        | Animation                            | Duration | Start offset | Easing                     |
| ---- | -------------- | ------------------------------------ | -------- | ------------ | -------------------------- |
| 1    | Shaft          | `scaleX` 0 → 1 + `translateY` 8 → 0  | 200ms    | 0ms          | bezier(0.25, 0.8, 0.25, 1) |
| 2    | Plates         | `translateX` ±64 → 0 (slide outward) | 200ms    | 200ms        | bezier(0.25, 0.8, 0.25, 1) |
| 3    | "IBB LOG" text | `opacity` 0 → 1                      | 200ms    | 400ms        | bezier(0.25, 0.8, 0.25, 1) |
| 4    | Red scan line  | `translateY` 0 → 52px, then fade out | 150ms    | 600ms        | linear                     |

Total duration: ~830ms.

### Scan Line

- Color: `#ef4444` with red `shadowColor` glow
- Height: 2px, full width of barbell row
- Positioned absolutely inside the barbell row
- Fades out (80ms) immediately after reaching the bottom

---

## Future Asset Replacement

When a vector or raster logo asset is created:

1. Replace the `BarbellLogo` component internals with an `<Image>` or `<Svg>` render
2. Keep the same `onAnimationComplete` prop API — the landing screen depends on it
3. Preserve the 4-step animation sequence defined in `motion.md`
4. Match these exact dimensions to avoid layout shifts on the landing screen
