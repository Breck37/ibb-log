# IBB Log — Neon Forge Theme

## Core Mood

Underground training lab.
Disciplined.
Industrial.
Controlled intensity.
Not flashy.
Not gamer.
Premium cyber-industrial restraint.

## Color System

Background: #0B0D12
Surface: #141821
Primary Text: #FFFFFF
Secondary Text: #A1A1AA
Primary Accent (Neon): #454dcc
Secondary Accent (Rare): #7C3AED

Neon Rule:

- Accent only.
- Max 10% of screen glowing.
- No constant glow.
- Glow only on interaction, achievement, focus.

## Visual Language

- Dark matte surfaces.
- Slight inner shadow on cards.
- Subtle edge highlights.
- Strong contrast typography.
- Generous spacing.
- No gradients unless extremely subtle.
- No glassmorphism.
- No playful bounce UI.

## Typography

Primary: Inter / Satoshi / similar geometric sans
Weights:

- Bold for headers
- Medium for labels
- Regular for body

Tracking slightly increased for headers.

## Tone

Serious.
Focused.
Disciplined.
Minimal hype.

## Neon Glow System

The neon glow is the signature interaction signal of this app. It is not decoration — it is
the surface responding to the user. Think: a forge heating up when touched.

### The effect

A two-part system that fires together:

1. **Border lights up** — the element's border transitions from a near-invisible dark ring to
   the neon accent color (`#454dcc`). The border itself becomes the light source.
2. **Outer halo spreads** — a diffuse shadow radiates outward from the border, growing in
   both opacity and radius. The element appears to emit light.

These always animate together from a single progress value (0 → 1). They are never split.

### When to use it

- Press / tap (primary signal)
- Focus (form inputs, selectable items)
- Achievement unlock or milestone
- Active / selected state

Never on idle, never ambient, never decorative.

### Technical approach (React Native)

Use a single `glowProgress` shared value (0–1) to drive both simultaneously:

```ts
const glowStyle = useAnimatedStyle(() => ({
  borderColor: interpolateColor(glowProgress.value, [0, 1], ['#1E2235', '#454dcc']),
  shadowColor: '#454dcc',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: glowProgress.value * 0.9,
  shadowRadius: 8 + glowProgress.value * 8,
}));
```

Trigger:

```ts
onPressIn: glowProgress.value = withTiming(1, { duration: 150 })
onPressOut: glowProgress.value = withTiming(0, { duration: 200 })
```

### What it applies to

This system is the default for any interactive surface: buttons, cards, list rows, form
inputs, action sheets, badges. If a surface is pressable or selectable, this is how it
signals that state. Use it consistently — the glow is the design language, not a component
trick.

---

## Navigation Patterns

### FloatingActions

`FloatingActions` is the standard for all contextual screen actions (back, dismiss, confirm, etc.).

Rules:

- Never use native header buttons for contextual navigation actions.
- 1–3 actions max, rendered as a vertical column of circular buttons.
- Position is user-controlled via the settings store (default: `bottom-right`).
- The component reads its position from the Zustand settings store — no prop threading needed.

Styling:

- Background: `forge-surface` (`#141821`)
- Resting border: `#1E2235` (near-invisible dark ring)
- Size: 56×56px circular buttons, 12px gap between them
- On press: full neon glow system fires (border + halo)
- Entrance: slides in from nearest edge + fade, 300ms, cubic-bezier(0.25, 0.8, 0.25, 1)

Usage:

```tsx
<FloatingActions
  actions={[
    { icon: 'arrow-back', onPress: router.back, label: 'Back' },
    { icon: 'add', onPress: handleCreate, label: 'Create', variant: 'primary' },
  ]}
/>
```
