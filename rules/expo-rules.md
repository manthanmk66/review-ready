# Expo / React Native — Submission Compliance Rules

**Purpose:** Bridges Apple/Google guideline rules to the actual files Expo developers edit.
**Scope:** Expo SDK 50+, EAS Build, Expo Router, bare workflow.

Use this alongside `ios-guidelines.md` and `android-guidelines.md` — those define WHAT each store requires; this file defines WHERE to check in an Expo project.

---

## Files the scanner must inspect

| File | What it controls | Why it matters |
|------|------------------|----------------|
| `app.json` / `app.config.js` / `app.config.ts` | All Expo config; generates iOS Info.plist + Android Manifest at build time | Primary source of truth for permissions, metadata, bundle IDs |
| `eas.json` | EAS Build profiles, env vars, distribution channels | Controls iOS provisioning, Android signing, build types |
| `package.json` | Dependencies, scripts, SDK version | Detects SDKs that trigger rules (analytics, IAP, tracking) |
| `ios/<project>/Info.plist` | Native iOS config (bare workflow or after prebuild) | Permission usage strings, ATT, encryption |
| `ios/<project>/PrivacyInfo.xcprivacy` | Required Reason API declarations | REQUIRED by Apple since May 2024 |
| `android/app/src/main/AndroidManifest.xml` | Native Android config | Permissions, foreground services, exported components |
| `android/app/build.gradle` | Android build config | targetSdk, minSdk, versionCode |
| `.env*` / `EAS_SECRET_*` | Credentials | Must not commit; must not embed in client bundle |
| `assets/` | Icons, splash, images | Icon size, no transparency for Android, asset compliance |

---

## SECTION A — `app.json` / `app.config.*` Top-Level Checks

### A.1 Bundle identifiers
**Check:** `ios.bundleIdentifier` and `android.package` are set and follow reverse-DNS.
**Fail:** Missing → EAS Build fails. Generic placeholder (`com.example.myapp`) → suspicious to reviewers.
**Fix:** Use real reverse-DNS like `com.yourcompany.appname`.

### A.2 Version + Build number
**Check:** `version` (semver), `ios.buildNumber` (string, monotonic), `android.versionCode` (integer, monotonic).
**Fail:** App Store Connect rejects identical build numbers; Play Console rejects identical versionCodes.
**Fix:** Bump both before every submission. Use EAS auto-increment.

### A.3 App name length
**Check:** `name` length ≤ 30 chars (Play Store hard limit).
**Fail:** Truncated in store listings.
**Fix:** Keep under 30; localize for store metadata.

### A.4 Display name with branding
**Check:** App name doesn't contain "Free", "Best", emojis, ranks, or competitor names.
**Fail:** Play Store rejection 6.2; Apple rejection 2.3 metadata.
**Fix:** Use plain product name.

### A.5 Privacy policy URL
**Check:** `extra.privacyPolicyUrl` set OR linked from App Store Connect / Play Console.
**Fail:** Apple 5.1.1(i), Google Privacy policy required for any app collecting data.
**Fix:** Host a privacy policy; link it in store listings and in-app Settings.

### A.6 Account deletion (Apple 5.1.1(v) + Google requirement)
**Check:** App with account creation must offer in-app delete + web URL for deletion.
**Fail:** Apple rejection 5.1.1(v); Google requires deletion URL in Play Console.
**Fix:** Add `Delete Account` action under Profile/Settings; expose `/delete-account` web URL.

---

## SECTION B — iOS (`app.json > ios.*` + `Info.plist`)

### B.1 Permission usage strings
**Required keys when feature used (in `ios.infoPlist`):**

| Feature | Key | Apple Guideline |
|---------|-----|-----------------|
| Camera | `NSCameraUsageDescription` | 5.1.1 |
| Photo library | `NSPhotoLibraryUsageDescription` | 5.1.1 |
| Photo add-only | `NSPhotoLibraryAddUsageDescription` | 5.1.1 |
| Microphone | `NSMicrophoneUsageDescription` | 5.1.1 |
| Location when in use | `NSLocationWhenInUseUsageDescription` | 5.1.1, 5.1.5 |
| Location always | `NSLocationAlwaysAndWhenInUseUsageDescription` | 5.1.1, 5.1.5 |
| Contacts | `NSContactsUsageDescription` | 5.1.1 |
| Calendar | `NSCalendarsUsageDescription` | 5.1.1 |
| Reminders | `NSRemindersUsageDescription` | 5.1.1 |
| Bluetooth | `NSBluetoothAlwaysUsageDescription` | 5.1.1 |
| Local Network | `NSLocalNetworkUsageDescription` | 5.1.1 |
| Face ID | `NSFaceIDUsageDescription` | 5.1.1 |
| Speech recognition | `NSSpeechRecognitionUsageDescription` | 5.1.1 |
| Motion / fitness | `NSMotionUsageDescription` | 5.1.1 |
| Health read | `NSHealthShareUsageDescription` | 5.1.3 |
| Health write | `NSHealthUpdateUsageDescription` | 5.1.3 |
| App Tracking | `NSUserTrackingUsageDescription` | 5.1.2 |

**Fail patterns:**
- Permission used in code (Expo module like `expo-camera`) but no `Info.plist` string → instant 5.1.1 rejection.
- Generic string ("We need camera access") → reject 5.1.1 — must explain *purpose*.

**Fix:** Add explicit, purpose-driven strings to `ios.infoPlist`:
```json
"ios": {
  "infoPlist": {
    "NSCameraUsageDescription": "ReviewReady uses your camera to scan QR codes for product authentication."
  }
}
```

### B.2 App Tracking Transparency (ATT)
**Check:** If `react-native-tracking-transparency`, `expo-tracking-transparency`, AdMob, Facebook SDK, Branch, AppsFlyer, Adjust, or any IDFA-using SDK is in `package.json`:
- `NSUserTrackingUsageDescription` MUST be set
- ATT prompt MUST be shown before tracking starts
- Cannot collect IDFA before user accepts

**Fail:** Apple 5.1.2 — most common 2024-2026 rejection.
**Fix:** Add `expo-tracking-transparency`; gate IDFA-using SDK init behind ATT prompt result.

### B.3 PrivacyInfo.xcprivacy (Required Reason API manifest)
**Check:** File exists at `ios/<project>/PrivacyInfo.xcprivacy` (or configured via `expo-build-properties`).
**Required:** Declare reasons for using:
- `UserDefaults` (NSPrivacyAccessedAPICategoryUserDefaults)
- File timestamp APIs
- System boot time
- Disk space
- Active keyboard list

**Fail:** Apple emails "ITMS-91053: Missing API declaration" — blocks submission.
**Fix:** Generate via `expo-build-properties` plugin or add manually. Most React Native libs use `UserDefaults` → declare reason `CA92.1` (App functionality).

### B.4 Encryption export compliance
**Check:** `ios.config.usesNonExemptEncryption` set to `false` if app only uses standard HTTPS.
**Fail:** App Store Connect blocks submission asking for ERN.
**Fix:** Set in `app.json`:
```json
"ios": {
  "config": { "usesNonExemptEncryption": false }
}
```

### B.5 Sign in with Apple (Apple 4.8)
**Check:** If app offers third-party login (Google, Facebook, Apple ID, etc.) OR proprietary account, must also offer Sign in with Apple as an equivalent option.
**Detect:** `package.json` contains `react-native-google-signin`, `react-native-fbsdk-next`, `expo-auth-session` with Google/Facebook provider, but no `expo-apple-authentication`.
**Fail:** Apple 4.8 rejection — guaranteed.
**Exceptions:** Education apps using student-account systems, enterprise apps, gov apps.
**Fix:** Add `expo-apple-authentication`; show Sign in with Apple button equal-prominence with other providers.

### B.6 Background modes
**Check:** `ios.infoPlist.UIBackgroundModes` array — every entry must correspond to a real feature.
**Common entries + justification:**
- `audio` — audio playback in background (music apps)
- `location` — turn-by-turn navigation only
- `voip` — actual VoIP calling (else rejected)
- `fetch` — periodic content refresh
- `remote-notification` — silent push processing

**Fail:** Apple 2.5.4 — declaring background modes you don't use.
**Fix:** Remove unused modes.

### B.7 In-App Purchase enforcement (Apple 3.1.1)
**Check:** If app sells digital content (subscriptions, coins, premium features, content unlocks), must use `react-native-iap`, `expo-in-app-purchases`, or RevenueCat.
**Fail patterns:**
- Stripe SDK present (`@stripe/stripe-react-native`) used for digital goods → 3.1.1 rejection
- External payment links opened in `expo-web-browser` for upgrades → 3.1.1
- "Subscribe on our website" CTAs in-app → 3.1.1

**Allowed:** Physical goods (e-commerce), services consumed outside the app (rideshare), reader-app exemption (limited).
**Fix:** Replace Stripe with StoreKit; or for reader apps, apply for External Link Account entitlement.

### B.8 Universal Links / Associated Domains
**Check:** If app uses deep links, `ios.associatedDomains` configured AND `apple-app-site-association` file hosted on domain.
**Fail:** Links break post-install → bad UX, sometimes triggers 4.1 design rejection.
**Fix:** Configure both ends.

### B.9 App icon requirements
**Check:** `ios.icon` (or `icon`) is 1024×1024 PNG, no transparency, no alpha channel, no rounded corners (iOS adds them).
**Fail:** App Store Connect rejection at upload.
**Fix:** Export square 1024×1024 RGB PNG.

### B.10 Splash screen
**Check:** `expo-splash-screen` configured; doesn't contain ads, promotional text, or copyright violations.
**Fail:** Apple 4.0 design.

---

## SECTION C — Android (`app.json > android.*` + `AndroidManifest.xml`)

### C.1 Target SDK
**Check:** EAS Build uses Expo SDK ≥ 50, which targets API 34+. As of 2025-08, Play requires API 35 (Android 15) for new apps and updates.
**Detect:** `expo-build-properties` plugin with `android.targetSdkVersion` < 35.
**Fail:** Play Console rejection at upload.
**Fix:** Upgrade Expo SDK or set `targetSdkVersion: 35` via `expo-build-properties`.

### C.2 Permissions
**Check:** `android.permissions` array in `app.json` — must list only permissions actually used.
**Common over-declarations:**
- `READ_EXTERNAL_STORAGE` (deprecated on Android 13+; use `READ_MEDIA_IMAGES`)
- `WRITE_EXTERNAL_STORAGE` (not needed on Android 11+)
- `READ_CONTACTS` (use Contact Picker instead — Play policy update Apr 2026)
- `MANAGE_EXTERNAL_STORAGE` (restricted; needs Play declaration)

**Fail:** Play Store rejection or Data Safety mismatch.
**Fix:** Use `expo-image-picker`'s Photo Picker; remove unused permissions.

### C.3 Restricted permissions (need Play Console declaration)
| Permission | Declaration required |
|------------|----------------------|
| `READ_SMS`, `SEND_SMS`, `RECEIVE_SMS` | SMS/Call Log Declaration |
| `READ_CALL_LOG`, `WRITE_CALL_LOG` | SMS/Call Log Declaration |
| `MANAGE_EXTERNAL_STORAGE` | All Files Access Declaration |
| `ACCESS_BACKGROUND_LOCATION` | Location Declaration |
| `READ_MEDIA_IMAGES` + `READ_MEDIA_VIDEO` (when Photo Picker insufficient) | Photo and Video Permissions Declaration |
| `QUERY_ALL_PACKAGES` | Permission declaration |
| `BIND_ACCESSIBILITY_SERVICE` | Accessibility declaration |
| `READ_HEALTH_DATA_*` | Health Apps Declaration + Verified Org Account |

**Fix:** Either remove the permission or submit the declaration in Play Console.

### C.4 Foreground services
**Check:** If `android.foregroundServices` configured OR a library uses FGS (e.g. `expo-task-manager` for background location, `react-native-track-player` for audio):
- Must declare `foregroundServiceType`
- Must request matching permission (`FOREGROUND_SERVICE_LOCATION`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, etc.)
- Must submit FGS Type Declaration in Play Console with demo video

**Fail:** Play removal April 2026 enforcement.
**Fix:** Use Expo Config Plugin to add type; record demo video.

### C.5 Privacy policy URL
**Check:** Required in Play Console listing if any sensitive data collected.
**Fix:** Add via Play Console; link in-app.

### C.6 Data Safety form (Play Console)
**Check:** Cross-reference manifest permissions + SDK list (Firebase Analytics, Crashlytics, AdMob, Facebook SDK, AppsFlyer, Adjust, Sentry, Mixpanel) against the Data Safety form.
**Common mismatches:**
- Firebase Crashlytics → must declare "Crash logs" collection
- Firebase Analytics → "App interactions", "App version" minimum
- AdMob (with personalized ads) → "Advertising or marketing" purpose + "Device or other IDs"
- Sentry → "Crash logs", "Diagnostics"
- Branch / Adjust / AppsFlyer → "Device or other IDs", advertising purpose

**Fail:** Play Console flag, sometimes suspension.
**Fix:** Update Data Safety form to match actual SDK behavior.

### C.7 Adaptive icon
**Check:** `android.adaptiveIcon.foregroundImage` + `android.adaptiveIcon.backgroundColor` set.
**Fail:** Play Console warning; pre-2018 icon style on Android 8+.
**Fix:** Provide foreground/background layers via Expo config.

### C.8 64-bit support
**Check:** EAS Build defaults include 64-bit ABIs (`arm64-v8a`). If native modules ship only 32-bit, fail.
**Fix:** Use Expo's prebuilt modules; verify with `apkanalyzer` if custom.

### C.9 16 KB page size (May 2026)
**Check:** All native libraries support 16 KB pages (Expo SDK 51+ targets this).
**Fail:** Play Console rejection after May 1, 2026.
**Fix:** Upgrade Expo SDK; rebuild native modules with NDK r27+.

### C.10 Cleartext traffic
**Check:** `android.usesCleartextTraffic` is `false` (default) OR explicitly justified for dev tools.
**Detect:** `app.json` setting; `network_security_config.xml`.
**Fail:** Play data-safety / 4.2 device abuse if exfiltrating data over HTTP.
**Fix:** Use HTTPS only; configure exceptions via NSC for specific dev domains only.

---

## SECTION D — `eas.json` Checks

### D.1 Distribution + buildType
**Check:** `internal` distribution OK for testing; production builds must be `store`.
**Fail:** Wrong AAB/IPA format for store upload.

### D.2 Environment variables in client
**Check:** No secrets in `env` block of EAS profile that's bundled into client (only `EXPO_PUBLIC_*` are bundled, others are build-time only).
**Fail:** Apple 5.6.1 (credentials in client); Google Privacy & deception.
**Fix:** Use `EAS_SECRET_*` for build-time; never bundle API keys with privileged scope.

### D.3 Auto-increment
**Check:** `autoIncrement: true` on production profiles for both `buildNumber` and `versionCode`.
**Fail:** Manual bump forgotten → upload rejected.

---

## SECTION E — `package.json` SDK Detection Map

When these packages are present, trigger specific compliance checks:

| Package | Triggers check for |
|---------|--------------------|
| `react-native-iap`, `expo-in-app-purchases` | iOS 3.1.1 + Android Play Billing |
| `@stripe/stripe-react-native` | iOS 3.1.1 (verify NOT used for digital goods) |
| `expo-tracking-transparency` | iOS 5.1.2 ATT |
| `react-native-google-mobile-ads`, `expo-ads-admob` | iOS 5.1.2 ATT + Android 5.3 ad policy |
| `@react-native-firebase/analytics` | Data Safety form: App interactions |
| `@react-native-firebase/crashlytics` | Data Safety: Crash logs |
| `@sentry/react-native` | Data Safety: Crash logs, Diagnostics |
| `branch-sdk`, `react-native-adjust`, `react-native-appsflyer` | iOS 5.1.2 ATT + Android Data Safety: Device IDs |
| `react-native-google-signin/google-signin` | Apple 4.8 — must offer Sign in with Apple |
| `react-native-fbsdk-next` | Apple 4.8 + iOS 5.1.2 ATT |
| `expo-apple-authentication` | (Required by 4.8 if other 3P login present) |
| `expo-location` | iOS 5.1.5 + Android background-location declaration |
| `expo-task-manager` background location | Android FGS location declaration |
| `expo-notifications` | iOS UNUserNotification opt-in + Android POST_NOTIFICATIONS |
| `expo-camera`, `expo-image-picker` | iOS permission strings + Android Photo Picker preference |
| `expo-contacts` | iOS 5.1.1 + Android Contact Picker (Apr 2026) |
| `expo-health-connect`, `expo-health-kit` | Health Apps Declaration both platforms |
| `react-native-webview` | Apple 4.7 (third-party software), Google minimum-functionality |

---

## SECTION F — Expo-Specific Gotchas

### F.1 Managed vs Bare workflow
Managed: All config in `app.json`; native files generated at build.
Bare: Native files committed; `app.json` partially overridden by `Info.plist` / `AndroidManifest.xml`.

**Scanner behavior:** If `ios/` and `android/` directories exist, prefer native files as source of truth; warn if `app.json` config differs.

### F.2 expo-build-properties plugin
Required for:
- Custom `targetSdkVersion`, `compileSdkVersion`
- Custom `ios.deploymentTarget`
- Privacy manifest generation
- Network security config

### F.3 Config plugins that add permissions silently
Some plugins add permissions to manifest without obvious config:
- `expo-camera` → CAMERA + RECORD_AUDIO
- `expo-location` → ACCESS_FINE_LOCATION + ACCESS_COARSE_LOCATION
- `expo-image-picker` → on iOS: photo library / camera permission strings; on Android: READ_MEDIA_IMAGES
- `expo-notifications` → POST_NOTIFICATIONS
- `expo-contacts` → READ_CONTACTS

**Action:** Run `npx expo prebuild --clean` and inspect generated `Info.plist` + `AndroidManifest.xml` to see the final state.

### F.4 EAS Update + OTA compliance
**Check:** OTA updates via EAS Update cannot change app's primary purpose (Apple 3.3.1, 4.7).
**Fail:** Apple removal if OTA pushes substantively different functionality than reviewed binary.
**Fix:** Use OTA only for content/bug fixes; resubmit binary for feature changes.

### F.5 Production credentials in source
**Check:** No production API keys, Firebase config files with non-public secrets, Stripe live keys in `app.config.js` or committed files.
**Fix:** Use EAS Secrets; runtime config via remote.

---

## SECTION G — App Store Connect / Play Console (Manual Steps Reminder)

These are NOT auto-checkable from the codebase but the plugin should remind the user:

**iOS / App Store Connect:**
- [ ] Privacy "Nutrition Labels" filled accurately
- [ ] Age rating questionnaire matches content
- [ ] Demo account credentials provided for review (if login required)
- [ ] Screenshots show actual app, no placeholder text
- [ ] Encryption Export Compliance (ITSAppUsesNonExemptEncryption answered)
- [ ] Sign-in info for review team in App Review notes

**Android / Play Console:**
- [ ] Data Safety form completed and matches code
- [ ] Privacy Policy URL set
- [ ] Account Deletion URL set
- [ ] Content rating questionnaire completed
- [ ] Target audience and content (children declaration)
- [ ] App access (demo credentials for reviewer)
- [ ] News, Health, Financial, Gambling, Families declarations as applicable
- [ ] Foreground Service Type declarations with demo video

---

## SECTION H — Crash & Quality Pre-Submission Smoke Tests

### H.1 Static signals
- `console.log` calls in production bundle (warning only)
- Unhandled `Promise.reject` without `.catch`
- `Alert.alert` with non-localized hardcoded strings (i18n)
- Force-cast / non-null assertion patterns (`!.`) in TypeScript

### H.2 Build smoke tests
- `eas build` against production profile succeeds
- App launches without crash on cold start (manual / automated test)
- All navigation routes load without error
- Permission flows show correct usage strings
- Login flow works with reviewer's demo account
