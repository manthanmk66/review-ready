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

## Apple Guideline 5.1.1(v) — Forced Login (APPROVED with justification)

**This is a positive example — what gets APPROVED, not rejected.**

### Real approval (May 2026, food delivery / pickup app)

The app forced account creation before any browsing was possible. No guest mode. The developer added the following note to App Store Connect → App Review Information → Notes, and the app was approved on first submission:

```
Why Sign-In is Required

<AppName> requires account creation before browsing because:

- Orders are tied to a verified phone number for pickup authentication
- Customers receive a QR code linked to their account for order collection
- Pickup point assignment and delivery slot booking require a verified user identity
- Order history and payment records are account-specific

Guest browsing is not available as all core features (cart, checkout, order tracking, pickup QR) require an authenticated user.
```

### Why this worked

Apple's 5.1.1(v) reads: *"If your app doesn't include significant account-based features, let people use it without a login. Apps may not require users to enter personal information to function, **except when directly relevant to the core functionality of the app**..."*

The note hits the exact phrasing Apple looks for:
1. **Enumerated reasons** — each bullet ties forced login to a specific feature (QR pickup, payment, slot booking)
2. **Identity-dependency** — each feature is genuinely impossible to deliver anonymously
3. **Closing summary** — explicitly states why guest mode isn't viable

### When this template will NOT work

- Content apps (news, weather, calculator, utilities, reference) — Apple will still ask for guest mode
- E-commerce where catalog browsing doesn't need identity — Apple may push back asking for guest browse, even with this note
- Apps with "social" or "community" features that COULD be partially anonymous

For those, you must add guest mode rather than rely on a justification note.

### Pattern for the plugin

When a forced-login pattern is detected, the auditor should:
1. Classify the app type (transactional vs content)
2. If transactional: remind the user to include this exact template in App Review Notes
3. If content/utility: flag as HIGH risk and recommend guest mode
4. Always remind: if login is OTP-based, include demo credentials with OTP bypass

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

## Google Play — Invalid Use of Photo & Video Permissions (READ_MEDIA_IMAGES)

### Real Play Console pre-review block (June 2026, biodata creator app)
> "We found some common issues that are preventing your app from being sent for review. You must address these issues before you can send your changes for review.
> **Invalid use of the photo and video permissions**
> Your app cannot make use of the READ_MEDIA_IMAGES or READ_MEDIA_VIDEO permissions because it only needs one-time or infrequent access to a device's media files. To use these permissions, your app's core functionality must need persistent access to photo and video files.
> Apps with one-time or infrequent use of photos cannot include the READ_MEDIA_IMAGES and READ_MEDIA_VIDEO permissions in their app manifest, and must migrate to a system photo picker instead."
> Evidence: Photo and video permissions — Version codes: 5, 4

**Failing pattern:** App declared `READ_MEDIA_IMAGES` + `READ_MEDIA_VISUAL_USER_SELECTED` in `AndroidManifest.xml` but only called `ImagePicker.launchImageLibraryAsync` once to pick a profile photo (one-off selection) and `MediaLibrary.saveToLibraryAsync` to save an export. Expo's `expo-media-library` / `expo-image-picker` auto-injected `READ_MEDIA_IMAGES` during prebuild.

**Why it's a BLOCKER, not HIGH:** This is an automated **pre-review block** — Google refuses to even send the build for review. It is not a discretionary reviewer flag; it stops the release 100% of the time for the one-off-access pattern. The earlier guidance that rated this HIGH/"needs Declaration" was wrong for this case.

**Fix (verified):**
1. Remove `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_VISUAL_USER_SELECTED` from the manifest on **all tracks** (`tools:node="remove"`), and in Expo add them to `android.blockedPermissions` in `app.json` so prebuild can't re-add them.
2. Keep `launchImageLibraryAsync` — it uses the system Photo Picker on Android 13+ and needs no permission.
3. Change gallery save to `MediaLibrary.requestPermissionsAsync(true)` (write-only) so the read permission is never requested; `saveToLibraryAsync` works via MediaStore on Android 10+.
4. Bump `versionCode` and upload a new build — the block clears only with a new artifact.

---

## Lessons for the plugin

1. **Don't trust permission strings just because they exist** — Apple's 5.1.1(ii) bar is much higher than developers think.
2. **Firebase Auth is treated as third-party login by some reviewers** — recommend Sign in with Apple even for phone-OTP-only apps.
3. **Static-linked APIs trigger purpose-string requirements** — `expo-camera` unused still needs `NSCameraUsageDescription`.
4. **Multi-app developer accounts get cross-referenced** — Apple sees your sibling apps in the same account and flags 3.2 if any look B2B.
5. **App Review credentials are critical** — phone-OTP apps without reviewer bypass = guaranteed 2.1 rejection.
6. **`READ_MEDIA_IMAGES` on a one-off-picker app is a Play BLOCKER, not a HIGH** — if the only media use is a single `launchImageLibraryAsync` / `PickVisualMedia` call, Google's automated pre-review blocks the release outright. Auditors must use the usage heuristic (one-off picker → BLOCKER + remove; in-app gallery/editor → HIGH + Declaration). Watch for Expo auto-injecting it via `expo-media-library`/`expo-image-picker`.

This file should be updated whenever a real rejection is observed in production. Add the rejection email verbatim, the failing code/config pattern, and the fix.
