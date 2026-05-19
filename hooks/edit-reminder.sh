#!/usr/bin/env bash
# Review Ready — Edit Reminder Hook
# Fires after Edit/Write/MultiEdit on store-compliance-critical files
# Reads JSON tool input from stdin, emits a contextual reminder to stdout
# (Claude Code surfaces stdout as additional instructions to the model).

set -euo pipefail

# Read hook input JSON from stdin
INPUT=$(cat)

# Extract file path from input JSON using a portable grep+sed (no jq dependency)
FILE_PATH=$(printf '%s' "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || true)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Extract just the filename
FILE_NAME=$(basename "$FILE_PATH")

emit() {
  # Emit a structured tip that Claude will surface as a system reminder
  printf '\n[review-ready hook] %s\n' "$1"
}

case "$FILE_NAME" in
  Info.plist)
    emit "iOS Info.plist edited. Compliance reminders:
- Every NSXxxUsageDescription must be SPECIFIC (not generic). Apple 5.1.1 rejects 'We need access' strings.
- NSUserTrackingUsageDescription required if any IDFA-using SDK present (5.1.2).
- ITSAppUsesNonExemptEncryption should be false if app only uses HTTPS.
- UIBackgroundModes entries must each correspond to a real feature (2.5.4).
Run /review-ready:scan to verify."
    ;;

  PrivacyInfo.xcprivacy)
    emit "PrivacyInfo.xcprivacy edited. Compliance reminders:
- Must declare NSPrivacyAccessedAPITypes for every Required Reason API used.
- Common React Native apps need: UserDefaults (CA92.1), FileTimestamp (C617.1 or DDA9.1), SystemBootTime (35F9.1), DiskSpace (E174.1).
- Missing entries cause Apple email ITMS-91053 and block submission.
Run /review-ready:scan to verify."
    ;;

  AndroidManifest.xml)
    emit "AndroidManifest.xml edited. Compliance reminders:
- Restricted permissions (SMS, MANAGE_EXTERNAL_STORAGE, ACCESS_BACKGROUND_LOCATION, QUERY_ALL_PACKAGES, BIND_ACCESSIBILITY_SERVICE) require Play Console declaration.
- Foreground services need foregroundServiceType + matching FOREGROUND_SERVICE_* permission (Android 14+).
- BLUETOOTH_SCAN should use neverForLocation flag if location isn't needed.
- usesCleartextTraffic should be false unless justified.
Run /review-ready:scan to verify."
    ;;

  app.json|app.config.js|app.config.ts)
    emit "Expo config edited. Compliance reminders:
- ios.infoPlist permission strings must be specific.
- android.permissions array — only declare what's actually used.
- ios.bundleIdentifier and android.package must be real reverse-DNS (not com.example.*).
- ios.config.usesNonExemptEncryption = false for HTTPS-only apps.
- ios.associatedDomains required if app uses deep links.
Run /review-ready:scan to verify."
    ;;

  eas.json)
    emit "EAS Build config edited. Compliance reminders:
- Production profiles should have autoIncrement: true for buildNumber and versionCode.
- Never bundle production API keys with privileged scope into client (only EXPO_PUBLIC_* are bundled).
- Submit profiles need correct App Store Connect / Play Console credentials configured.
Run /review-ready:scan to verify."
    ;;

  *.entitlements)
    emit "iOS entitlements edited. Compliance reminders:
- Every entitlement must correspond to a capability the app actually uses.
- com.apple.developer.in-app-payments (Apple Pay) is separate from IAP.
- com.apple.developer.applesignin required if Sign in with Apple is implemented.
- com.apple.security.application-groups must match between app and extensions.
Run /review-ready:scan to verify."
    ;;
esac

exit 0
