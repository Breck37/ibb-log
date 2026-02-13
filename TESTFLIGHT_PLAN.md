# TestFlight Distribution Plan

Step-by-step plan to get IBB Log distributed via EAS Build and available on TestFlight.

## Prerequisites

- [x] Active Apple Developer account ($99/year)
- [x] EAS CLI installed (`pnpm add -g eas-cli`)
- [x] Logged into EAS (`eas login`)
- [ ] Logged into Apple Developer via EAS (`eas credentials`)

## Current State

- **EAS Project ID**: `5bf887e1-ee59-4416-b443-8cfc8a7e4896`
- **Bundle Identifier**: `com.ibblog.app`
- **Owner**: `bdotdev`
- **Expo SDK**: 54
- **eas.json**: Has `development`, `preview`, and `production` profiles configured
- **iOS entitlements**: Exist but empty (no capabilities enabled yet)

---

## Step 1: Apple Developer Portal Setup

1. Log in to [Apple Developer](https://developer.apple.com)
2. Register the App ID `com.ibblog.app` under Identifiers (if not already done via EAS)
3. Enable the following capabilities on the App ID:
   - **Push Notifications** (required for the notification features)
   - **Associated Domains** (if deep linking is planned)
4. Create a **Distribution Certificate** (or let EAS manage it — recommended)
5. Create a **Provisioning Profile** for App Store distribution (or let EAS manage it)

> EAS can auto-manage certificates and provisioning profiles. When running your first build, select "Let EAS manage" when prompted. This is the recommended path.

## Step 2: App Store Connect Setup

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app:
   - **Platform**: iOS
   - **Name**: IBB Log (or desired display name)
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: `com.ibblog.app`
   - **SKU**: `ibb-log` (or any unique string)
3. Fill in required metadata (can be placeholder for TestFlight):
   - App description
   - Category: Health & Fitness
   - Privacy Policy URL (required — can use a simple hosted page)
4. No need to fill screenshots/marketing for TestFlight — only required for App Store submission

## Step 3: Configure EAS for iOS-Only Production Builds

Update `eas.json` to add a TestFlight-specific build profile:

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "<your-apple-id-email>",
        "ascAppId": "<app-store-connect-app-id>",
        "appleTeamId": "<your-team-id>"
      }
    }
  }
}
```

## Step 4: Configure Push Notifications (Required Before First Build)

Push notifications are a core feature. Set this up before the first TestFlight build so the entitlements are correct from the start.

1. Install `expo-notifications`:

   ```bash
   pnpm add expo-notifications expo-device expo-constants
   ```

2. Add the plugin to `app.json`:

   ```json
   {
     "expo": {
       "plugins": [
         "expo-router",
         [
           "expo-notifications",
           {
             "icon": "./assets/images/notification-icon.png",
             "color": "#ffffff"
           }
         ]
       ]
     }
   }
   ```

3. The entitlements (`aps-environment`) will be automatically added by the Expo plugin during the EAS build. No manual entitlement editing needed.

4. Create an APNs Key in the Apple Developer Portal:
   - Go to Keys → Create a new key
   - Enable "Apple Push Notifications service (APNs)"
   - Download the `.p8` file (you only get one chance)
   - Note the Key ID and Team ID
   - Upload to Supabase or your push service

## Step 5: Environment Variables & Secrets

1. Set Supabase environment variables for EAS builds:

   ```bash
   eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "<your-supabase-url>" --scope project
   eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<your-anon-key>" --scope project
   ```

2. Verify `.env.local` variables match what the app expects. Ensure `app.json` or a dynamic config (`app.config.ts`) reads from environment variables for production builds.

> Consider migrating `app.json` to `app.config.ts` for dynamic environment variable injection.

## Step 6: Build for TestFlight

Run the production build:

```bash
eas build --platform ios --profile production
```

- EAS will prompt for Apple credentials on first run
- Select "Let Expo manage" for certificates/provisioning
- Build takes ~15-30 minutes on EAS servers
- You'll get a link to the build when complete

## Step 7: Submit to TestFlight

Option A — Submit via EAS (recommended):

```bash
eas submit --platform ios --latest
```

Option B — Submit during build:

```bash
eas build --platform ios --profile production --auto-submit
```

This uploads the `.ipa` to App Store Connect automatically.

## Step 8: TestFlight Configuration

1. In App Store Connect → TestFlight:
   - The build will appear after Apple processes it (~10-30 minutes)
   - Fill in "What to Test" notes
   - Add compliance information (select "No" for encryption since `ITSAppUsesNonExemptEncryption` is already `false`)
2. **Internal Testing** (up to 100 Apple Developer team members):
   - Add testers by Apple ID email
   - No review required — available immediately after processing
3. **External Testing** (up to 10,000 testers):
   - Create a test group
   - Add testers by email
   - Requires Apple's Beta App Review (usually 24-48 hours first time)

## Step 9: OTA Updates (Post-Initial Distribution)

For non-native code changes (JS/TS, styles, assets), use EAS Update to skip full rebuilds:

```bash
eas update --branch production --message "description of changes"
```

Configure the update channel in `eas.json`:

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  }
}
```

> **When you DO need a full rebuild**: Adding/removing native modules (e.g., `expo-notifications`), changing `app.json` native config, updating Expo SDK version.

## Step 10: Ongoing TestFlight Workflow

```
Code change → Push to main → Run EAS Build (if native changes) or EAS Update (if JS-only)
                                    ↓
                           Auto-submit to TestFlight
                                    ↓
                           Testers get notified of new build
```

Consider setting up GitHub Actions to automate this:

```yaml
# .github/workflows/testflight.yml (example structure)
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: pnpm install
      - run: eas build --platform ios --profile production --non-interactive --auto-submit
```

---

## Checklist Summary

1. [ ] Apple Developer account active
2. [ ] App ID registered with Push Notifications capability
3. [ ] App created in App Store Connect
4. [ ] `eas.json` updated with submit config
5. [ ] `expo-notifications` installed and configured
6. [ ] APNs key created and stored
7. [ ] Environment secrets set in EAS
8. [ ] First `eas build --platform ios --profile production` succeeds
9. [ ] First `eas submit --platform ios` succeeds
10. [ ] Build appears in TestFlight
11. [ ] Internal testers added and can install
12. [ ] OTA update channel configured
