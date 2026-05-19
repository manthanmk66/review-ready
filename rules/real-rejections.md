# Real App Store Rejections — Reference Patterns

This file contains anonymized actual rejection emails from real submissions, organized by guideline. Used by the plugin's auditors to recognize rejection patterns reviewers actually cite, not just the published guideline text.

Last updated: 2026-05-19

---

## Apple Guideline 3.2 — Business

### Real rejection (May 2026, customer delivery app)
> "We found in our review that the app is intended to be used by a specific business or organization, including partners, clients, or employees, but you've selected public distribution on the App Store in App Store Connect. Since the App Store is intended for apps with a public audience, we recommend reviewing the other distribution options available to you through your Apple Developer Program Account."

**Signals reviewer used:**
- App had multiple companion apps in same developer account (consumer + manager versions)
- App marketing implied "for our partners"
- Login was OTP / invite-code only
- No public sign-up or anonymous-browse mode

**Lesson:** If you ship multiple apps under one developer account, Apple's reviewer cross-references them. The "manager" / "admin" / "partner" sibling app will be flagged 3.2 if submitted as public.

**Fix path:** Use Custom App Distribution via Apple Business Manager OR Unlisted App Distribution.

---

## Apple Guideline 4.8 — Login Services

### Real rejection (May 2026, app using Firebase Auth)
> "The app uses a third-party login service, but does not appear to offer as an equivalent login option another login service with all of the following features:
> - The login option limits data collection to the user's name and email address.
> - The login option allows users to keep their email address private from all parties as part of setting up their account.
> - The login option does not collect interactions with the app for advertising purposes without consent."

**Surprise finding:** This rejection happened on a **phone-OTP-only** Firebase Auth app. The developer had no Google/Facebook/Apple/Twitter sign-in — just SMS-based OTP via Firebase. Apple still triggered 4.8.

**Interpretation:** Apple's enforcement of "third-party login service" has broadened. Firebase Auth, Auth0, Cognito, Supabase Auth, and any auth provider where the user's identity is stored on a vendor's servers (not the developer's own backend) now potentially triggers 4.8 — **even without any social/OAuth provider**.

**Mitigation strategies (in order of safety):**
1. **Add Sign in with Apple** alongside whatever else you have — universally accepted as compliant
2. If using ONLY phone OTP, document this carefully in App Review notes and provide demo credentials; some reviewers still accept this
3. Switch to your own backend auth (Apple does not require SiwA when the user account is created and stored on your own infrastructure with no third-party involvement)

**The cheapest fix:** Add Sign in with Apple as a button on the login screen, even if 99% of users will use phone OTP. It satisfies 4.8 across all reviewers.

---

## Apple Guideline 5.1.1(ii) — Privacy / Purpose Strings

### Real rejection (May 2026, photo library description)
> "One or more purpose strings in the app do not sufficiently explain the use of protected resources. Purpose strings must clearly and completely describe the app's use of data and, in most cases, provide an example of how the data will be used.
>
> Next Steps: Update the photo library purpose string to explain how the app will use the requested information and provide a specific example of how the data will be used."

**Rejected string was:**
> `"Acme uses your photo library to let you select and update your profile picture."`

**Why it was rejected:**
- States the purpose ("update profile picture") but no concrete *example* of the usage
- No mention of what happens AFTER the photo is selected (cropped? uploaded? visible to whom?)

**Acceptable rewrite:**
> `"Acme accesses your photo library when you tap 'Change Profile Picture' so you can pick a photo to crop and use as your account avatar, which will be visible to store staff during pickup."`

**Pattern:** Apple wants a **scenario** ("when you tap X") + **a concrete consequence** ("which will be Y").

### Real rejection (May 2026, generic strings cited by Apple)
Apple's email explicitly cites these as examples that would NOT pass:
- ❌ `"App would like to access your Contacts"`
- ❌ `"App needs microphone access"`

Both fail because they don't explain *why* or *how*.

---

## Apple Guideline 5.1.1 — Missing Purpose String (ITMS-90683)

### Real rejection (May 2026, App Store Connect upload step)
> "ITMS-90683: Missing purpose string in Info.plist - Your app's code references one or more APIs that access sensitive user data, or the app has one or more entitlements that permit such access. The Info.plist file for the 'Acme.app' bundle should contain a NSCameraUsageDescription key with a user-facing purpose string explaining clearly and completely why your app needs the data. If you're using external libraries or SDKs, they may reference APIs that require a purpose string. While your app might not use these APIs, a purpose string is still required."

**Key insight (often missed by developers):**
> "While your app might not use these APIs, a purpose string is still required."

If a third-party library or SDK *links* to a sensitive API (AVFoundation, Photos, Contacts, CoreLocation, etc.), the purpose string is required **even if your app code never calls that API**.

**Common offenders:**
- `expo-camera` — pulls in AVFoundation → requires `NSCameraUsageDescription` even if unused
- `expo-av` — pulls in AVFoundation → requires `NSCameraUsageDescription` AND `NSMicrophoneUsageDescription`
- `expo-image-picker` — even photo-only usage pulls in camera reference depending on Expo version
- `react-native-image-picker` — same
- Some Firebase modules (`@react-native-firebase/ml`, etc.) may link sensitive APIs

**Detection rule:** If any of these packages are in `package.json`, even unused, the corresponding `NS*UsageDescription` keys must be present. Recommend either:
1. Add the usage string (Apple-compliant)
2. Remove the unused package (cleaner)

---

## Apple Guideline 2.1 — App Completeness (Demo Credentials)

### Common rejection pattern
> "Specifically, we were unable to log into the app to review its features."

**Cause:** Login-gated apps where reviewers can't get past the login screen. Especially common for:
- Phone-OTP-only apps where the reviewer's phone doesn't receive SMS
- Email-magic-link apps where the reviewer can't access the email
- Apps requiring an invite code that wasn't provided

**Mitigation (manual — cannot auto-fix from code):**
1. In App Store Connect → App Information → **App Review Information**:
   - Provide a demo phone number with OTP **hardcoded to a known value** (e.g., bypass: OTP `000000` for `+1-555-0100`)
   - OR provide a demo email + password
   - OR provide a hard-coded test invite code
2. Document in `App Review Notes` exactly which credentials to use
3. Test the credentials yourself in TestFlight before submitting

**Reviewer-bypass code pattern (common practice):**
```ts
// auth.service.ts
if (phone === '+15550100' && otp === '000000') {
  return mockReviewerAccount;
}
```

Disclose this in App Review Notes — DO NOT hide it. Apple is fine with it.

---

## Apple Guideline 2.5.4 — Multitasking / Background Modes

### Common rejection pattern
> "Specifically, we noticed your app declares support for [background mode] in the UIBackgroundModes key in your Info.plist file, but we are unable to locate any features that require this background mode."

**Common cause:** Boilerplate `UIBackgroundModes: fetch` declared without an actual `BGAppRefreshTask` registered or `application:performFetchWithCompletionHandler:` implementation.

**Fix:** Remove unused background modes from Info.plist (or app.json > ios.infoPlist).

---

## Google Play — Foreground Service Without Type (Android 14+)

### Real Play Console rejection pattern
> "Your app contains a foreground service that does not have a foreground service type. Apps targeting Android 14 or higher must declare foregroundServiceType for each foreground service."

**Fix:** Add `android:foregroundServiceType="<type>"` to every `<service>` element with matching `FOREGROUND_SERVICE_*` permission.

---

## Google Play — Account Deletion URL Missing

### Real Play Console flag
> "Apps that allow users to create accounts must provide a way to initiate account and data deletion from within the app and online. The account deletion option you've provided is not externally accessible..."

**Fix:** Add a public web URL like `https://yourapp.com/delete-account` (not behind login) that initiates deletion. Set this URL in Play Console → App Content → Data Safety → Account Deletion.

---

## Lessons for the plugin

1. **Don't trust permission strings just because they exist** — Apple's 5.1.1(ii) bar is much higher than developers think.
2. **Firebase Auth is treated as third-party login by some reviewers** — recommend Sign in with Apple even for phone-OTP-only apps.
3. **Static-linked APIs trigger purpose-string requirements** — `expo-camera` unused still needs `NSCameraUsageDescription`.
4. **Multi-app developer accounts get cross-referenced** — Apple sees your sibling apps in the same account and flags 3.2 if any look B2B.
5. **App Review credentials are critical** — phone-OTP apps without reviewer bypass = guaranteed 2.1 rejection.

This file should be updated whenever a real rejection is observed in production. Add the rejection email verbatim, the failing code/config pattern, and the fix.
