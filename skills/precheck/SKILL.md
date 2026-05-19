---
name: precheck
description: Quick pre-submission sanity check for iOS and Android apps. Runs only the most critical blockers (missing permission usage strings, missing PrivacyInfo.xcprivacy, missing target SDK, IAP bypass detection, missing account deletion). Lighter than /review-ready:scan — finishes in under 30 seconds. Use this when the user says "quick check", "sanity check", "anything obvious wrong", or right before EAS Build submit.
---

# Review Ready — Quick Precheck

A fast scan that hits only the top 10 rejection blockers. Designed for **right-before-submit** sanity check, not full audit.

## When to use

- User runs `/review-ready:precheck`
- User says "quick check", "anything obvious wrong", "sanity check before I submit", "I'm about to upload"
- Right after `eas build --platform ios --profile production` succeeds

For thorough audit, use `/review-ready:scan` instead.

## Top 10 blocker checks (run in sequence, fast)

### 1. iOS — Permission strings (BLOCKER)
For every Expo permission-requesting plugin in `package.json`, verify the corresponding `NSXxxUsageDescription` is set in `app.json > ios.infoPlist`. (See full map in `rules/expo-rules.md` Section B.1.)

### 2. iOS — PrivacyInfo.xcprivacy (BLOCKER)
File must exist at `ios/<project>/PrivacyInfo.xcprivacy` for any app targeting iOS 17+ (which is essentially all current apps).

### 3. iOS — Encryption Export Compliance (BLOCKER)
`app.json > ios.config.usesNonExemptEncryption` must be set (typically `false` for HTTPS-only apps).

### 4. iOS — IAP enforcement (BLOCKER)
If `@stripe/stripe-react-native` is in `package.json`, grep for usage in subscription/upgrade flows. If detected for digital goods, BLOCKER under 3.1.1.

### 5. iOS — Sign in with Apple (BLOCKER if applicable)
If any third-party auth SDK is in `package.json` but `expo-apple-authentication` is not, BLOCKER under 4.8.

### 6. iOS — ATT prompt (BLOCKER if applicable)
If any IDFA-using SDK is in `package.json`, verify `NSUserTrackingUsageDescription` is set.

### 7. Android — Target SDK (BLOCKER)
Verify Expo SDK ≥ 52 OR `targetSdkVersion ≥ 35` via `expo-build-properties`. Play requires API 35 for new/updated apps since Aug 2025.

### 8. Android — Foreground service types (BLOCKER if applicable)
If `<service>` tags exist in `AndroidManifest.xml`, each must have `foregroundServiceType` and matching `FOREGROUND_SERVICE_*` permission.

### 9. Both — Account deletion (HIGH)
If app has account creation, verify a Delete Account action exists in code (grep for `deleteAccount`, `delete_account`).

### 10. Both — Bundle ID / Package not placeholder (BLOCKER)
`ios.bundleIdentifier` not `com.example.*` or `host.exp.*`. `android.package` same check.

## Output format

Short report — no walls of text. Format:

```
🚀 Review Ready Precheck

✅ Permission strings (iOS): all set
✅ PrivacyInfo.xcprivacy: present
❌ Encryption export compliance: missing → add `ios.config.usesNonExemptEncryption: false` to app.json
✅ IAP enforcement: no Stripe-for-digital-goods detected
⚠️  Sign in with Apple: Google sign-in detected, Apple sign-in MISSING → BLOCKER 4.8
✅ ATT: NSUserTrackingUsageDescription set
✅ Target SDK 35: yes (Expo SDK 52)
✅ Foreground services: none declared
⚠️  Account deletion: account creation found but no delete flow → HIGH 5.1.1(v)
✅ Bundle IDs: real reverse-DNS

Summary: 2 issues — 1 BLOCKER, 1 HIGH
Run /review-ready:scan for full audit
Run /review-ready:fix to auto-apply safe fixes
```

## Behaviors

- Be fast. Skip non-blocking issues. Save the depth for `/review-ready:scan`.
- Use emoji status icons for quick scanning.
- Always end with a one-line summary of next action.
- If everything passes, say "🎉 Ready to submit — but still complete App Store Connect / Play Console manual sections (privacy labels, demo account, etc.)."
