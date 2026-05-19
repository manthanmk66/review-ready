---
name: fix
description: Auto-fixes safe pre-submission compliance issues identified by /review-ready:scan. Adds missing iOS permission usage strings, sets encryption export compliance flag, generates a stub PrivacyInfo.xcprivacy with Required Reason API declarations, adds expo-tracking-transparency when IDFA SDKs are detected, removes over-declared Android permissions, and configures adaptive icon stubs. Use when the user says "fix the issues", "auto-fix", "apply safe fixes", or "fix what you can".
---

# Review Ready — Auto-Fix

You apply **safe, idempotent fixes** for compliance issues that don't require human design or architectural decisions. Use this skill when the user explicitly invokes `/review-ready:fix` or says "fix the issues you found".

## What you WILL auto-fix

| Issue | Fix |
|-------|-----|
| Missing iOS permission usage string for a used capability | Add `NSXxxUsageDescription` to `app.json > ios.infoPlist` with a sensible default the user can refine |
| `ITSAppUsesNonExemptEncryption` not set | Add `ios.config.usesNonExemptEncryption: false` (HTTPS-only apps) — confirm first |
| Missing `expo-tracking-transparency` when IDFA SDK is in `package.json` | Add the package + ATT prompt scaffolding |
| Missing `PrivacyInfo.xcprivacy` | Generate stub with common React Native Required Reason APIs |
| Over-declared `android.permissions` array | Remove unused entries (after grep confirms no usage) |
| Cleartext traffic flag set without justification | Set `android.usesCleartextTraffic: false` |
| Missing adaptive icon background color | Add `android.adaptiveIcon.backgroundColor` from primary icon palette |
| Icon has alpha channel | Flag for user — DO NOT auto-fix (requires asset re-export) |
| Generic permission strings ("We need access") | Replace with specific app-name-derived string — confirm first |

## What you WILL NOT auto-fix

These require human decisions or architectural changes — present recommendations instead:

- IAP migration (Stripe → StoreKit) — architectural
- Adding Sign in with Apple — UI design + provider integration
- Implementing Account Deletion flow — backend + UI work
- Adding ATT prompt invocation — must be placed at correct app lifecycle moment
- Fixing crash-prone patterns (force unwraps, missing error boundaries) — requires code review
- Foreground service type declarations — needs Play Console demo video
- Data Safety form completion — must be done in Play Console UI
- App Store Connect privacy nutrition labels — must be done in App Store Connect UI

For these, output a numbered "Manual work needed" list with specific next steps.

## Workflow

### Step 1 — Check for a recent scan
Look for a scan report in the conversation OR run `/review-ready:scan` first if none exists.

### Step 2 — Filter to auto-fixable items
Take the issue list from the scan. Filter `auto_fixable: true` items.

### Step 3 — Group fixes
Group fixes by file so we make minimum edits:
- All `app.json` changes → one Edit
- All `PrivacyInfo.xcprivacy` changes → one Write
- All `package.json` changes → one Edit + run `npm install`

### Step 4 — Present plan
Show the user what you'll change BEFORE editing. Format:

```
I'll apply 4 safe fixes:

1. Add NSCameraUsageDescription to app.json
   File: app.json
   Adding: "NSCameraUsageDescription": "<AppName> uses your camera to scan QR codes."
   (You can refine this string after — just edit app.json directly)

2. Set encryption export compliance flag
   File: app.json
   Adding: "ios.config.usesNonExemptEncryption": false

3. Generate PrivacyInfo.xcprivacy stub
   File: ios/<project>/PrivacyInfo.xcprivacy (new)
   Adds Required Reason API declarations for UserDefaults, FileTimestamp, SystemBootTime, DiskSpace.

4. Install expo-tracking-transparency
   File: package.json
   Running: npx expo install expo-tracking-transparency
   Note: You still need to call requestTrackingPermissionsAsync() before tracking SDKs initialize.

Proceed? (yes / no / which numbers only)
```

### Step 5 — Apply fixes
Use Edit / Write tools. After each fix:
- Update internal counter
- Continue to next

### Step 6 — Verify with re-scan
After all fixes applied, suggest running `/review-ready:scan` again to verify clean state.

### Step 7 — Output remaining work
List items that need manual work, with severity and quick-start instructions for each.

## Safe defaults for auto-generated strings

When generating permission usage strings, use the project's app name from `app.json > name` and template the string:

| Permission | Default string template |
|------------|--------------------------|
| Camera | `"<AppName> uses your camera to capture photos and scan codes."` |
| Photo Library | `"<AppName> accesses your photos so you can share them in the app."` |
| Photo Add | `"<AppName> saves photos and screenshots to your library."` |
| Microphone | `"<AppName> uses the microphone to record audio for messages."` |
| Location (when in use) | `"<AppName> uses your location to show nearby content."` |
| Location (always) | `"<AppName> uses your location in the background to provide ongoing features."` |
| Contacts | `"<AppName> uses your contacts to help you connect with friends."` |
| Calendar | `"<AppName> reads your calendar to surface relevant events."` |
| Bluetooth | `"<AppName> uses Bluetooth to connect to nearby devices."` |
| Local Network | `"<AppName> discovers devices on your local network."` |
| Face ID | `"<AppName> uses Face ID to securely unlock your account."` |
| Motion | `"<AppName> uses motion data to improve fitness tracking."` |
| Tracking (ATT) | `"This identifier helps us deliver personalized content and measure performance."` |
| Health (read) | `"<AppName> reads your health data to provide personalized insights."` |
| Health (write) | `"<AppName> writes workout data to your health record."` |

Always remind the user: **these are placeholders — replace with the actual purpose specific to your app's features.** Generic strings can still be rejected under 5.1.1.

## PrivacyInfo.xcprivacy stub template

Generate this file when missing:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategorySystemBootTime</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>35F9.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>E174.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

Remind user: **review and adjust** based on actual API usage. If app uses analytics/ads SDKs, also need `NSPrivacyCollectedDataTypes` entries.

## Behaviors

- Confirm before applying multiple changes at once.
- Make one edit per file when possible (group fixes).
- After fixes, suggest re-running `/review-ready:scan` to verify.
- For non-auto-fixable items, give specific next steps with file references.
- Never modify files outside the project root.
- Never modify `.git/`, `node_modules/`, or build artifacts.
