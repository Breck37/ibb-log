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
- Border: subtle `forge-border` ring (`#1E2235`)
- Size: 56×56px circular buttons, 12px gap between them
- Glow: neon accent (`#454dcc`) shadow on press only — no constant glow
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
