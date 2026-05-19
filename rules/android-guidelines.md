# Google Play Developer Policy Knowledge Base (2026)

> Structured reference for static-scanner-based policy compliance checking of Android apps.
> Compiled from Google's Developer Policy Center, Play Console Help, and developer.android.com.
> Reflects policies in effect as of **May 2026**, including the **April 15, 2026** policy announcement and **January 28, 2026** Health enforcement.
>
> NOTE: Several Google Play / Play Console URLs are gated and could not be fetched directly during compilation. Where direct fetch was blocked, sourced content was reconstructed from official Google help-article excerpts surfaced through search. Always link the Play Console policy page in user-facing reports rather than relying on this document as the canonical source.

---

## Table of Contents

1. [Restricted Content](#1-restricted-content)
2. [Impersonation](#2-impersonation)
3. [Intellectual Property](#3-intellectual-property)
4. [Privacy, Deception & Device Abuse](#4-privacy-deception--device-abuse)
5. [Monetization & Ads](#5-monetization--ads)
6. [Store Listing & Promotion](#6-store-listing--promotion)
7. [Spam & Minimum Functionality](#7-spam--minimum-functionality)
8. [Permissions & APIs that Access Sensitive Information](#8-permissions--apis-that-access-sensitive-information)
9. [Families](#9-families)
10. [Health Apps](#10-health-apps)
11. [News & Magazines](#11-news--magazines)
12. [AI-Generated Content](#12-ai-generated-content)
13. [Real-Money Gambling, Games & Contests](#13-real-money-gambling-games--contests)
14. [Financial Services & Crypto](#14-financial-services--crypto)
15. [Technical Requirements](#15-technical-requirements)
16. [Account Deletion](#16-account-deletion)
17. [Data Safety Section](#17-data-safety-section)
18. [Foreground Services](#18-foreground-services)
19. [Master Static-Scan Checklist](#19-master-static-scan-checklist)

---

## 1. Restricted Content

### 1.1 Child Endangerment / Child Sexual Abuse Material (CSAM)
**Rule:** Google Play has a zero-tolerance policy against child sexual abuse material (CSAM). Apps that promote child endangerment, sexualization of minors, or that fail to prevent the creation/upload/distribution of CSAM will be immediately removed and the developer account terminated. Generative-AI apps must also actively prevent generation of CSAM.
**Auto-checkable:** Partial
**What to check:**
- Strings/resources containing terms commonly used in CSAM (block-list scan, with care).
- Presence of UGC upload flows + absence of moderation/abuse-reporting hooks (`report`, `flag`, `block` actions; SafetyNet/Content-moderation SDKs).
- AI image-generation libs (`stable-diffusion`, `runwayml`, `openai`, `replicate`, etc.) with no NSFW/age classifier integration.
- Manifest age-rating metadata: `<meta-data android:name="com.google.android.gms.car.application" ...>` for IARC.
**Common rejection example:** App allows generating AI images of unverified subjects without an age classifier; app lets users upload images without a reporting feature.
**Fix:** Integrate a NSFW + minor classifier on all uploads/generations; implement in-app report-and-block UX; pre-publish CSAM hash matching (PhotoDNA / Google Content Safety API).

### 1.2 Inappropriate Content – Sexual Content & Nudity
**Rule:** No apps that contain or promote sexual content, including pornography, sexually-suggestive depictions, depictions of sex acts, or fetishes. Sexually-explicit ads are also prohibited. Non-consensual sexual material (including deepfakes) is banned.
**Auto-checkable:** Partial
**What to check:**
- `<application android:label>` and store-listing strings for sexually explicit terms.
- Image assets in `res/drawable*`, `res/mipmap*`, `assets/` (hash/visual scan; flag for manual review).
- Embedded URLs/SDKs of known adult content networks.
**Common rejection example:** Drawable assets containing nudity; app description mentioning "adult"/"18+ content".
**Fix:** Remove the content; if the app is genuinely adult-oriented, route distribution outside Play.

### 1.3 Hate Speech
**Rule:** No apps that promote violence or incite hatred against individuals or groups based on race, ethnicity, religion, disability, age, nationality, veteran status, sexual orientation, gender, gender identity, caste, immigration status, or any other characteristic associated with systemic discrimination.
**Auto-checkable:** Partial
**What to check:**
- String resources / `strings.xml` / hard-coded strings against a hate-speech term list.
- Static assets / icons depicting hate symbols.
**Common rejection example:** Slurs in `strings.xml`; UI screens mocking protected groups.
**Fix:** Remove offending strings/assets; if UGC-driven, add proactive moderation.

### 1.4 Violence & Violent Extremism
**Rule:** No apps depicting or facilitating gratuitous violence, terrorism, or other dangerous activities. No content that promotes, glorifies, or incites violent extremism.
**Auto-checkable:** Partial
**What to check:** Resource scan for extremist imagery; app description / category checks; absence of moderation in UGC apps.
**Common rejection example:** App that aggregates terrorist propaganda feeds.
**Fix:** Remove content / restrict distribution.

### 1.5 Bullying & Harassment
**Rule:** No apps with content that bullies or harasses, especially minors. UGC apps must have safeguards against harassment.
**Auto-checkable:** Partial
**What to check:** UGC apps without `report`/`block` user flows (search code for these handler patterns). Anonymous-messaging apps without rate-limiting / moderation SDKs.
**Common rejection example:** Anonymous Q&A apps without an in-app block button.
**Fix:** Add a clearly visible report-and-block UI on every user-to-user surface.

### 1.6 Dangerous Products – Weapons, Explosives, Ammunition
**Rule:** No apps that facilitate the sale of explosives, firearms, ammunition, or certain firearm accessories (e.g., bump stocks, silencers, 3D-printing instructions for firearms). No instructions for manufacturing weapons.
**Auto-checkable:** Partial
**What to check:** Store-listing description; resource strings for "buy gun"/"ammo"/"explosive"; e-commerce SDK product-feed scanning.
**Common rejection example:** Marketplace app with firearm SKUs in its product catalog.
**Fix:** Remove SKUs / category gate; or be removed from Play.

### 1.7 Marijuana / Controlled Substances
**Rule:** No apps that facilitate the sale of marijuana or marijuana products (regardless of local legality). No apps that promote sale of any controlled substance, drug paraphernalia, tobacco, or alcohol to minors.
**Auto-checkable:** Partial
**What to check:** Listing description; e-commerce catalog; in-app cart/checkout flow + product taxonomy strings.
**Common rejection example:** Cannabis dispensary "order ahead and delivery" flow.
**Fix:** Remove ordering flow (informational content is permitted); restrict to age-gated info.

### 1.8 Tobacco & Alcohol
**Rule:** No marketing/promotion to minors; age-gating required.
**Auto-checkable:** Partial – check for age-gate code path before any alcohol/tobacco product surface.

### 1.9 Gambling-themed Content (non-real-money)
**Rule:** Simulated gambling apps must not represent real-world value and must follow Families/age-rating rules. Real-money gambling is governed by [Section 13](#13-real-money-gambling-games--contests).

### 1.10 Sensitive Events
**Rule:** No apps that lack reasonable sensitivity toward or capitalize on natural disasters, conflict, deaths, public health emergencies, or other tragic events.
**Auto-checkable:** No (manual / metadata review).

### 1.11 Health Misinformation
**Rule:** No apps that contain misleading health claims that contradict existing medical consensus or pose harm.
**Auto-checkable:** No.

### 1.12 Illegal Activities
**Rule:** No apps that facilitate, promote, or instruct on illegal activities.
**Auto-checkable:** No.

### 1.13 User-Generated Content (UGC) Moderation
**Rule:** Apps featuring UGC must implement robust, ongoing moderation: terms-of-use acceptance pre-upload, defined objectionable content/behaviors, in-app reporting and blocking of users and content, removal of users who repeatedly violate, and incidental-sexual-content controls. AR-UGC must moderate AR anchoring locations.
**Auto-checkable:** Yes
**What to check:**
- App contains content-upload code paths (camera, gallery picker, `Intent.ACTION_PICK`, file upload SDKs).
- Look for `report`, `flag`, `block`, `mute`, `abuse` handlers in code.
- Presence of EULA/TOS acceptance flow before first upload (e.g., `SharedPreferences` flag `tos_accepted`).
- Manifest UGC declaration in Play Console (cannot verify from APK; flag for developer to confirm).
**Common rejection example:** Social app allows photo posts; no in-app report button anywhere; no TOS acceptance.
**Fix:** Add report-and-block UI accessible from each content item and each user profile; add TOS acceptance gate.

---

## 2. Impersonation

**Rule:** Apps must not mislead users by impersonating any person, developer, company, or entity, or by using icons, descriptions, titles, screenshots, or in-app elements that misrepresent the app's origin or affiliation.
**Auto-checkable:** Partial
**What to check:**
- `applicationId` / package name imitating a well-known brand (`com.facebook.*`, `com.google.*`, etc.) when not authorized.
- App label and icon similarity to known apps (visual/string diff).
- Privacy policy and developer name in store listing.
- Use of trademarked terms in `<string name="app_name">` without authorization metadata.
**Common rejection example:** App named "WhatsAap Lite" with a green telephone-in-bubble icon.
**Fix:** Rename, redesign icon, remove any false claims of affiliation.

---

## 3. Intellectual Property

**Rule:** Apps must not infringe trademark, copyright, patent, trade-secret, or other proprietary rights. No sale or promotion of counterfeit goods. No unauthorized use of others' code, brands, or assets.
**Auto-checkable:** Partial
**What to check:**
- License files for bundled libraries (`LICENSE`, `NOTICE`, `META-INF/`).
- Drawable/asset filenames containing brand names (e.g., `nike_logo.png`).
- Hard-coded API keys or scraped endpoints for proprietary services (Spotify private API, etc.).
- Embedded copyrighted media (MP3/MP4) without license attribution.
**Common rejection example:** Pirated movie streaming app; unlicensed use of Disney characters.
**Fix:** Remove infringing assets/code; obtain licenses; provide attribution.

---

## 4. Privacy, Deception & Device Abuse

### 4.1 User Data
**Rule:** Developers must be transparent about how they collect, use, and share user data. Limit access to data needed for the app's user-facing features; request runtime permissions only when needed; secure data in transit; provide a privacy policy.
**Auto-checkable:** Yes
**What to check:**
- `AndroidManifest.xml` permissions list vs. app's declared category.
- Privacy policy URL present in store listing (cannot read APK – flag).
- `android:usesCleartextTraffic="true"` on `<application>` → flag (HTTP allowed).
- `network_security_config.xml` permits cleartext for non-debug.
- TLS pinning / `okhttp` interceptors verifying certs.
- SDKs that exfiltrate data without disclosure (compare manifest SDK list to Data Safety form).
**Common rejection example:** Manifest requests `READ_CONTACTS` but the app has no contact-related feature; `usesCleartextTraffic="true"` on a banking app.
**Fix:** Remove unused permissions; remove cleartext flag; pin certificates; publish privacy policy URL.

### 4.2 Personal & Sensitive Information
**Rule:** Personal and sensitive user data (contacts, photos, SMS, call logs, microphone, location, financial info, health info, government IDs) requires runtime consent, in-app prominent disclosure, encryption at rest and in transit, and a posted privacy policy.
**Auto-checkable:** Yes
**What to check:**
- Permissions that map to sensitive data (`READ_CONTACTS`, `READ_SMS`, `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`, `READ_MEDIA_IMAGES`, etc.).
- Storage of sensitive data in plaintext `SharedPreferences` (look for `getSharedPreferences` writes containing PII).
- Hard-coded credentials or PII in resources.
**Common rejection example:** App stores user passwords in `SharedPreferences` without `EncryptedSharedPreferences`.
**Fix:** Use `EncryptedSharedPreferences` / Android Keystore; prompt at runtime with a prominent disclosure before access.

### 4.3 Prominent Disclosure & Consent
**Rule:** For Permissions and Sensitive APIs requiring prominent disclosure (e.g., Accessibility Services, background location, package visibility), a separate in-app disclosure must precede the runtime permission prompt. It must describe why the capability is needed and what data is collected, require affirmative action (e.g., tap-to-accept), and not interpret navigation-away as consent.
**Auto-checkable:** Yes
**What to check:**
- Code path that calls `requestPermissions(..., ACCESS_BACKGROUND_LOCATION, ...)` or `AccessibilityService` start without first showing a custom `AlertDialog`/`Activity` that mentions the data use.
- Permission rationale strings exist (`res/values/strings.xml` keys like `permission_rationale_*`).
**Common rejection example:** App immediately calls `requestPermissions` on launch for background location with no rationale screen.
**Fix:** Add a dedicated disclosure screen before the system prompt, with continue/cancel buttons.

### 4.4 Deceptive Behavior
**Rule:** No apps that deceive users — including functionally-impossible apps, fake system warnings, false claims of removing viruses, fake updates, or icon/intent hijacking.
**Auto-checkable:** Partial
**What to check:**
- Fake system UI: drawables resembling Android system dialogs.
- Strings advertising impossible features ("X-ray vision", "see through clothes", "real lie detector").
- `Activity` icons that change at runtime (`PackageManager.setComponentEnabledSetting` on launcher aliases) — disguises app icon.
- Multiple `<activity-alias>` entries with different icons/labels.
**Common rejection example:** Antivirus app simulates a virus scan with a hardcoded "infected" result.
**Fix:** Remove deceptive UX; align claims with actual behavior.

### 4.5 Device & Network Abuse
**Rule:** No apps that interfere with, disrupt, damage, or gain unauthorized access to a device, network, or other apps. This includes self-updating outside Play, downloading executable code, exploiting vulnerabilities, hacking, or interfering with carrier services.
**Auto-checkable:** Yes
**What to check:**
- `DexClassLoader`, `PathClassLoader`, `InMemoryDexClassLoader` usage → flag for dynamic code loading.
- `Runtime.exec`, `ProcessBuilder` invocations.
- `REQUEST_INSTALL_PACKAGES` permission + APK download to internal storage → self-update.
- Native libraries that download `.so` or `.dex` at runtime.
- `WRITE_SECURE_SETTINGS`, `INSTALL_PACKAGES` (system-only) — should never appear in 3rd-party apps.
**Common rejection example:** App downloads an additional APK from a CDN and prompts the user to install it.
**Fix:** Ship all code in the APK/AAB; rely on Google Play updates only.

### 4.6 Misrepresentation
**Rule:** No coordinated activity that misrepresents the developer's identity, country of origin, or intent. No fake reviews, sockpuppet accounts, or astroturfing.
**Auto-checkable:** No (account-level signal).

### 4.7 Malware
**Rule:** No code that puts a user, their data, or their device at risk. Categories include trojans, phishing, spyware, ransomware, rooting apps, hostile downloaders, billing fraud, click fraud, and call/SMS fraud.
**Auto-checkable:** Yes
**What to check:**
- VirusTotal/Play Protect signal on APK hash.
- Permissions combo: `RECEIVE_SMS` + `INTERNET` + `SEND_SMS` without messaging UI.
- Native libs with high entropy / packed (`upx`).
- Receivers for `SMS_RECEIVED`, `BOOT_COMPLETED`, `PACKAGE_REPLACED` without disclosed feature.
- Use of root-required commands (`su`, `/system/`).
**Common rejection example:** App silently auto-subscribes user to premium SMS service.
**Fix:** Remove malicious code; clean SDK supply chain.

### 4.8 Mobile Unwanted Software (MUwS)
**Rule:** No apps that are deceptive, perform unexpected actions, are difficult to uninstall, are bundled in unexpected ways, fail to share required information, or affect other apps/devices.
**Auto-checkable:** Partial
**What to check:**
- Disabled or hidden launcher activity (`category.LAUNCHER` missing or removed at runtime).
- Receivers that re-launch the app after uninstall attempts.
- Aggressive notifications when user attempts uninstall.
**Common rejection example:** "System cleaner" hides its launcher icon after first run.
**Fix:** Always provide a launcher icon and a clear uninstall path.

### 4.9 Stalkerware
**Rule:** Apps that track another person without their consent (location, communications, photos) are prohibited unless the app is a parental/enterprise app with full disclosure to the tracked user.
**Auto-checkable:** Partial
**What to check:**
- `ACCESS_BACKGROUND_LOCATION` + hidden launcher + remote-write of GPS coords.
- Strings like "track partner", "secret tracker", "catch cheating".
**Common rejection example:** "Hidden GPS tracker" app marketed for spying on spouses.
**Fix:** Convert to disclosed parental-control category with on-device consent UX.

---

## 5. Monetization & Ads

### 5.1 Google Play Billing (GPB) Requirement
**Rule:** Apps distributed via Google Play that sell in-app digital content must use Google Play's billing system. Physical goods/services and certain regulated categories are exempt. As of 2025, alternative billing pilots exist (EEA, India, etc.); apps must still register/declare them.
**Auto-checkable:** Yes
**What to check:**
- `com.android.billingclient:billing` dependency in `build.gradle`.
- Outbound payment URLs (`stripe.com/checkout`, `paypal.com`, `paddle.com`) inside an app that sells digital subscriptions/coins.
- "Buy on web" links steering users out of Google Play Billing.
**Common rejection example:** Premium-feature app pushes users to Stripe checkout via web.
**Fix:** Integrate Play Billing; remove or gate external payment links per region rules.

### 5.2 Subscriptions – Clarity & Cancellation
**Rule:** Subscription terms (price, period, free-trial conditions, introductory-price terms, renewal behavior) must be displayed clearly and conspicuously prior to purchase. Users must be able to cancel from within the app and via the developer's website.
**Auto-checkable:** Partial
**What to check:**
- Subscription purchase screen has visible strings for price, billing period, free-trial duration, conversion price.
- Code path linking to subscription management / cancel.
**Common rejection example:** "7 days free" CTA without disclosing post-trial price.
**Fix:** Add explicit pre-purchase disclosure modal; include cancel-anytime instructions.

### 5.3 Ads – Disruptive Ads (Better Ads Experiences)
**Rule:** Full-screen interstitial ads must not appear unexpectedly. Specifically prohibited:
- Interstitials at the beginning of a content segment.
- Interstitials before the app loading screen.
- Interstitials a user cannot close after 15 seconds.
- Interstitials immediately when the user is about to perform an intended action (read article, etc.).

Acceptable placements: natural transition breaks (between game levels, after chapter, etc.).
**Auto-checkable:** Yes
**What to check:**
- AdMob / Unity Ads / IronSource interstitial calls (`InterstitialAd.show()`, `MaxInterstitialAd.showAd()`) inside `onCreate`/`onResume` of the first Activity.
- App launches `MainActivity` → splash → interstitial before first user input.
- Interstitial frequency capping settings.
**Common rejection example:** Hyper-casual game shows a 30-second skippable ad on cold start before menu loads.
**Fix:** Move ad placement to end-of-level transitions; add a 15-second skip button.

### 5.4 Ads – Identifying as Ads
**Rule:** Ads must not simulate app interface elements, system warnings, or in-app content (no fake "Close X" buttons, no fake notifications). Ads must be clearly distinguishable from app content.
**Auto-checkable:** Partial
**What to check:** Native ad templates that omit the "Ad" label drawable; banner ads positioned over interactive UI causing accidental clicks.

### 5.5 Ads – Outside the App
**Rule:** Ads must not appear outside the app — no lock-screen monetization (unless that is the core function of the app), no system-notification ads, no ads on the home screen.
**Auto-checkable:** Yes
**What to check:**
- `SYSTEM_ALERT_WINDOW` permission combined with ad SDK.
- `Notification` builders inserting promotional content.
- Use of `LiveWallpaper` / launcher hooks for ad delivery.
**Common rejection example:** Flashlight app posts a notification each morning with an ad creative.
**Fix:** Remove out-of-app ad surfaces.

### 5.6 Ad Walls / Forced Engagement
**Rule:** Rewarded ads must be user-initiated and clearly labeled. No forced viewing of unrelated content to use core features the user already paid for.
**Auto-checkable:** Partial

### 5.7 Pay-to-Uninstall / Hidden Ads
**Rule:** Apps must not require payment, action, or third-party consent to remove themselves. Hidden interstitials with zero pixel size are prohibited.
**Auto-checkable:** Yes – flag `WebView` with 1x1 dp dimensions loading ad URLs.

---

## 6. Store Listing & Promotion

### 6.1 Metadata
**Rule:** App title, icon, screenshots, feature graphic, video, short/long description must accurately represent the app. No misleading, irrelevant, excessive (keyword stuffing), inappropriate, or non-descriptive metadata.
**Auto-checkable:** Partial
**What to check:**
- App `android:label` length and presence of emojis/Unicode tricks.
- Compare `applicationId` and `android:label` to display name on launcher.
- Excessive promotional text in `app_name` (e.g., "BEST FREE!!!").
**Common rejection example:** Title "Best Free PDF Reader 2026 — #1 Top Rated 5★".
**Fix:** Keep app title ≤ 30 characters; remove rank/price/emoji.

### 6.2 App Title Length
**Rule:** Max 30 characters for store-listing title.
**Auto-checkable:** Yes – linter rule on store listing fields.

### 6.3 Screenshot / Graphic Truthfulness
**Rule:** Screenshots must depict actual app content, not gameplay from another app or unreleased features.
**Auto-checkable:** No.

### 6.4 Promotional Content & "Free"
**Rule:** Don't use "Free" in the title; don't claim features not present.
**Auto-checkable:** Yes – regex on title.

### 6.5 Misleading Claims
**Rule:** No "doctor recommended", "scientifically proven" without basis; no false rating/award claims.
**Auto-checkable:** Partial (regex on description).

---

## 7. Spam & Minimum Functionality

### 7.1 Repetitive Content
**Rule:** Don't post multiple apps with similar content or functionality. Consolidate via a single quality app.
**Auto-checkable:** Partial (developer account-level: enumerate developer's apps and compare resource hashes / package names).

### 7.2 Made-for-Ads
**Rule:** Apps whose primary purpose is to display ads (with little or no original functionality) are prohibited.
**Auto-checkable:** Yes
**What to check:** Ratio of ad-related code/SDK weight to functional code; activity count; presence of >1 distinct user-facing feature.
**Common rejection example:** App with a single Activity that loads a webview to an ad network.

### 7.3 Minimum Functionality
**Rule:** Apps must provide a basic degree of functionality and a respectful user experience. Apps that crash, fail to install, or have no meaningful content will be rejected.
**Auto-checkable:** Yes
**What to check:**
- App boots without crashing (`adb logcat` after install — fatal exceptions).
- Apps that are only a webview wrapper over a website with no native value-add (no offline, no notifications, no native features).
- ANR-prone main thread network calls.
**Fix:** Add native features (offline cache, push, native UI elements); fix crashes.

### 7.4 Webview Wrapper Apps
**Rule:** Apps that are essentially a webview pointing at a website without significant native functionality are considered low-quality.
**Auto-checkable:** Yes — count of `WebView` vs. other UI usage; manifest activity count.

### 7.5 Sexual Content / Profanity in Spam
Covered under [Section 1](#1-restricted-content).

### 7.6 Keyword Stuffing
**Rule:** App description must not contain repetitive, unrelated, or excessive keywords. Title must not include rankings, prices, or store performance ("#1", "free").

---

## 8. Permissions & APIs that Access Sensitive Information

> Policy hub: *Permissions and APIs that Access Sensitive Information*. Requests must be limited to functionality essential to core purpose; otherwise apps need to use a less-permissive alternative (system pickers, foreground-only access, etc.) or submit the **Permissions Declaration Form**.

### 8.1 SMS / Call Log Permissions
**Permissions:** `READ_SMS`, `SEND_SMS`, `RECEIVE_SMS`, `READ_CALL_LOG`, `WRITE_CALL_LOG`, `PROCESS_OUTGOING_CALLS`
**Rule:** Only the user-selected default SMS/Phone/Assistant handler may request these. Allowed alternative use cases (per declaration): backup/restore, transfer to a new device, enterprise-managed, etc. Submit Permissions Declaration Form.
**Auto-checkable:** Yes
**What to check:**
- `<uses-permission>` for any SMS/CallLog permission.
- Presence of an intent filter for `android.intent.action.SENDTO` with `smsto:` data → default SMS handler signal.
- App's category (must match dialer/SMS to legitimately request).
**Common rejection example:** Wallpaper app requests `READ_SMS` for "OTP auto-fill" → policy violation; should use SMS Retriever API instead.
**Fix:** Remove permission; use SMS Retriever API or SMS User Consent API for OTP; submit declaration if eligible.

### 8.2 Location – Background Location
**Permission:** `ACCESS_BACKGROUND_LOCATION`
**Rule:** Only request when essential to the app's primary feature; must provide value to the user. Submit Location Permissions declaration. Must show a prominent disclosure that explains background usage *before* requesting the OS permission.
**Auto-checkable:** Yes
**What to check:**
- Permission in manifest.
- Foreground service type `location` declared if used in service.
- Prominent-disclosure dialog code path prior to permission request.
- Justification text strings.
**Common rejection example:** Coupon app requests background location to "improve recommendations" — not core functionality.
**Fix:** Move to foreground-only (`ACCESS_FINE_LOCATION` while-in-use); add disclosure UX; submit declaration if truly needed.

### 8.3 All Files Access – `MANAGE_EXTERNAL_STORAGE`
**Permission:** `MANAGE_EXTERNAL_STORAGE`
**Rule:** Restricted on Android 11+. Allowed only when broad file access is essential (file managers, antivirus, backup, document management, on-device search). Apps must pass an access review; otherwise use SAF (Storage Access Framework), MediaStore, or scoped storage.
**Auto-checkable:** Yes
**What to check:**
- `<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />` in manifest.
- `Environment.isExternalStorageManager()` calls in code.
- Whether app category matches an approved use case.
**Common rejection example:** Photo-editor app requests `MANAGE_EXTERNAL_STORAGE` instead of using `READ_MEDIA_IMAGES` / photo picker.
**Fix:** Migrate to scoped storage / `ACTION_OPEN_DOCUMENT` / `READ_MEDIA_IMAGES`; if essential, file Declaration Form with justification + video demo.

### 8.4 Photo & Video Permissions (Android 13+)
**Permissions:** `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_VISUAL_USER_SELECTED`
**Rule:** Apps targeting Android 13+ may only request `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` if the system **Photo Picker** cannot meet the app's core functionality. Apps that still request these must submit the Photo and Video Permissions Declaration. For occasional photo selection, use the Photo Picker (`ACTION_PICK_IMAGES` / `PickVisualMedia` contract).
**Auto-checkable:** Yes
**What to check:**
- Manifest declares `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO`.
- Code uses `ActivityResultContracts.PickVisualMedia` (good) vs. `MediaStore.Images.Media` cursor enumeration (likely needs declaration).
- `compileSdk` / `targetSdk` ≥ 33.
**Common rejection example:** Chat app requests `READ_MEDIA_IMAGES` to attach photos when Photo Picker would suffice.
**Fix:** Use Android Photo Picker; remove `READ_MEDIA_IMAGES` if possible.

### 8.5 Accessibility Service – `BIND_ACCESSIBILITY_SERVICE`
**Rule:** Accessibility APIs are restricted to apps that help users with disabilities or whose core functionality genuinely requires the service. Must not be used to track user actions for non-accessibility purposes, capture passwords, automate billing, or interfere with other apps without consent. Prominent disclosure required.
**Auto-checkable:** Yes
**What to check:**
- `<service ... android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">` in manifest with `<meta-data android:resource="@xml/accessibility_service_config"/>`.
- App's stated purpose vs. claimed disability assistance.
- `accessibility_service_config.xml` event types declared.
**Common rejection example:** Auto-clicker / macro app declares Accessibility Service without an accessibility purpose.
**Fix:** Justify in declaration; reduce event filtering; or remove service.

### 8.6 Package Visibility – `QUERY_ALL_PACKAGES`
**Rule:** Apps targeting Android 11+ may not enumerate all installed packages unless core functionality requires it. Acceptable use cases include device security (antivirus), file managers, browsers, banking-fraud detection. Otherwise use `<queries>` element with specific package names.
**Auto-checkable:** Yes
**What to check:**
- `<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />` in manifest.
- `PackageManager.getInstalledApplications` / `getInstalledPackages` calls.
- Presence of `<queries>` element as the proper alternative.
**Common rejection example:** Calculator app declares `QUERY_ALL_PACKAGES`.
**Fix:** Remove permission; declare specific packages via `<queries>` blocks.

### 8.7 VPN Service – `BIND_VPN_SERVICE`
**Rule:** Permitted only for apps whose core functionality is VPN, or that require a remote server for parental control, app usage tracking, device security, network tools, web browsers, or carrier services. Must not collect personal data without disclosure and consent. Must not redirect/manipulate user traffic from other apps for monetization. Must encrypt tunnel to endpoint.
**Auto-checkable:** Yes
**What to check:**
- `<service>` extends `android.net.VpnService` declared in manifest.
- Permission declared.
- App category in Play Console (must be "Tools" or similar with VPN as primary purpose).
- Traffic-monetization signs: ad-injection libraries.
**Common rejection example:** "Free VPN" that inserts banner ads into intercepted HTTP traffic.
**Fix:** Remove ad-injection; document core VPN purpose; ensure TLS to endpoint.

### 8.8 Usage Access – `PACKAGE_USAGE_STATS`
**Rule:** Special access requiring user grant in Settings. Must be justified by core functionality (digital wellbeing, parental control, device security).
**Auto-checkable:** Yes
**What to check:** `<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions" />`; calls to `UsageStatsManager`.

### 8.9 Install Packages – `REQUEST_INSTALL_PACKAGES`
**Rule:** Only legitimate package distributors (e.g., mobile DM, app stores, browsers) may declare this. Cannot be used to side-load malicious payloads or self-update.
**Auto-checkable:** Yes
**What to check:** Permission in manifest; code paths that trigger `Intent.ACTION_INSTALL_PACKAGE` or `PackageInstaller`.

### 8.10 SYSTEM_ALERT_WINDOW (Draw over apps)
**Rule:** Restricted to apps that have a clear, user-facing reason (chat heads, accessibility tools). Cannot obscure other apps deceptively or for ads.
**Auto-checkable:** Yes — flag use of `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY` with ad SDK calls.

### 8.11 Health Connect (`READ_HEALTH_DATA_*` / `WRITE_HEALTH_DATA_*`)
**Rule:** Access restricted to apps with approved health, fitness, medical care, or health research core use cases. Must justify each specific data type requested. Strict purpose limitation. Explicit user consent required before sharing health data with third parties. Sensitive types (e.g., menstrual cycle phases, alcohol consumption, mental health) prohibited for use in employment/insurance eligibility or unauthorized social sharing.
**Auto-checkable:** Yes
**What to check:**
- Manifest permissions starting `android.permission.health.READ_*` / `WRITE_*`.
- `<intent-filter><action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" /></intent-filter>` present (required for Health Connect apps).
- App declared Health App in Play Console.
- Organization Account verification (deadline Jan 28, 2026).
**Common rejection example:** Mood-journal app requests `READ_HEALTH_DATA_IN_RECORDS` (blood-pressure) without medical purpose.
**Fix:** Remove unneeded health permissions; complete Health Apps Declaration; verify Organization Account.

### 8.12 Contacts – `READ_CONTACTS` (April 15, 2026 update)
**Rule:** Apps that do not require broad contact access must use the **Android Contact Picker** (`ContactsContract.Intents.Insert` / `Intent.ACTION_PICK` with `Contacts.CONTENT_URI`). Broad access via `READ_CONTACTS` is reserved for apps where contact-management is core (messaging, dialer, address book apps).
**Auto-checkable:** Yes
**What to check:**
- `READ_CONTACTS` / `WRITE_CONTACTS` permissions in manifest.
- Whether the app actually invokes a Contact Picker (`Intent` with `Contacts.CONTENT_URI`) or reads the full contacts table (`ContentResolver.query(ContactsContract.Contacts.CONTENT_URI, ...)`).
**Common rejection example:** Game requests `READ_CONTACTS` to "invite friends" — should use share sheet or Picker instead.
**Fix:** Switch to Contact Picker; remove permission.

### 8.13 Camera, Microphone, Body Sensors
**Rule:** Standard runtime permissions. Must include in Data Safety section if data leaves device. Prominent disclosure for any background/continuous collection.
**Auto-checkable:** Yes — manifest permissions + foreground service type if running in background.

### 8.14 Biometrics
**Rule:** Use BiometricPrompt API; do not store biometric data; comply with platform key-storage requirements.

### 8.15 Bluetooth (Android 12+)
**Rule:** Use `BLUETOOTH_SCAN` with `neverForLocation` flag if location is not required, to avoid implicit `ACCESS_FINE_LOCATION` derivation.
**Auto-checkable:** Yes – check for `<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />`.

### 8.16 Notifications (`POST_NOTIFICATIONS`)
**Rule:** Apps targeting Android 13+ must request `POST_NOTIFICATIONS` at runtime. Notifications cannot be used for spam, ads, or to revive uninstall flows.
**Auto-checkable:** Yes – manifest permission + runtime request pattern.

### 8.17 Exact Alarms (`SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`)
**Rule:** Only justified for alarm clocks, calendar/reminder apps, and similar use cases. Otherwise use `AlarmManager.setWindow` or WorkManager.
**Auto-checkable:** Yes – manifest permission + app category.

### 8.18 Foreground Service – Special Use
Cross-reference [Section 18](#18-foreground-services).

---

## 9. Families

### 9.1 Designed for Families Program
**Rule:** Apps targeted primarily at children must opt into the Families program in Play Console and meet specific content, ads, privacy, and quality requirements.
**Auto-checkable:** Partial
**What to check:**
- Play Console category set to "Families" (cannot detect from APK; flag).
- Target age range declared.
- Ad SDKs are from the **Families Self-Certified Ads SDK** list (AdMob with Families settings, Unity LevelPlay with COPPA, etc.).
- COPPA: no personalized ads, no remarketing, no interest-based ads, no behavioral analytics on under-13 users.
- No social features without parental controls.
**Common rejection example:** Kids coloring app uses generic AdMob without Families-compliant settings.
**Fix:** Use Families-certified SDK; set `RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE`.

### 9.2 Ads to Children
**Rule:** No personalized advertising, no remarketing, no interest-based ads when serving to children or users of unknown age. Disable IDFA/AAID; disable behavioral targeting.
**Auto-checkable:** Yes
**What to check:**
- AdMob: `MobileAds.setRequestConfiguration(new RequestConfiguration.Builder().setTagForChildDirectedTreatment(TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE).build())`
- IronSource: `setMetaData("is_child_directed", "true")` or similar.
- Lack of these flags → flag.

### 9.3 COPPA / GDPR-K
**Rule:** Apps directed at children under 13 (US) or 16 (EU) must obtain verifiable parental consent and follow strict data-collection limits.
**Auto-checkable:** Partial – check for explicit consent flow if app is Families-categorized.

### 9.4 Teacher Approved (Kids tab)
**Rule:** Optional curation. Apps must meet additional quality bars on age-appropriateness, advertising, and design.

### 9.5 Dating / Matchmaking with Incidental Children Features
**Rule:** Apps with dating as an incidental feature are not required to implement Restrict Minor Access if they implement effective alternative age-gating mechanisms (April 15, 2026 update).

---

## 10. Health Apps

### 10.1 Health Apps Declaration
**Rule:** Apps in Medical, Health & Fitness, or that handle health data must complete the Health Apps Declaration in Play Console. Existing health apps must migrate to a **verified Organization Account** by **January 28, 2026**.
**Auto-checkable:** Partial
**What to check:**
- App category Medical / Health & Fitness in Play Console.
- Health Connect permissions in manifest.
- Required `androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE` activity.

### 10.2 Medical Device Labeling
**Rule:** Apps that have regulatory clearance (FDA/CE/etc.) receive a verified label. Apps without clearance must include the disclaimer: *"This app is not a medical device and does not diagnose, treat, or prevent any condition."*
**Auto-checkable:** Yes
**What to check:** Presence of disclaimer string in `strings.xml` and visible in onboarding/about screen.

### 10.3 Data Justification for Health Connect Sensitive Types
**Rule:** Each sensitive Health Connect type (`READ_HEALTH_DATA_IN_RECORDS`, blood pressure, vaccinations, menstrual phases, alcohol consumption, symptoms, mental health) must be justified as essential to the app's primary function.

### 10.4 Prohibited Use Cases
**Rule:** No use of sensitive health data for: determining employment eligibility, insurance eligibility, or unauthorized social sharing.

### 10.5 Misleading Health Claims
**Rule:** No app that claims to diagnose/treat/cure without regulatory backing.

---

## 11. News & Magazines

### 11.1 News Self-Declaration (deadline May 27, 2026)
**Rule:** All news and magazine apps must complete a News self-declaration in Play Console. Apps without the declaration will be removed.
**Auto-checkable:** Partial (Play Console field, not APK).

### 11.2 Publisher Information
**Rule:** News apps must clearly display publisher name, contact information, and editorial info.
**Auto-checkable:** Yes – check for `aboutUs` / contact strings in resources.

### 11.3 AI-Generated News Content
**Rule:** AI-generated news must be labeled (see Section 12).

---

## 12. AI-Generated Content

### 12.1 Restricted Content Generation
**Rule:** Apps that generate content using AI must comply with all developer policies and must prohibit/prevent generation of Restricted Content (CSAM, deepfake sexual content, non-consensual material, content facilitating bullying/harassment, content enabling deceptive behavior, content inciting violence/hatred).
**Auto-checkable:** Partial
**What to check:** AI inference SDK present (`transformers`, `onnxruntime`, `openai`, `replicate`, `stability-ai`) + content filters / safety classifiers.

### 12.2 In-App Reporting/Flagging
**Rule:** AI apps must contain in-app user reporting/flagging features that allow users to report offensive content without exiting the app. Reports must inform moderation.
**Auto-checkable:** Yes – check for `report`/`flag` UI in AI-generation result screens.

### 12.3 Labeling
**Rule:** Clearly inform users when content is AI-generated. Visible notice required (e.g., "This message was generated by an AI assistant"). Applies to chat responses, generated images/music, AI avatars, generative media. Labeling must appear in the app interface and in the store description if applicable.
**Auto-checkable:** Yes – static strings in result UI, store description.

### 12.4 Generative AI for Children
**Rule:** Additional safeguards required for child-facing AI tools. No sexual, manipulative, or unsafe content for minors.

### 12.5 Deepfakes
**Rule:** Non-consensual deepfake imagery (sexual or otherwise harmful) is prohibited. Identity-swap apps must obtain subject consent and may need additional declarations.

---

## 13. Real-Money Gambling, Games & Contests

### 13.1 General Eligibility
**Rule:** Real-money gambling apps allowed only in approved countries with a valid gambling license per country/state. Apps must:
- Be free to download.
- Have an Adult Only (AO) / IARC-equivalent rating.
- Display responsible-gambling info.
- Prevent under-age wagering.
- Comply with all laws and industry standards.
**Auto-checkable:** Yes – manifest min-age metadata, store category, app country distribution settings.

### 13.2 Daily Fantasy Sports (DFS)
**Rule:** US-only or eligible non-US countries under DFS pilot. Must complete DFS application.

### 13.3 Country Pilots (May 2026)
- Mexico: DFS pilot active.
- India: DFS/Rummy pilot ended; grace period expired Jan 22, 2026.
- **Prediction Markets**: global pilot — apps must enroll by **June 1, 2026** or face removal.

### 13.4 Loot Boxes / Paid Random Mechanics
**Rule:** Must disclose odds before purchase. Cannot target children without parental safeguards.
**Auto-checkable:** Yes – flag IAP SKUs with names containing "box", "crate", "pack", "gacha" and absence of odds-disclosure screen.

---

## 14. Financial Services & Crypto

### 14.1 Financial Features Declaration
**Rule:** Any app with financial features (banking, investments, money transfer, lending, insurance, crypto) must complete the Financial Features Declaration in Play Console.

### 14.2 Personal Loans
**Rule:** Apps offering personal loans must:
- Comply with state/local laws in every target region.
- Upload license documentation for each country.
- Disclose lenders engaged with.
- Pakistan is the sole region with a limited short-term-loan (<60 days) exception.
- **No DPI/ABP loans (lending products in markets where they are not legal).**

### 14.3 Cryptocurrency Exchanges & Software Wallets
**Rule:** Custodial crypto exchanges and software wallets must declare in the Financial Features Declaration and comply with local regulation. **Non-custodial wallets are exempt** from this specific policy but still subject to general financial rules.
**Auto-checkable:** Partial — flag presence of Web3/crypto SDKs (`web3j`, `walletconnect`, `metamask-android`) for required disclosure.

### 14.4 Stock Trading / Investments
**Rule:** Must be licensed broker-dealer or equivalent in each target country.

---

## 15. Technical Requirements

### 15.1 Target SDK Level (as of May 2026)
**Rule:**
- **New apps & app updates: must target Android 15 (API 35).** Effective Aug 31, 2025; extension to Nov 1, 2025 was available.
- **Existing apps to remain available to new users: target Android 14 (API 34) minimum.** Apps targeting API 33 or lower are restricted to devices running the same or lower Android OS version.
- **Exceptions** (Wear OS, Android TV, Android Automotive): Android 14 (API 34) for new/updates; older Wear OS / TV apps targeting API 31 or lower also subject to restrictions.
**Auto-checkable:** Yes
**What to check:**
- `build.gradle` (module): `targetSdkVersion` / `targetSdk`.
- Or `AndroidManifest.xml` `<uses-sdk android:targetSdkVersion="..."/>`.
**Fix:** Bump `targetSdk 35`; address all behavior changes (background restrictions, permissions, foreground service types).

### 15.2 64-bit Architecture
**Rule:** All apps with native code must include 64-bit (arm64-v8a, x86_64) versions in addition to 32-bit.
**Auto-checkable:** Yes
**What to check:**
- `lib/arm64-v8a/` directory in APK/AAB.
- `build.gradle` `ndk { abiFilters }` includes `arm64-v8a`.
- `splits { abi { ... } }` config.
**Common rejection example:** APK contains only `lib/armeabi-v7a/`.
**Fix:** Rebuild with arm64-v8a; if using AGP ≥ 4.0, default already includes 64-bit.

### 15.3 16 KB Page Size Compatibility
**Rule:**
- Since **Nov 1, 2025**: all new apps and updates **targeting API 35+** must support 16 KB page sizes.
- From **May 1, 2026**: app updates without 16 KB support cannot be released.
**Auto-checkable:** Yes
**What to check:**
- Inspect ELF program headers of `.so` files for `p_align >= 0x4000`.
- AGP ≥ 8.5.1 and NDK ≥ r28 produce 16 KB-aligned binaries by default.
**Fix:** Upgrade AGP / NDK; rebuild native deps; verify with `objdump -p` or `zipalign -P 16 -c -v 4 app.apk`.

### 15.4 Android App Bundle (AAB)
**Rule:** New apps must publish as AAB (since August 2021). Some exceptions exist (private apps).
**Auto-checkable:** Yes – check artifact extension (`.aab`).

### 15.5 App Signing by Google Play
**Rule:** All AAB submissions require Play App Signing.
**Auto-checkable:** Partial – check signing config presence in `signingConfigs` and presence of `Play App Signing` enrollment (Console).

### 15.6 Adaptive Icons
**Rule:** Required since Android 8.0 (API 26). Provide a foreground and background drawable layer each sized 108×108 dp; only the inner 72×72 dp safe zone is guaranteed visible. Themed (monochrome) icon recommended for Android 13+.
**Auto-checkable:** Yes
**What to check:**
- `res/mipmap-anydpi-v26/ic_launcher.xml` with `<adaptive-icon>` root.
- `foreground` and `background` layer references.
- `monochrome` layer for themed icons (Android 13+).
- Play Store icon: 512×512 PNG, 32-bit, no transparency.
**Common rejection example:** Icon is a single non-adaptive PNG.
**Fix:** Add `ic_launcher.xml` adaptive-icon resource with both layers.

### 15.7 Play Store Listing Graphics
**Rule:**
- App icon: 512×512 PNG, 32-bit, **no transparency**.
- Feature graphic: 1024×500 JPG/PNG, no transparency.
- Screenshots: 2–8 per device type, JPG/24-bit PNG, 320–3840 px.
**Auto-checkable:** Yes – metadata files in fastlane/store layout.

### 15.8 Play Integrity API (recommended, sometimes required)
**Rule:** Recommended to detect tampering / unauthorized distribution. Some categories (gambling, finance, anti-piracy) may effectively require integrity verification. New "automatic protection" feature can be enabled to prompt users to install via Play.
**Auto-checkable:** Yes
**What to check:**
- Gradle dependency `com.google.android.play:integrity:*`.
- `IntegrityManager` calls server-side verification (cannot verify server side from APK; flag for review).
**Fix:** Integrate Play Integrity API for high-value transactions; verify on backend.

### 15.9 Min SDK
**Rule:** No hard minimum from Play, but `minSdkVersion 21` is widely encouraged for security. Apps using legacy SDKs may be flagged for known vulnerabilities.

### 15.10 Permissions Manifest Limit
**Rule:** AndroidManifest declares only permissions actually used. Unused / over-broad permissions are a frequent rejection reason.
**Auto-checkable:** Yes – cross-reference declared permissions with actual API call graph.

### 15.11 ProGuard / R8 obfuscation
**Rule:** Not required, but heavily obfuscated APKs without source mapping uploaded may delay review. `mappingFile` upload required for crash de-obfuscation.

---

## 16. Account Deletion

### 16.1 In-App and Web Deletion
**Rule:** Any app that allows users to create an account must provide:
1. An **in-app account-deletion** option, readily discoverable.
2. A **web URL** for account deletion (no app install required).
3. Deletion of associated user data on request.
4. Clear disclosure of any retention required for security/fraud/legal reasons.

Temporary disable/freeze does **not** count.
**Auto-checkable:** Yes
**What to check:**
- Code path leading to "Delete Account" action (search for `deleteAccount`, `delete_account`, "delete_my_account").
- Settings/Profile screen contains the option.
- Store-listing **Account Deletion URL** field (Play Console — flag for confirmation).
**Common rejection example:** App has Login but no "Delete Account" anywhere in app or website.
**Fix:** Add explicit in-app deletion flow; publish web deletion form; populate the Play Console Account Deletion URL field.

---

## 17. Data Safety Section

### 17.1 Mandatory Disclosure
**Rule:** Every app must complete the **Data Safety** section in Play Console. It is the developer's responsibility to keep it accurate and up to date.
**Auto-checkable:** Partial — check via Play Console API if integration exists.

### 17.2 Data Collected vs. Shared
**Rule:** Developers must declare each data type the app **collects** (transmits off the device) and **shares** (sends to a third party).
- "Collecting" excludes ephemeral processing not retained on device.
- "Sharing" excludes processors acting on the developer's behalf, anonymized data, court-ordered disclosures, and user-initiated shares.

### 17.3 Data Type Categories (must declare each)
- **Personal info**: name, email, user IDs, address, phone number, race & ethnicity, political/religious beliefs, sexual orientation, gender identity, other.
- **Financial info**: payment info, purchase history, credit score, other.
- **Health & Fitness**: health info, fitness info.
- **Messages**: emails, SMS/MMS, other in-app messages.
- **Photos and videos**.
- **Audio files**: voice/sound recordings, music files, other.
- **Files and docs**.
- **Calendar**.
- **Contacts**.
- **App activity**: app interactions, in-app search history, installed apps, user-generated content, other.
- **Web browsing history**.
- **App info and performance**: crash logs, diagnostics, other.
- **Device or other IDs**: includes Android Advertising ID (AAID), Android ID, IMEI, etc. (Android ID explicitly classified here since April 10, 2025.)
- **Location**: approximate, precise.

### 17.4 Purposes (must declare each)
- App functionality
- Analytics
- Developer communications
- Advertising or marketing
- Fraud prevention, security, and compliance
- Personalization
- Account management

### 17.5 Required Security Statements
- Whether data is **encrypted in transit**.
- Whether users can **request data deletion**.
- Whether developer follows the **Families Policy**.
- Whether the app has been **independently validated** against a global security standard.

### 17.6 Optional / Additional
- Justification for each data type collected.
- Whether collection is required or optional for the user.

**Auto-checkable:** Yes (partial)
**What to check:**
- Cross-reference manifest permissions and SDKs with Data Safety form (Play Console export).
- Detect SDKs not declared in Data Safety: Firebase Analytics, Crashlytics, AdMob, Facebook SDK, AppsFlyer, Adjust, Branch, Singular, Mixpanel, Amplitude, Sentry, etc.
- HTTPS-only network config.
- Encryption-in-transit: scan for `usesCleartextTraffic="true"` (negative signal).
**Common rejection example:** App uses Firebase Analytics but Data Safety form claims no data collection.
**Fix:** Update Data Safety form to reflect actual SDK data flows.

---

## 18. Foreground Services

### 18.1 Type Declarations (required for apps targeting Android 14+)
**Rule:** Each foreground service must declare a `foregroundServiceType` and request the matching permission. Apps must declare each type in Play Console (Monitor and improve → App content) with a feature description and a video demonstrating the feature.

### 18.2 Types and Permissions

| Service Type | Permission Required | Allowed Use Cases |
|---|---|---|
| `camera` | `FOREGROUND_SERVICE_CAMERA` | Continuing camera capture (video call, dashcam) |
| `connectedDevice` | `FOREGROUND_SERVICE_CONNECTED_DEVICE` | Wearables, peripherals |
| `dataSync` | `FOREGROUND_SERVICE_DATA_SYNC` | Upload/download/backup that user initiated |
| `health` | `FOREGROUND_SERVICE_HEALTH` | Exercise tracking, health monitoring |
| `location` | `FOREGROUND_SERVICE_LOCATION` | Navigation, fitness tracking |
| `mediaPlayback` | `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Audio/video playback |
| `mediaProjection` | `FOREGROUND_SERVICE_MEDIA_PROJECTION` | Screen recording / casting |
| `microphone` | `FOREGROUND_SERVICE_MICROPHONE` | Voice recording, dictation |
| `phoneCall` | `FOREGROUND_SERVICE_PHONE_CALL` | VoIP calls |
| `remoteMessaging` | `FOREGROUND_SERVICE_REMOTE_MESSAGING` | Cross-device messaging |
| `shortService` | none | <3-minute critical task; cannot start FGSes |
| `specialUse` | `FOREGROUND_SERVICE_SPECIAL_USE` | Requires `<property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value="..."/>` + Play Console declaration |
| `systemExempted` | `FOREGROUND_SERVICE_SYSTEM_EXEMPTED` | Privileged system apps only |

### 18.3 Geofencing (April 2026 update)
**Rule:** Geofencing is **no longer** an approved foreground-service use case. Developers must use the **Geofence API** (`GeofencingClient`) instead.
**Auto-checkable:** Yes – flag FGS with location type that adds/removes geofences in service code instead of using `GeofencingClient`.

### 18.4 Full-Screen Intents (`USE_FULL_SCREEN_INTENT`)
**Rule:** Restricted to high-priority interruptions (alarms, calls, etc.). Apps that misuse will have permission auto-revoked.
**Auto-checkable:** Yes – manifest permission + intended notification use case.

### 18.5 Declaration Form
**Rule:** Each foreground service type used must be declared in Play Console with description and a public video link demonstrating the feature.
**Auto-checkable:** Partial.

**Manifest snippet (correct example):**
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<application>
  <service
      android:name=".TrackingService"
      android:foregroundServiceType="location"
      android:exported="false" />
</application>
```

---

## 19. Master Static-Scan Checklist

A condensed actionable checklist for a static scanner targeting an AAB / APK and its accompanying repo:

### A. AndroidManifest.xml
- [ ] `<uses-sdk android:targetSdkVersion>` ≥ 35 (or category-specific min).
- [ ] No unused / unjustified sensitive permissions (`READ_SMS`, `READ_CALL_LOG`, `READ_CONTACTS`, `MANAGE_EXTERNAL_STORAGE`, `QUERY_ALL_PACKAGES`, `BIND_ACCESSIBILITY_SERVICE`, `BIND_VPN_SERVICE`, `PACKAGE_USAGE_STATS`, `REQUEST_INSTALL_PACKAGES`, `SYSTEM_ALERT_WINDOW`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `ACCESS_BACKGROUND_LOCATION`, `SCHEDULE_EXACT_ALARM`, health-data permissions).
- [ ] Every foreground service has `foregroundServiceType` attribute + matching `FOREGROUND_SERVICE_*` permission.
- [ ] `BLUETOOTH_SCAN` declared with `usesPermissionFlags="neverForLocation"` when location isn't needed.
- [ ] No `android:usesCleartextTraffic="true"` on `<application>` (unless intentional + documented).
- [ ] `<application android:networkSecurityConfig="@xml/network_security_config">` reviewed.
- [ ] Adaptive icon: `res/mipmap-anydpi-v26/ic_launcher.xml` with `<adaptive-icon>` having `foreground`, `background`, optionally `monochrome`.
- [ ] Launcher activity declared (`category.LAUNCHER` in main activity).
- [ ] Health Connect rationale activity present if health perms used.
- [ ] `<queries>` blocks used instead of `QUERY_ALL_PACKAGES` where possible.
- [ ] No legacy/dangerous receivers (`SMS_RECEIVED`, `BOOT_COMPLETED` with broad logic) without justification.

### B. build.gradle / Gradle Config
- [ ] `compileSdk`/`targetSdk` ≥ 35.
- [ ] `ndk.abiFilters` includes `arm64-v8a` (64-bit support).
- [ ] AGP ≥ 8.5.1, NDK ≥ r28 for 16 KB page-size compatibility.
- [ ] `com.android.billingclient:billing` ≥ 6.x present if app sells digital content.
- [ ] AdMob / ad SDK present + COPPA flags set if Families.
- [ ] Play Integrity API integrated if app handles sensitive transactions.
- [ ] R8 + mapping file upload step configured.

### C. Resources
- [ ] Store icon 512×512 PNG no transparency (in fastlane / store-listing directory).
- [ ] Feature graphic 1024×500 no transparency.
- [ ] Screenshots 2–8 valid.
- [ ] App `<string name="app_name">` ≤ 30 chars, no emojis, no rankings, no "FREE".
- [ ] Medical disclaimer string present if Health app without regulatory clearance.
- [ ] No string resources containing CSAM/hate/sexual/violent keywords (block-list).

### D. Code Patterns
- [ ] Pre-runtime-permission prominent-disclosure dialog for: background location, accessibility, all-files-access, package visibility, contacts (broad), health connect.
- [ ] In-app **Delete Account** action implemented (search for `deleteAccount`/`delete_account`).
- [ ] UGC apps: in-app **report** and **block** UI for both users and content.
- [ ] AI-generation result screens: flag/report button + AI label.
- [ ] Subscription purchase screen: visible price, period, trial conditions.
- [ ] Interstitial ads not in `onCreate`/`onResume` of first Activity.
- [ ] No `DexClassLoader`/`PathClassLoader` for downloaded code.
- [ ] No `REQUEST_INSTALL_PACKAGES` + downloaded APK install flow.
- [ ] No hidden launcher pattern (`setComponentEnabledSetting(..., COMPONENT_ENABLED_STATE_DISABLED)` on the launcher alias).
- [ ] Sensitive data not stored in plaintext `SharedPreferences` (prefer `EncryptedSharedPreferences`).
- [ ] HTTPS-only network calls (no `http://` hard-coded endpoints to user-data services).
- [ ] Photo Picker (`PickVisualMedia`) preferred over `READ_MEDIA_IMAGES` when feasible.
- [ ] Contact Picker preferred over `READ_CONTACTS` when feasible.

### E. Play Console Submissions Required (manual / API-driven verification)
- [ ] Privacy Policy URL.
- [ ] Data Safety section completed and matches actual SDK behavior.
- [ ] Account Deletion URL filled (if app has accounts).
- [ ] Permissions Declarations for any of: SMS/Call Log, All Files Access, QUERY_ALL_PACKAGES, Accessibility, Health Apps, Photo/Video, Background Location, VPN Service.
- [ ] Foreground Service Types declaration with feature descriptions and video demos for each type used.
- [ ] Financial Features Declaration (if applicable).
- [ ] News Self-Declaration (if news/magazine app; deadline May 27, 2026).
- [ ] Health Apps Declaration + Organization Account verified (deadline Jan 28, 2026).
- [ ] Real-Money Gambling registration + license for each country.
- [ ] Families program opt-in if targeting children + Families Self-Certified Ads SDK.
- [ ] AI Content disclosure if generative-AI app.
- [ ] Prediction Market pilot enrollment (deadline June 1, 2026, if applicable).

---

## Sources

- [Developer Policy Center](https://play.google/developer-content-policy/)
- [Developer Program Policy (Play Console Help, April 15 2026)](https://support.google.com/googleplay/android-developer/answer/16933379)
- [Policy announcement: April 15, 2026](https://support.google.com/googleplay/android-developer/answer/16926792)
- [Permissions and APIs that Access Sensitive Information](https://support.google.com/googleplay/android-developer/answer/16558241)
- [Use of SMS or Call Log permission groups](https://support.google.com/googleplay/android-developer/answer/10208820)
- [Use of MANAGE_EXTERNAL_STORAGE](https://support.google.com/googleplay/android-developer/answer/10467955)
- [Use of QUERY_ALL_PACKAGES](https://support.google.com/googleplay/android-developer/answer/10158779)
- [Understanding Google Play's VpnService policy](https://support.google.com/googleplay/android-developer/answer/12564964)
- [Understanding foreground service and full-screen intent requirements](https://support.google.com/googleplay/android-developer/answer/13392821)
- [Foreground service types are required (Android 14)](https://developer.android.com/about/versions/14/changes/fgs-types-required)
- [Declare foreground services and request permissions](https://developer.android.com/develop/background-work/services/fgs/declare)
- [Data Safety Section requirements](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Best practices for prominent disclosure and consent](https://support.google.com/googleplay/android-developer/answer/11150561)
- [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Inappropriate Content](https://support.google.com/googleplay/android-developer/answer/9878810)
- [Deceptive Behavior](https://support.google.com/googleplay/android-developer/answer/9888077)
- [Malware](https://support.google.com/googleplay/android-developer/answer/9888380)
- [Device and Network Abuse](https://support.google.com/googleplay/android-developer/answer/16559646)
- [User Generated Content](https://support.google.com/googleplay/android-developer/answer/9876937)
- [UGC moderation & incidental sexual content](https://support.google.com/googleplay/android-developer/answer/12923286)
- [Understanding Google Play's AI-Generated Content policy](https://support.google.com/googleplay/android-developer/answer/14094294)
- [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Families Self-Certified Ads SDK Program](https://support.google.com/googleplay/android-developer/answer/9900633)
- [Health Content and Services](https://support.google.com/googleplay/android-developer/answer/16679511)
- [Real-Money Gambling, Games, and Contests](https://support.google.com/googleplay/android-developer/answer/9877032)
- [Country/region allowances for gambling apps](https://support.google.com/googleplay/android-developer/answer/12256011)
- [Financial Services](https://support.google.com/googleplay/android-developer/answer/9876821)
- [Cryptocurrency Exchanges and Software Wallets](https://support.google.com/googleplay/android-developer/answer/16329703)
- [Understanding Google Play's app account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
- [Ads policy](https://support.google.com/googleplay/android-developer/answer/9857753)
- [Better Ads Experiences policy](https://support.google.com/googleplay/android-developer/answer/12271244)
- [Target SDK level requirements (developer.android.com)](https://developer.android.com/google/play/requirements/target-sdk)
- [Support 16 KB page sizes](https://developer.android.com/guide/practices/page-sizes)
- [Play Integrity API](https://developer.android.com/google/play/integrity)
- [Get a user-resettable advertising ID](https://developer.android.com/identity/ad-id)
- [Google Play icon design specifications](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)
- [Advertising ID policy](https://support.google.com/googleplay/android-developer/answer/6048248)
- [Declare permissions for your app](https://support.google.com/googleplay/android-developer/answer/9214102)
