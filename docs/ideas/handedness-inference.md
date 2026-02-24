# Idea: Automatic Handedness Inference for FloatingActions

**Status:** Parked — not yet planned
**Related:** `FloatingActions` component, `settings-store.ts`

---

## Problem

There is no OS-level API on iOS or Android that exposes whether a user has configured
their device for left-handed use. Apps that want to optimize thumb-zone placement have to
either default to one side (right, since that's the majority) or ask the user explicitly.

Our current solution — a manual position picker in Profile → Preferences — is correct, but
most users won't discover or configure it. A smarter default would get more people into the
right ergonomic position without any friction.

---

## Idea

Passively observe where on the screen the user naturally taps during normal app use. After
enough data points, infer likely handedness and surface a one-time suggestion to reposition
the floating controls.

No server. No permissions. No prompt until there's enough signal to be confident.

---

## How It Would Work

### 1. Tap Collection

Instrument a small set of high-frequency interactions — feed scroll taps, workout card
presses, like/react actions — to capture the raw x-coordinate of each touch event.

Store these locally (AsyncStorage or the existing settings store) as a rolling window of
the last N events (suggested: 30). Older events drop off automatically.

```ts
type TapSample = { x: number; screenWidth: number };
// stored as normalised ratio: x / screenWidth (0.0 = left edge, 1.0 = right edge)
```

Normalising to a ratio makes it device-width agnostic.

### 2. Inference

Once the window reaches a minimum threshold (suggested: 20 samples), compute the mean
normalised x position across all samples.

```
mean < 0.4  →  likely left-handed
mean > 0.6  →  likely right-handed
0.4–0.6     →  ambiguous, do nothing
```

The threshold is intentionally wide to avoid false positives on centred UI (tab bars,
centred buttons, etc.) which would pull the mean toward 0.5.

### 3. Suggestion

When inference crosses a threshold **and** the current `floatingActionPosition` is on the
opposite side, surface a single non-blocking prompt — a bottom sheet or inline banner, not
a modal alert:

> *"Looks like you might be left-handed. Move the action buttons to the left?"*
> **Move them** · **Keep right**

Either choice records the preference and permanently suppresses the prompt. No re-asking.

### 4. Reset

Tapping the position selector in Profile → Preferences manually resets inference state.
If the user explicitly picks a side, we stop collecting and stop suggesting — they've
already expressed their preference.

---

## Data Flow

```
User tap event
  → capture normalised x
  → append to rolling window (AsyncStorage)
  → if window.length >= 20: run inference
      → if confident + current position is wrong side: show suggestion
          → user accepts: update floatingActionPosition, clear window, suppress
          → user declines: suppress, stop collecting
```

---

## Implementation Sketch

### Store additions (`settings-store.ts`)

```ts
tapSamples: number[];           // normalised x values, rolling window of 30
inferenceSuppressed: boolean;   // true after user responds to the prompt
addTapSample: (normX: number) => void;
suppressInference: () => void;
inferredHandedness: () => 'left' | 'right' | 'ambiguous';
```

### Hook (`lib/hooks/use-handedness-inference.ts`)

```ts
export function useHandednessInference() {
  const { tapSamples, floatingActionPosition, addTapSample, ... } = useSettingsStore();

  const recordTap = useCallback((evt: GestureResponderEvent) => {
    const normX = evt.nativeEvent.pageX / Dimensions.get('window').width;
    addTapSample(normX);
  }, []);

  // Returns a suggestion if inference is confident and contradicts current position.
  // Returns null otherwise.
  const suggestion = useMemo(() => { ... }, [tapSamples, floatingActionPosition]);

  return { recordTap, suggestion };
}
```

### Instrumentation

Wrap the feed's `FlatList` `onScrollBeginDrag` and high-frequency `Pressable` `onPress`
handlers with `recordTap`. Avoid instrumenting navigation or form interactions — those are
centred and would add noise.

---

## Open Questions

- **Minimum sample size** — 20 is a guess. May need tuning in practice.
- **Threshold sensitivity** — 0.4/0.6 cutoffs may need adjustment for tablets or landscape.
- **Prompt timing** — should the suggestion fire immediately on threshold cross, or wait
  until the user is on the feed (not mid-workout)?
- **Privacy framing** — inference is entirely on-device, but should we mention it in a
  privacy policy or settings description?
- **Multi-hand users** — some people switch hands. A rolling window naturally adapts over
  time if we don't suppress after the first suggestion.

---

## Why Not Do It Now

The manual setting already covers the use case. This is a quality-of-life improvement with
meaningful instrumentation overhead. Worth revisiting once FloatingActions is proven out
and actively used across more screens.
