# App Store Launch Checklist

Everything that must be done before IBB Log can be submitted to the App Store. Work through these phases in order — each phase unblocks the next.

---

## Phase 1: Code Fixes (unblocks everything else)

These must ship before any production build.

- [x] Remove debug `console.log` statements (`lib/hooks/use-groups.ts`) — PR #64
- [x] Fix posts being duplicated — PR #43
- [ ] Fix header titles / duplicate screen titles
- [ ] Fix settings icon overlap
- [ ] Fix profile loading states
- [ ] Group Settings screen — implement basic settings or remove navigation to it (currently shows "coming soon" placeholder)

---

## Phase 2: Privacy Policy

Apple requires a publicly accessible privacy policy URL before you can submit.

### What to cover in the policy

The app collects the following — all must be disclosed:

- Email address and display name (account)
- Workout data (title, duration, images)
- Group membership and activity
- Push notification tokens
- Camera, photo library, and microphone access

### How to host it (pick one)

- **Notion** — write the policy, publish the page publicly, copy the URL. Fastest option.
- **GitHub Pages** — create a `privacy.md` in a public repo, enable Pages under repo Settings. URL: `yourusername.github.io/repo-name`
- **Your own domain** — host a static HTML page at e.g. `yourdomain.com/privacy`

Use a generator to get a solid starting draft: [app-privacy-policy-generator.nisrulz.com](https://app-privacy-policy-generator.nisrulz.com)

### Checklist

- [ ] Draft privacy policy (use generator as a base, customize for the app's data)
- [ ] Host it at a public URL
- [ ] Add the URL to App Store Connect → App Information → Privacy Policy URL

---

## Phase 3: App Store Connect Setup

Do this in App Store Connect at [appstoreconnect.apple.com](https://appstoreconnect.apple.com).

### Age / Content Rating

- [ ] Go to your app → App Information → Age Rating → Edit
- [ ] Complete the content questionnaire (IBB Log will land at **4+** — no violence, no adult content)
- [ ] Save

### App Metadata (required for submission, not just TestFlight)

- [ ] App name: **IBB Log**
- [ ] Subtitle (30 chars max): e.g. "Group workout accountability"
- [ ] Description (up to 4000 chars): explain what the app does
- [ ] Keywords (100 chars): e.g. "workout,fitness,accountability,group,log,gym"
- [ ] Support URL
- [ ] Privacy Policy URL (from Phase 2)
- [ ] Category: **Health & Fitness**

### Screenshots (required for App Store — not TestFlight)

Apple requires screenshots for every device size you claim to support. Minimum: iPhone 6.9" (Pro Max) and iPhone 6.5".

- [ ] Capture screenshots for iPhone 6.9" display (iPhone 16 Pro Max or simulator)
- [ ] Capture screenshots for iPhone 6.5" display (iPhone 11 Pro Max / 12 Pro Max or simulator)
- [ ] Upload to App Store Connect

### Review Notes

- [ ] Create a demo account Apple reviewers can use to log in and test the app
- [ ] Add demo credentials + any setup notes in the "Notes for App Review" field

---

## Phase 4: Apple Developer Portal

- [ ] Log in to [developer.apple.com](https://developer.apple.com)
- [ ] Confirm App ID `com.bdotdev.ibblog` is registered under Identifiers
- [ ] Enable **Push Notifications** capability on the App ID
- [ ] Enable **Associated Domains** capability (needed for deep link invites)
- [ ] Create an APNs Key:
  - Keys → (+) New Key → enable "Apple Push Notifications service (APNs)"
  - Download the `.p8` file — you only get one chance
  - Note the Key ID and Team ID
  - Upload the key to Supabase (Dashboard → Edge Functions or your push service)

---

## Phase 5: Push Notifications

Push notifications are a core feature (weekly reports, achievement milestones, chat). The APNs key from Phase 4 is a prerequisite.

- [ ] `expo-notifications` is already installed — wire up token registration in the app
- [ ] Store push tokens per user in Supabase on sign-in
- [ ] Add `expo-notifications` plugin to `app.json` (the plugin sets the `aps-environment` entitlement automatically):

  ```json
  [
    "expo-notifications",
    { "icon": "./assets/images/notification-icon.png", "color": "#ffffff" }
  ]
  ```

- [ ] Test that a push notification can be sent and received on a physical device
- [ ] Upload APNs key to EAS: `eas credentials`

---

## Phase 6: Build & Submit

### Environment secrets (one-time setup)

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "<url>" --scope project
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<key>" --scope project
```

### Build

```bash
eas build --platform ios --profile production
```

- First run: EAS will prompt for Apple credentials — select "Let Expo manage" for certs/provisioning
- Build takes ~15–30 min on EAS servers

### Submit to TestFlight

```bash
eas submit --platform ios --latest
```

Or combine build + submit:

```bash
eas build --platform ios --profile production --auto-submit
```

### TestFlight checklist

- [ ] Build appears in App Store Connect → TestFlight (~10–30 min after upload)
- [ ] Fill in "What to Test" notes
- [ ] Confirm encryption compliance (select "No" — `ITSAppUsesNonExemptEncryption` is already `false` in `app.json`)
- [ ] Add internal testers (up to 100, no review required)
- [ ] For external testers: create a group, add testers, submit for Beta App Review (24–48 hrs first time)

---

## Phase 7: App Store Submission

Once TestFlight testing is stable:

- [ ] All Phase 1–6 checklist items complete
- [ ] Screenshots uploaded (Phase 3)
- [ ] All metadata filled in (Phase 3)
- [ ] Select the build to submit in App Store Connect → iOS App
- [ ] Submit for App Review
- [ ] Respond to any reviewer questions within 24 hrs to avoid rejection

> Average App Store review time: 1–3 business days.

---

## Already Done

- App icon, splash screen, adaptive icon — configured in `app.json`
- Bundle ID `com.bdotdev.ibblog` — set
- Apple team ID, ASC App ID — set in `eas.json`
- iOS permission descriptions (camera, photo library, microphone, speech) — set in `app.json`
- `ITSAppUsesNonExemptEncryption: false` — set
- EAS build + submit pipeline — configured
- OTA update channel (`production`) — configured
- Deep link / invite flow — implemented
- Transactional email via Resend SMTP (`noreply@ibb-log.com`) — configured
