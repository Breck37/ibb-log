# Biometric Auth (Face ID / Touch ID)

**Status:** Active — in implementation
**Packages needed:** `expo-local-authentication`, `expo-secure-store`

---

## Problem

The current login form requires email + password on every session expiry. For a beta audience
of friends, re-entering credentials is friction that gets in the way of the habit we're
trying to build. Supabase already persists the session, but the session will eventually
expire and the user lands back at the login screen.

Face ID / Touch ID solves this invisibly — the user just opens the app and it works.

---

## How It Works

Biometrics here is a **lock gate**, not a re-auth mechanism. The Supabase session is still
the source of truth.

```
App opens
  ├─ No session → show login form (normal)
  └─ Session exists
       ├─ biometricEnabled = false → enter app immediately
       └─ biometricEnabled = true  → show biometric lock screen
            ├─ Biometric success → enter app
            └─ Biometric fail/cancel → "Sign in with password" fallback
```

No credentials are stored locally. Biometrics unlocks an already-valid Supabase session.

---

## User Flow

### First-time setup
1. User signs in with email + password as normal
2. After successful login, bottom sheet appears:
   > "Enable Face ID for faster access?"
   > **Enable** · **Not now**
3. If enabled: immediately trigger a biometric confirmation to verify it works → save flag

### Returning user (biometric enabled)
1. App opens → biometric lock screen appears instantly
2. Face ID scans automatically (or prompt appears for Touch ID)
3. Success → app unlocks, user is in the feed
4. Failure/cancel → "Use password instead" button → regular login form

### Disabling
Profile → Preferences → Security → "Face ID" toggle → requires one biometric confirmation to turn off

---

## Implementation

### New packages
```
expo-local-authentication  — triggers Face ID / Touch ID / fingerprint
expo-secure-store          — stores the biometricEnabled flag securely on-device
```

Note: `expo-secure-store` is preferred over the existing settings store (AsyncStorage)
for this flag because it's encrypted at rest and tied to the device keychain.

### Store changes (`lib/stores/settings-store.ts`)
```ts
biometricEnabled: boolean;
setBiometricEnabled: (val: boolean) => void;
```

### Auth provider changes (`providers/auth-provider.tsx`)
```ts
// New context additions
isAppLocked: boolean;
unlockWithBiometrics: () => Promise<boolean>;
```

Logic:
- On session load, if `biometricEnabled && session`, set `isAppLocked = true`
- `unlockWithBiometrics` calls `LocalAuthentication.authenticateAsync()` → on success, sets `isAppLocked = false`

### New screen (`components/BiometricLockScreen.tsx`)
Full-screen overlay rendered in `app/_layout.tsx` when `isAppLocked` is true.

```
┌─────────────────────────┐
│                         │
│     IBB Log             │
│                         │
│    [Face ID icon]       │
│  Touch to unlock        │
│                         │
│  Use password instead   │
└─────────────────────────┘
```

Neon glow fires on the icon when biometric prompt appears. No bounce, no animation excess.

### Sign-in screen
If `biometricEnabled` is true AND we detect there's a restorable session (check
`supabase.auth.getSession()`), show a Face ID shortcut button on the login form as an
alternative to typing credentials.

### Profile preferences
New **Security** row in Preferences section:
```
Security
[Face ID]  ──────────────────────  ●  (toggle)
```

---

## Device support
`LocalAuthentication.hasHardwareAsync()` — checks if device supports biometrics
`LocalAuthentication.isEnrolledAsync()` — checks if user has biometrics set up

If neither is true, hide the toggle entirely.

---

## Open Questions
- Should we lock the app on every foreground resume, or just on cold start?
  - Cold start only is less intrusive for quick background/foreground switches
  - Could make this configurable (always/on cold start)
- Android: fingerprint only, or support pattern/PIN fallback?
  - `authenticateAsync({ disableDeviceFallback: false })` enables device PIN as fallback
