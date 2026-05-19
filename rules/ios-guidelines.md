# Apple App Store Review Guidelines — Plugin Knowledge Base

**Source:** https://developer.apple.com/app-store/review/guidelines/
**Captured:** 2026-05-19
**Purpose:** Structured reference for a Claude Code plugin that scans iOS/macOS apps for App Store compliance issues.

For each guideline:
- **Rule:** verbatim/near-verbatim official text
- **Auto-checkable:** Yes (deterministic file/code/config check), Partial (heuristics possible, requires confirmation), No (requires human judgment of content/intent)
- **What to check:** concrete files, plist keys, code patterns, entitlements, strings, SDKs
- **Common rejection example:** the rejection pattern reviewers cite
- **Fix:** the canonical remediation

---

# SECTION 1 — SAFETY

## 1.1 Objectionable Content

**Rule:** Apps should not include content that is offensive, insensitive, upsetting, intended to disgust, in exceptionally poor taste, or just plain creepy.
**Auto-checkable:** No
**What to check:** Manual content review of UI strings, image assets, descriptions, in-app feeds.
**Common rejection example:** Offensive imagery in `Assets.xcassets`, slurs in `Localizable.strings`.
**Fix:** Remove objectionable content; add moderation.

## 1.1.1 Discriminatory / Mean-Spirited Content
**Rule:** Defamatory, discriminatory, or mean-spirited content, including references or commentary about religion, race, sexual orientation, gender, national/ethnic origin, or other targeted groups, particularly if the app is likely to humiliate, intimidate, or harm a targeted individual or group. Professional political satirists and humorists are generally exempt.
**Auto-checkable:** Partial
**What to check:** Scan localized strings and bundled text resources for hate-slur dictionary matches; review app description in `App Store Connect` metadata.
**Common rejection example:** App targeting specific religious or ethnic group with derogatory commentary.
**Fix:** Remove or contextualize; add moderation if user-generated.

## 1.1.2 Realistic Violence
**Rule:** Realistic portrayals of people or animals being killed, maimed, tortured, or abused, or content that encourages violence. "Enemies" within the context of a game cannot solely target a specific race, culture, real government, corporation, or any other real entity.
**Auto-checkable:** No
**What to check:** Manual review of game assets, enemy taxonomy, lore text.
**Fix:** Use fictional enemies; remove gratuitous gore.

## 1.1.3 Weapons / Dangerous Objects
**Rule:** Depictions that encourage illegal or reckless use of weapons and dangerous objects, or facilitate the purchase of firearms or ammunition.
**Auto-checkable:** Partial
**What to check:** Look for firearms-commerce SDKs, payment flows tagged "ammo," "firearm," "gun shop"; in-app catalog strings.
**Fix:** Remove purchase flows for regulated items; restrict to educational context.

## 1.1.4 Pornographic / Sexual Content
**Rule:** Overtly sexual or pornographic material... This includes "hookup" apps and other apps that may include pornography or be used to facilitate prostitution, or human trafficking and exploitation.
**Auto-checkable:** Partial
**What to check:** Age rating in `App Store Connect` metadata vs content; presence of adult-content SDKs.
**Fix:** Remove explicit content or distribute via 17+ rating with proper moderation.

## 1.1.5 Inflammatory Religious Commentary
**Rule:** Inflammatory religious commentary or inaccurate or misleading quotations of religious texts.
**Auto-checkable:** No
**What to check:** Manual review.
**Fix:** Add citations; remove inflammatory framing.

## 1.1.6 False Information / Trick Apps
**Rule:** False information and features, including inaccurate device data or trick/joke functionality, such as fake location trackers. Stating that the app is "for entertainment purposes" won't overcome this guideline. Apps that enable anonymous or prank phone calls or SMS/MMS messaging will be rejected.
**Auto-checkable:** Partial
**What to check:**
- App name/description for words: "fake", "prank", "spoof", "joke", "fool", "fake call", "fake GPS", "fake location".
- Code patterns that override `CLLocationManager` with hard-coded coords.
- Anonymous SMS/MMS APIs (`MessageUI` used for unsolicited sending).
**Common rejection example:** "Fake GPS" location spoofers; "fake caller ID" prank apps.
**Fix:** Remove deceptive functionality.

## 1.1.7 Profiting from Current Events
**Rule:** Harmful concepts which capitalize or seek to profit on recent or current events, such as violent conflicts, terrorist attacks, and epidemics.
**Auto-checkable:** No
**What to check:** Manual review of timeliness of content vs. tragic events.
**Fix:** Reframe to educational/non-exploitative.

## 1.2 User-Generated Content
**Rule:** Apps with user-generated content or social networking services must include: (a) method for filtering objectionable material, (b) mechanism to report offensive content with timely response, (c) ability to block abusive users, (d) published contact information.
**Auto-checkable:** Partial
**What to check:**
- Presence of "Report" UI action in source (`reportUser`, `reportContent`, `flag`).
- Presence of "Block user" function.
- Contact info in `App Store Connect` Support URL.
- Profanity-filter or moderation SDK (Hive, Perspective, OpenAI Moderation).
**Common rejection example:** Social app with comments but no Report/Block buttons.
**Fix:** Add report, block, filter; publish contact info.

## 1.2.1 Creator Content
**Rule:** Creator apps featuring content from non-developer "creators" (video, articles, audio, casual games) must follow all Guidelines including 1.2 (moderation) and 3.1.1 (IAP for purchases). Must indicate which content requires additional purchase.
**Auto-checkable:** Partial
**What to check:** Creator-monetization SDKs, in-app payment flows that bypass IAP.
**Fix:** Use IAP for all digital purchases.

## 1.2.1(a) Creator Content Age Restriction
**Rule:** Creator apps must provide a way for users to identify content that exceeds the app's age rating, and use an age restriction mechanism based on verified or declared age to limit access by underage users.
**Auto-checkable:** Partial
**What to check:** Age-gating code paths; presence of declared DOB capture; content age-rating metadata for creator items.
**Fix:** Implement age verification gate.

## 1.3 Kids Category
**Rule:** Kids Category apps must not include links out of the app, purchasing opportunities, or other distractions unless behind a parental gate. May not send personally identifiable info or device info to third parties. Should not include third-party analytics or advertising (with narrow exceptions for non-IDFA, contextual ads with human review).
**Auto-checkable:** Yes
**What to check:**
- `Info.plist` family category / App Store Connect category set to "Kids".
- Any third-party analytics SDK present (Firebase Analytics, Mixpanel, Amplitude, AppsFlyer, Adjust, Branch).
- Any ad SDK present (Google Mobile Ads, AdMob, Meta Audience Network, AppLovin, Unity Ads, IronSource).
- IDFA usage: `ASIdentifierManager`, `advertisingIdentifier`.
- Outbound links without parental gate (any `UIApplication.shared.open(URL)` lacking gate UI).
- IAP UI without parental gate.
**Common rejection example:** Kids app embedding Firebase Analytics with IDFA collection.
**Fix:** Remove analytics/ads or use Kids-compliant variants; add parental gate before external links and IAP.

## 1.4 Physical Harm
**Rule:** Apps that risk physical harm may be rejected.
**Auto-checkable:** No
**What to check:** Manual review of dangerous-activity prompts.

## 1.4.1 Medical Apps
**Rule:** Medical apps must clearly disclose data and methodology; cannot claim x-rays, blood pressure, body temperature, glucose, or blood oxygen using only device sensors. Should remind users to consult doctor.
**Auto-checkable:** Partial
**What to check:**
- App description / `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription` for medical claims.
- Code reading `CMDeviceMotion`, `AVCaptureDevice` (flash/PPG) used as BP/SpO2 measurement.
- "blood pressure", "x-ray", "glucose", "SpO2", "temperature" in marketing copy with sensor-only implementation.
**Common rejection example:** Camera-flash based blood-pressure measurement.
**Fix:** Add hardware accessory or remove claim; add medical disclaimer.

## 1.4.2 Drug Dosage Calculators
**Rule:** Must come from manufacturer, hospital, university, insurance, pharmacy, approved entity, or FDA approval.
**Auto-checkable:** Partial
**What to check:** Developer name in `App Store Connect`; presence of dosage calculation logic.
**Fix:** Submit under approved entity.

## 1.4.3 Drugs / Tobacco / Alcohol
**Rule:** No encouragement of tobacco, vape, illegal drugs, excessive alcohol; no facilitation of sale of controlled substances (except licensed pharmacies / legal cannabis dispensaries) or tobacco.
**Auto-checkable:** Partial
**What to check:** Catalog/menu strings, payment flows for restricted goods, geo-restriction logic (only legal regions).
**Fix:** Geo-restrict; require licensing proof; remove from prohibited categories.

## 1.4.4 DUI Checkpoints
**Rule:** May only display DUI checkpoints published by law enforcement; never encourage drunk driving or reckless behavior.
**Auto-checkable:** Partial
**What to check:** Data source URL; user-reported vs official.

## 1.4.5 Risky Physical Activities
**Rule:** Apps should not urge customers to participate in activities (bets, challenges) or use devices in ways that risk physical harm.
**Auto-checkable:** No

## 1.5 Developer Information
**Rule:** App and Support URL must include easy way to contact developer. Wallet passes must include valid issuer contact info.
**Auto-checkable:** Yes
**What to check:**
- `App Store Connect` Support URL field is set, reachable (HTTP 200).
- App contains visible "Contact" / "Support" UI.
- `.pkpass` files contain `organizationName` and contact info.
**Common rejection example:** Support URL is 404 or placeholder.
**Fix:** Add live support page and in-app contact.

## 1.6 Data Security
**Rule:** Apps should implement appropriate security measures to ensure proper handling of user information and prevent unauthorized use/disclosure/access by third parties.
**Auto-checkable:** Yes
**What to check:**
- ATS exceptions in `Info.plist` (`NSAppTransportSecurity` with `NSAllowsArbitraryLoads=true`).
- Hard-coded API keys / secrets in source (regex for `AKIA`, `sk_live_`, `xoxb-`, `AIza`, JWT tokens).
- Plaintext credentials in `UserDefaults` (keys like `password`, `token`).
- Use of `MD5`/`SHA1` for security purposes (`CommonCrypto`).
- Keychain absent for credential storage.
- HTTPS pinning absent in financial/health apps.
- `WKWebView` with `javaScriptEnabled` and untrusted content.
**Common rejection example:** Storing auth tokens in `NSUserDefaults`; ATS disabled globally.
**Fix:** Use Keychain Services; enforce ATS; rotate exposed secrets; pin certificates.

## 1.7 Reporting Criminal Activity
**Rule:** Apps for reporting alleged criminal activity must involve local law enforcement and only be offered in countries/regions with active involvement.
**Auto-checkable:** Partial
**What to check:** Geo-availability metadata; integration evidence with law-enforcement endpoint.

---

# SECTION 2 — PERFORMANCE

## 2.1 App Completeness
**Rule (a):** Submissions should be final versions with all metadata and functional URLs. Test on-device. Include demo account or built-in demo mode. App bundles that crash or have obvious technical problems will be rejected.
**Rule (b):** IAP must be complete, up-to-date, visible to reviewer.
**Auto-checkable:** Yes
**What to check:**
- Placeholder strings: "Lorem ipsum", "TODO", "FIXME", "TBD", "Coming soon", "Test", "[placeholder]" in user-facing strings.
- Broken URLs in `Info.plist`, support URL, in-app links (HTTP check).
- Crash on launch (run binary in simulator; check for `__crashed`).
- Demo credentials present in App Review Notes if login required.
- IAP products in `App Store Connect` match `Product IDs` referenced via `StoreKit` (`SKProductsRequest`).
**Common rejection example:** "Lorem ipsum" left in onboarding; broken privacy URL; missing demo account.
**Fix:** Replace placeholders; verify all links; add demo account.

## 2.2 Beta Testing
**Rule:** Demos/betas/trials don't belong on App Store — use TestFlight.
**Auto-checkable:** Partial
**What to check:** App name/description containing "beta", "test", "trial version".
**Fix:** Move to TestFlight.

## 2.3 Accurate Metadata
**Rule:** Metadata, privacy info, description, screenshots, previews must accurately reflect app's core experience and be up-to-date.

## 2.3.1 Hidden Features / Misleading Marketing
**Rule (a):** No hidden, dormant, or undocumented features. All new features must be described in Notes for Review. No misleading marketing (e.g., iOS virus/malware scanners) or false pricing.
**Rule (b):** Egregious or repeated dishonesty → removal from Developer Program.
**Auto-checkable:** Partial
**What to check:**
- Feature flags toggling hidden functionality (`#if DEBUG`, remote config defaults).
- App description claiming "antivirus", "malware scanner" for iOS.
- Hidden region-based or remote-toggle logic.
**Fix:** Document all features; remove deceptive marketing.

## 2.3.2 IAP Disclosure
**Rule:** App description, screenshots, previews must indicate when items/levels/subscriptions require additional purchase. Properly handle `SKPaymentTransactionObserver`'s `paymentQueue:shouldAddStorePayment:forProduct:`.
**Auto-checkable:** Yes
**What to check:**
- Conformance to `SKPaymentTransactionObserver` and implementation of `paymentQueue(_:shouldAddStorePayment:for:)`.
- IAP products promoted on App Store have valid handlers.
**Fix:** Implement promoted IAP handler.

## 2.3.3 Screenshots
**Rule:** Screenshots should show app in use, not just title art, login page, or splash screen.
**Auto-checkable:** No (image content review)

## 2.3.4 Previews
**Rule:** Previews may only use video screen captures of the app itself.
**Auto-checkable:** No

## 2.3.5 Category
**Rule:** Select the most appropriate category. Apple may change if mis-categorized.
**Auto-checkable:** No

## 2.3.6 Age Rating
**Rule:** Answer age rating questions honestly.
**Auto-checkable:** Partial
**What to check:** Declared age rating vs content scan (violence/sex/gambling references); media warnings.
**Fix:** Update age rating answers.

## 2.3.7 App Name / Keywords / Subtitle
**Rule:** Unique app name (≤30 characters), no trademarked or popular-app keywords, no prices/terms in name/subtitle.
**Auto-checkable:** Yes
**What to check:**
- `CFBundleDisplayName` length ≤ 30 characters.
- App name does not include other-brand trademarks (regex check vs trademark dictionary).
- Subtitle ≤ 30 chars and free of price/term language.
- Keywords field free of competitor names.
**Fix:** Trim name; remove trademarked terms.

## 2.3.8 Metadata Appropriateness
**Rule:** Metadata (icons, screenshots, previews) must adhere to 4+ rating regardless of app rating. "For Kids"/"For Children" reserved for Kids Category. App name/icons must be similar to avoid confusion.
**Auto-checkable:** Partial
**What to check:**
- Marketing string scan for "For Kids", "For Children" when not Kids Category.
- Icon variants (`CFBundleAlternateIcons`) similar to primary icon.
**Fix:** Remove restricted terms; align alternate icons.

## 2.3.9 Rights to Materials
**Rule:** You must secure rights to materials in icons, screenshots, previews. Use fictional account info, not real-person data.
**Auto-checkable:** No

## 2.3.10 Other Platforms in Metadata
**Rule:** Don't include names, icons, or imagery of other mobile platforms or alternative app marketplaces unless approved.
**Auto-checkable:** Partial
**What to check:** App description / screenshots for "Android", "Google Play", "Get it on Play Store", "Windows Phone" references.
**Fix:** Remove other-platform references.

## 2.3.11 Pre-Order
**Rule:** Pre-order apps must be complete; released app must not be materially different.
**Auto-checkable:** No

## 2.3.12 What's New
**Rule:** Clearly describe new features in "What's New" text.
**Auto-checkable:** Partial
**What to check:** Release notes are non-generic (not just "Bug fixes" when version is major).

## 2.3.13 In-App Events
**Rule:** Event metadata must be accurate and pertain to event itself. Event must happen at times/dates selected. Deep link must direct to proper destination. Monetization must follow Section 3.
**Auto-checkable:** Partial
**What to check:** Event deep-link URL handling resolves correctly.

## 2.4 Hardware Compatibility

### 2.4.1 iPad Compatibility
**Rule:** iPhone apps should run on iPad whenever possible.
**Auto-checkable:** Yes
**What to check:** `UIDeviceFamily` in `Info.plist` includes `2` (iPad); `TARGETED_DEVICE_FAMILY` build setting.
**Fix:** Enable iPad support unless technically impossible.

### 2.4.2 Power / Resources
**Rule:** Design app to use power efficiently. No rapid battery drain, excessive heat, or unnecessary strain. No unrelated background processes (e.g., crypto mining).
**Auto-checkable:** Yes
**What to check:**
- Crypto-mining libraries: `cgminer`, `xmrig`, `coinhive`, references to "mining".
- Excessive background `CADisplayLink`, polling loops without throttle.
- Disabled idle timer always (`UIApplication.shared.isIdleTimerDisabled = true`).
- Excessive writes to disk (test in Instruments).
**Common rejection example:** Embedded Coinhive miner in WebView.
**Fix:** Remove mining; throttle CPU; respect background modes.

### 2.4.3 Apple TV Inputs
**Rule:** tvOS apps usable with Siri remote / third-party game controllers without other hardware.
**Auto-checkable:** Yes
**What to check:** `GCController` support; gesture handlers in tvOS app.

### 2.4.4 No System Modifications
**Rule:** Apps must not suggest device restart or modifications to system settings unrelated to core functionality (e.g., don't ask to turn off Wi-Fi).
**Auto-checkable:** Partial
**What to check:** UI strings instructing users to change system settings unrelated to feature.

### 2.4.5 Mac App Store Specific
**Rule:**
- **(i)** Appropriately sandboxed; use macOS APIs for modifying other-app data.
- **(ii)** Packaged via Xcode; no third-party installers; self-contained bundles.
- **(iii)** No auto-launch without consent; no automatic Dock add or desktop shortcuts.
- **(iv)** No downloading standalone apps, kexts, code beyond what was reviewed.
- **(v)** No root escalation or setuid.
- **(vi)** No license screen at launch, no license keys, no own copy protection.
- **(vii)** Mac App Store distribution for updates only.
- **(viii)** Run on currently shipping OS; no deprecated tech (e.g., Java).
- **(ix)** All localization in single bundle.

**Auto-checkable:** Yes
**What to check:**
- `com.apple.security.app-sandbox` entitlement = `true`.
- No third-party installer scripts (`.pkg` with non-Apple signing).
- No `LaunchAgents` / `LaunchDaemons` plists in bundle.
- No `setuid` bit on binaries.
- No license-key UI on launch.
- No bundled JRE.

## 2.5 Software Requirements

### 2.5.1 Public APIs / Current OS
**Rule:** Apps may only use public APIs and must run on currently shipping OS. Use APIs/frameworks for intended purposes.
**Auto-checkable:** Yes
**What to check:**
- Private API usage: dlsym to `_UIKit`, undeclared selectors, references to symbols starting with `_` from frameworks.
- Use of `objc_msgSend` with non-public selectors.
- Deployment target reasonably current.
- HomeKit not used for non-home purposes; HealthKit integrated with Health app.
**Common rejection example:** Calling private `_UIApplicationSnapshot` or `setBackgroundStyle:` private selector.
**Fix:** Replace with public APIs.

### 2.5.2 Self-Contained Bundle / No Code Download
**Rule:** Apps must be self-contained, not read/write outside container, not download/install/execute code that changes features (except educational coding apps with viewable source).
**Auto-checkable:** Yes
**What to check:**
- Use of `JSContext`, `WKWebView` to execute remote JS that changes app features.
- `Bundle.loadAndReturnError(for:)` on remote bundles.
- `dlopen` / `dyld` for remote dylibs.
- React Native / CodePush / Expo OTA updates that change feature set (versus content updates).
- Remote configuration that gates entire UI flows undisclosed to reviewer.
- File writes to paths outside `Documents/`, `Library/`, `tmp/`.
**Common rejection example:** Using CodePush to swap entire app behavior post-approval.
**Fix:** Limit OTA to UI assets/content; ship features in binary.

### 2.5.3 No Viruses / Disruption
**Rule:** Apps that transmit viruses, files, or code that disrupts OS/hardware (including Push, Game Center) will be rejected. Egregious/repeat → removal.
**Auto-checkable:** Yes
**What to check:** Static AV scan of bundle resources; known-malicious SDKs.

### 2.5.4 Background Modes
**Rule:** Multitasking apps may only use background services for intended purposes (VoIP, audio playback, location, task completion, local notifications, etc.).
**Auto-checkable:** Yes
**What to check:** `UIBackgroundModes` in `Info.plist`: each declared mode must match actual app functionality.
- `audio` → app must play audio in background.
- `location` → app must have location-tracking feature.
- `voip` → app must integrate `PushKit` + `CallKit`.
- `fetch`, `processing`, `remote-notification` → must be justified.
**Common rejection example:** Declaring `location` mode for a non-location app to keep app alive.
**Fix:** Remove unused background modes.

### 2.5.5 IPv6
**Rule:** Apps must be fully functional on IPv6-only networks.
**Auto-checkable:** Partial
**What to check:**
- Hard-coded IPv4 addresses (regex `\b\d+\.\d+\.\d+\.\d+\b` in non-test code).
- Use of `inet_aton`, `sockaddr_in` without IPv6 fallback (`getaddrinfo` is correct).
- DNS resolver code that strips AAAA records.
**Fix:** Use `URLSession` + `getaddrinfo`; never hard-code v4.

### 2.5.6 Web Browsing — WebKit Only
**Rule:** Apps that browse the web must use the appropriate WebKit framework. May apply for alt-browser-engine entitlement.
**Auto-checkable:** Yes
**What to check:**
- Imports / linked libraries: any non-WebKit browser engine (Chromium embedded framework, Gecko).
- Bundled `Chromium.framework`, `CEF.framework`.
- If alt-engine entitlement present: `com.apple.developer.browser-engine-host`.
**Fix:** Use `WKWebView` / `SFSafariViewController`.

### 2.5.7 Intentionally Omitted

### 2.5.8 Alternate Home Screens
**Rule:** Apps that create alternate desktop/home screen environments will be rejected.
**Auto-checkable:** Partial
**What to check:** App description and code that mimics SpringBoard / Launcher.

### 2.5.9 Standard Switches / UI Behaviors
**Rule:** Apps that alter/disable standard switches (Volume, Ring/Silent) or native UI elements will be rejected. Don't block links out to other apps.
**Auto-checkable:** Partial
**What to check:**
- Custom volume HUD overriding system.
- Hijacking of universal links / `canOpenURL` to prevent out-app navigation.

### 2.5.10 Intentionally Omitted

### 2.5.11 SiriKit and Shortcuts
**Rule:**
- **(i)** Only sign up for intents the app can handle without another app.
- **(ii)** Plist vocabulary must relate to app/company; no third-party app names; no generic terms.
- **(iii)** Resolve Siri request directly without ads or marketing between request and fulfillment.

**Auto-checkable:** Yes
**What to check:**
- `IntentsSupported` in `Info.plist` matches `INExtension` handled intents.
- `AppIntentVocabulary.plist` aliases are app-specific.
- No ad/promotion code path in intent handlers.

### 2.5.12 CallKit / SMS Fraud Extension
**Rule:** Only block phone numbers confirmed as spam. Marketing must explain blocking criteria. Data may not be used for tracking, profiling, sale, or unrelated purposes.
**Auto-checkable:** Yes
**What to check:**
- `CXCallDirectoryProvider` subclass present.
- Data flow from `CallKit` to analytics/ad SDKs.
- Privacy policy disclosure of blocking criteria.

### 2.5.13 Face Authentication via LocalAuthentication
**Rule:** Apps using facial recognition for account auth must use `LocalAuthentication` (not ARKit / other face tech) where possible. Alternate method for users under 13.
**Auto-checkable:** Yes
**What to check:**
- `LAContext` + `.biometryType == .faceID` for auth flows.
- Auth flow does NOT use `ARFaceTrackingConfiguration` or `Vision.VNDetectFaceRectanglesRequest` for login.
- Alternate auth path for users < 13 (DOB capture + branching).

### 2.5.14 Recording User Activity
**Rule:** Apps must request explicit user consent and provide visual/audible indication when recording, logging, or making a record of user activity (camera, microphone, screen recordings, user inputs).
**Auto-checkable:** Yes
**What to check:**
- `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSScreenCaptureUsageDescription` in `Info.plist`.
- Recording UI shows red indicator / on-air light.
- `ReplayKit` use displays system overlay.
- No silent background audio recording.

### 2.5.15 File Picker — Files App / iCloud
**Rule:** Apps for viewing/selecting files should include items from the Files app and iCloud documents.
**Auto-checkable:** Yes
**What to check:** Use of `UIDocumentPickerViewController` / `UIDocumentBrowserViewController` for file selection; `NSUbiquitousContainers` configured.

### 2.5.16 Widgets / Extensions / Notifications
**Rule:** Must be related to content/functionality of main app.
**Rule 2.5.16(a):** App Clip features must be in the main app binary; App Clips may not contain advertising.
**Auto-checkable:** Yes
**What to check:**
- Widget extension functionality is a subset of main app.
- App Clip target (`.appclip` extension) has no embedded ad SDKs.

### 2.5.17 Matter
**Rule:** Apps supporting Matter must use Apple's Matter framework for pairing. Other Matter components must be CSA-certified.
**Auto-checkable:** Yes
**What to check:** Use of `MatterSupport` framework; third-party Matter libraries are CSA-certified versions.

### 2.5.18 Advertising Limitations
**Rule:** Display advertising limited to main app binary — not in extensions, App Clips, widgets, notifications, keyboards, watchOS apps. Ads must be appropriate for age rating, allow user to see targeting info, must not target by sensitive data (HealthKit, ClassKit, Kids). Interstitials must clearly indicate they are ads with easily accessible close buttons and report mechanism.
**Auto-checkable:** Yes
**What to check:**
- Ad SDK linkage in extension targets (`*.appex` Mach-O `LC_LOAD_DYLIB` for `GoogleMobileAds`, `FBAudienceNetwork`, etc.) → must be zero.
- Ad SDK linkage in watchOS target → zero.
- Ad SDK linkage in App Clip target → zero.
- Ad SDK linkage in keyboard extension → zero.
- Interstitial close button hit-target ≥ 44pt.
- "Report ad" UI present.

---

# SECTION 3 — BUSINESS

## 3.1 Payments

### 3.1.1 In-App Purchase
**Rule:** Unlocking features/functionality (subscriptions, in-game currencies, levels, premium content, full version unlocks) must use IAP. No license keys, AR markers, QR codes, crypto/wallet workarounds. Tips via IAP currency allowed. Credits and currency may not expire; must have restore mechanism. Gifting allowed; refunds only to original purchaser. Mac App Store may host plug-ins via other mechanisms. Loot boxes must disclose odds. Digital gift cards/vouchers redeemable for digital goods must use IAP; physical gift cards may use other payment. Free time-based trials via Non-Consumable IAP at Tier 0 "XX-day Trial". NFTs: minting/listing/transfer via IAP; viewing own NFTs OK if no unlock; browsing NFT collections OK if no external buy buttons (except US storefront).
**Auto-checkable:** Yes
**What to check:**
- Use of `StoreKit` (`SKProductsRequest`, `Product.products(for:)`, `Transaction`) for digital purchases.
- Third-party payment SDKs (Stripe, Braintree, Razorpay, PayPal, Square, Adyen) used for digital content unlock.
- Crypto wallet integrations: WalletConnect, web3.swift, MetaMask SDK — if used to unlock features.
- "License key" UI in source.
- Loot-box mechanic with no probability disclosure in UI/copy.
- Restore-purchases button present (`SKPaymentQueue.restoreCompletedTransactions()` / `AppStore.sync()`).
- Trial product IDs match "XX-day Trial" naming.
**Common rejection example:** Using Stripe to sell subscription that unlocks app features.
**Fix:** Move digital-content unlocks to StoreKit IAP.

### 3.1.1(a) Link to Other Purchase Methods
**Rule:** Apps in specific regions may use StoreKit External Purchase Link Entitlements; music streaming apps in specific regions may use Music Streaming Services Entitlements. US storefront does not require entitlements. Outside permitted entitlements/storefronts, no buttons/external links/CTAs to non-IAP purchasing.
**Auto-checkable:** Yes
**What to check:**
- Entitlements: `com.apple.developer.storekit.external-purchase`, `com.apple.developer.storekit.external-link.account`, `com.apple.developer.storekit.external-purchase-link`.
- Region targeting matches entitlement allowed regions.
- Use of `ExternalPurchase` / `ExternalPurchaseLink` StoreKit APIs.
- Outbound payment URLs in non-US/non-entitled storefronts.

### 3.1.2 Subscriptions
**Rule:** Auto-renewable subscriptions allowed in any category. Must follow 3.1.2(a)–(c).

### 3.1.2(a) Permissible Uses
**Rule:** Provide ongoing value; subscription period ≥ 7 days; must be available across all user's devices. Examples: new game levels, episodic content, multiplayer, consistent substantive updates, large media libraries, SaaS, cloud. Subscriptions may coexist with à la carte. Streaming game subscriptions may share across third-party apps; must be downloaded directly from App Store. Subscription must not require extra tasks (post on social, upload contacts) to access value. May include consumable credits. Existing customers must keep primary functionality if business model changes. Free trials via App Store Connect setup. No scam/bait-and-switch. Cellular carriers may bundle.
**Auto-checkable:** Yes
**What to check:**
- All auto-renewable subscriptions in `App Store Connect` have period ≥ 7 days.
- Subscription unlocks not gated by social-post / referral tasks.
- Cross-device sync (subscription tied to Apple ID) implemented.

### 3.1.2(b) Upgrades / Downgrades
**Rule:** Seamless upgrade/downgrade; users should not inadvertently subscribe to multiple variations of the same thing.
**Auto-checkable:** Yes
**What to check:** Subscription Groups in `App Store Connect` properly configured so each tier is in same group.

### 3.1.2(c) Subscription Information
**Rule:** Before subscribing, clearly describe what user gets for the price. Communicate Schedule 2 requirements (price, period, renewal, cancellation).
**Auto-checkable:** Yes
**What to check:**
- Pre-purchase UI displays: title, length of subscription, content/services, price per period, auto-renewal disclosure, "cancel anytime" language.
- Terms of Use (EULA) link.
- Privacy Policy link.
**Common rejection example:** Paywall missing renewal/cancellation disclosure.
**Fix:** Add full disclosure block + ToS/Privacy links.

### 3.1.3 Other Purchase Methods (intro)
**Rule:** The listed apps may use non-IAP. Cannot encourage non-IAP purchasing inside the app except on US storefront and per 3.1.1(a)/3.1.3(a). Out-of-app communications about other purchase methods allowed.

### 3.1.3(a) "Reader" Apps
**Rule:** Reader apps (magazines, newspapers, books, audio, music, video) may allow access to previously purchased content/subscriptions. May offer free account creation and management. Reader app developers may apply for External Link Account Entitlement.
**Auto-checkable:** Yes
**What to check:** Reader app category match; entitlement `com.apple.developer.storekit.external-link.account`.

### 3.1.3(b) Multiplatform Services
**Rule:** Multi-platform apps may allow access to content/subscriptions/features acquired elsewhere, including consumables in multi-platform games, provided items are also available as IAP.
**Auto-checkable:** Partial
**What to check:** Items unlocked from external account are also offered as IAP products.

### 3.1.3(c) Enterprise Services
**Rule:** B2B-only apps may allow enterprise users to access previously-purchased content/subscriptions. Consumer/family sales must use IAP.

### 3.1.3(d) Person-to-Person Services
**Rule:** 1:1 real-time services (tutoring, medical consult, real-estate tours, fitness training) may use other payment methods. 1:few / 1:many must use IAP.
**Auto-checkable:** Partial
**What to check:** Service model description; group session features.

### 3.1.3(e) Physical Goods / Services Outside App
**Rule:** Physical goods or services consumed outside the app must NOT use IAP — use Apple Pay or credit card.
**Auto-checkable:** Partial
**What to check:** Physical-goods commerce uses non-IAP (Apple Pay / Stripe / PayPal).

### 3.1.3(f) Free Stand-alone Apps
**Rule:** Free apps that are companions to paid web tools (VoIP, cloud storage, email, web hosting) don't need IAP if no in-app purchase or CTAs to purchase outside.

### 3.1.3(g) Advertising Management Apps
**Rule:** Ad-campaign management apps for advertisers don't need IAP. Apps that buy ads for the same app's content must use IAP (e.g., "boost post" on social).
**Auto-checkable:** Partial
**What to check:** "Boost post" feature → must be IAP.

### 3.1.4 Hardware-Specific Content
**Rule:** Features dependent on specific hardware may unlock without IAP. Optional companion to approved physical product may unlock without IAP if IAP option also available. May not require unrelated purchases / advertising / marketing to unlock.
**Auto-checkable:** No

### 3.1.5 Cryptocurrencies
**Rule:**
- **(i) Wallets** — must be enrolled as organization.
- **(ii) Mining** — only off-device (cloud).
- **(iii) Exchanges** — only in licensed regions.
- **(iv) ICOs / futures / crypto-securities** — only from established financial institutions; comply with law.
- **(v)** Crypto apps may not offer currency for completing tasks (downloads, referrals, social posts).

**Auto-checkable:** Yes
**What to check:**
- Developer enrollment type for wallet apps.
- Local mining libraries (xmrig, cgminer) → reject.
- Geo-restriction logic in exchange apps.
- "Earn crypto for downloading apps" prompts → reject.

## 3.2 Other Business Model Issues

### 3.2.1 Acceptable
- **(i)** Display own apps for purchase/promotion (not as a catalog).
- **(ii)** Display third-party app collection for approved specific need (health, aviation, accessibility) with editorial content.
- **(iii)** Disable access to specific rental content after rental period.
- **(iv)** Wallet passes for payments, offers, identification.
- **(v)** Insurance apps must be free, legally compliant, no IAP.
- **(vi)** Approved nonprofits may fundraise; must use Apple Pay, disclose use of funds, follow law, provide receipts.
- **(vii)** Individual gifts to individual without IAP allowed if optional and 100% to receiver and not tied to digital content/services.
- **(viii)** Financial trading/investing apps must be submitted by licensed financial institution.

### 3.2.2 Unacceptable
- **(i)** App-Store-like interface displaying third-party apps/extensions/plug-ins.
- **(ii)** Intentionally omitted.
- **(iii)** Artificial impressions/clicks; apps designed predominantly for displaying ads.
- **(iv)** Non-approved-nonprofit charity fundraising in-app (must be free; collect outside via Safari/SMS).
- **(v)** Arbitrary restrictions by location/carrier.
- **(vi)** Intentionally omitted.
- **(vii)** Artificially manipulating user visibility/status/rank on other services.
- **(viii)** Binary options trading apps prohibited. CFD/derivatives apps must be properly licensed.
- **(ix)** Personal loan apps must disclose APR and payment due date. Max APR ≤ 36%; no full-repayment-in-≤60-days.
- **(x)** No forcing users to rate, review, download other apps, or store actions to access functionality.

**Auto-checkable:** Yes (selected)
**What to check:**
- Loan apps: APR string in pre-acceptance UI; APR value ≤ 36; repayment terms ≥ 60 days.
- Rating prompts that gate features (`SKStoreReviewController.requestReview()` placed behind paywall logic) → reject.
- Ad-only apps (binary is essentially an ad SDK loader).

## 3.3 Specific Apps
*Section 3 ends at 3.2.2; there is no 3.3 in the current public guidelines.*

---

# SECTION 4 — DESIGN

## 4.1 Copycats
**Rule (a):** Don't copy popular apps. **(b):** Impersonating other apps violates Code of Conduct. **(c):** Don't use another developer's icon/brand/product name without approval.
**Auto-checkable:** Partial
**What to check:**
- App name/icon similarity to known popular apps (perceptual hashing against icon DB).
- Bundle ID conflict with established brand.
**Fix:** Original branding.

## 4.2 Minimum Functionality
**Rule:** App must elevate beyond a repackaged website. Must be useful, unique, "app-like." Songs/movies → iTunes Store. Book/game guides → Apple Books.
**Auto-checkable:** Partial
**What to check:**
- Single `WKWebView` filling root view controller with `loadRequest` to external URL → likely fails.
- App with single static page.

### 4.2.1 ARKit Integration
**Rule:** ARKit apps must provide rich integrated AR experiences; not just dropping a model in view.
**Auto-checkable:** Partial
**What to check:** Use of `ARSession`, `ARView`, `RealityKit` features beyond static model placement.

### 4.2.2 No Pure Marketing Materials
**Rule:** Apps shouldn't primarily be marketing material, advertisements, web clippings, content aggregators, or link collections (except catalogs).

### 4.2.3 Standalone / Resource Download
**Rule:**
- **(i)** App should work without requiring installation of another app.
- **(ii)** If app needs to download resources on first launch, disclose size and prompt before downloading.

**Auto-checkable:** Yes
**What to check:**
- `LSApplicationQueriesSchemes` indicating dependence on another app for core function.
- First-launch download flow shows size + confirmation dialog.

### 4.2.4 / 4.2.5 Intentionally Omitted

### 4.2.6 Commercialized Templates
**Rule:** Apps from template/app-generation services rejected unless submitted directly by content provider. Acceptable alt: single binary with picker model (e.g., restaurant finder).
**Auto-checkable:** Partial
**What to check:** Template-generator SDK fingerprints (e.g., Appy Pie, BuildFire frameworks).

### 4.2.7 Remote Desktop Clients
**Rule:**
- **(a)** Connect only to user-owned host (personal computer or dedicated game console) on local/LAN network.
- **(b)** Software fully executed on host; rendered on host; no extra APIs.
- **(c)** Account creation/management initiated from host.
- **(d)** Client UI must not resemble iOS/App Store, must not provide store-like interface or ability to browse/select/purchase software not already owned. Transactions in mirrored software don't need IAP if processed on host.
- **(e)** Thin clients for cloud-based apps not appropriate.

**Auto-checkable:** Partial
**What to check:** Network code reaches only LAN; no cloud-streaming endpoints.

## 4.3 Spam
**Rule (a):** Don't create multiple Bundle IDs of same app.
**Rule (b):** Avoid piling onto saturated categories (fart/burp/flashlight/fortune-telling/dating/drinking-games/Kama-Sutra) unless unique high-quality experience.
**Auto-checkable:** Partial
**What to check:** Developer's portfolio for duplicate bundles with minor variations.

## 4.4 Extensions
**Rule:** Extensions must comply with App Extension Programming Guide / Safari extensions docs. Should include functionality (help, settings). Marketing must accurately disclose extensions. Extensions may not include marketing/ads/IAP.
**Auto-checkable:** Yes
**What to check:**
- Each `*.appex` target has no ad SDK linked.
- No IAP UI in extension code.

### 4.4.1 Keyboard Extensions
**Rule (must):**
- Provide keyboard input functionality (typed characters).
- Follow Sticker guidelines if including images/emoji.
- Provide method for progressing to next keyboard.
- Remain functional without full network access and without full access.
- Collect user activity only to enhance keyboard.

**Rule (must not):**
- Launch other apps besides Settings.
- Repurpose keyboard buttons (e.g., long-press "return" to launch camera).

**Auto-checkable:** Yes
**What to check:**
- `RequestsOpenAccess` in `Info.plist` only `YES` if absolutely necessary.
- Keyboard delegate methods produce text input.
- No `UIApplication.shared.open(_:)` to non-Settings URLs.
- No analytics/telemetry beyond keyboard improvement.

### 4.4.2 Safari Extensions
**Rule:** Must run on current Safari version, must not interfere with System/Safari UI, must never include malicious/misleading content/code. Should not claim access to more websites than strictly necessary.
**Auto-checkable:** Yes
**What to check:** `host_permissions` / `matches` in extension manifest are minimal.

### 4.4.3 Intentionally Omitted

## 4.5 Apple Sites and Services

### 4.5.1
**Rule:** May use approved RSS feeds; may not scrape apple.com / iTunes Store / App Store / Connect / dev portal or rank using that data.
**Auto-checkable:** Yes
**What to check:** HTTP requests to `apple.com`, `itunes.apple.com`, `appstoreconnect.apple.com` for scraping.

### 4.5.2 Apple Music / MusicKit
**Rule:**
- **(i)** Users must initiate Apple Music playback via standard controls. App may not require payment or monetize Apple Music access (no IAP, ads, requesting user info gated on it). No downloading/uploading/sharing music files from MusicKit APIs.
- **(ii)** MusicKit isn't a replacement for music licensing. Cover art only with music playback/playlists. Follow Apple Music Identity Guidelines.
- **(iii)** Apps accessing Apple Music user data must clearly disclose in purpose string. Data not shared with third parties beyond improving app. Not for identifying users/devices or targeting ads.

**Auto-checkable:** Yes
**What to check:**
- `NSAppleMusicUsageDescription` purpose string explicit.
- No flow where paywall unlocks Apple Music playback.
- No analytics export of MusicKit data.

### 4.5.3 No Spam via Apple Services
**Rule:** No spam, phishing, unsolicited messages via Game Center, Push Notifications. No reverse lookup or harvesting of Player IDs/aliases.

### 4.5.4 Push Notifications
**Rule:** Push must not be required for app to function. Must not send sensitive/confidential info. Not for promotions/marketing unless user opted in via in-app consent UI; must provide opt-out.
**Auto-checkable:** Yes
**What to check:**
- App functionality not blocked by lack of push permission.
- Push payloads scanned: no SSN, credit card, passwords.
- In-app opt-in UI for promotional push present.

### 4.5.5 Game Center Player IDs
**Rule:** Only use Player IDs per Game Center terms; don't display or share.

### 4.5.6 Apple Emoji
**Rule:** Apps may use Unicode chars that render as Apple emoji. Apple emoji may not be used on other platforms or embedded directly in binary.
**Auto-checkable:** Yes
**What to check:** Bundled emoji image assets that are Apple-shaped (perceptual match to Apple emoji set) → reject.

## 4.6 Intentionally Omitted

## 4.7 Mini Apps, Mini Games, Streaming Games, Chatbots, Plug-ins, Game Emulators
**Rule:** Apps may offer software not embedded in binary — HTML5/JS mini apps/games, streaming games, chatbots, plug-ins; emulators can offer to download games. Developer is responsible for compliance.

### 4.7.1 Compliance Requirements for Offered Software
- Follow all privacy guidelines (Guideline 5.1) including sensitive data.
- Include filtering, reporting, response timelines, blocking users (per 1.2).
- Follow Guideline 3.1 for digital goods.

### 4.7.2 No Exposing Native APIs
**Rule:** May not extend/expose native platform APIs or technologies to the software without Apple's prior permission.
**Auto-checkable:** Yes
**What to check:** `WKWebView` `WKScriptMessageHandler` bridges exposing CoreLocation/HealthKit/etc. to web content.

### 4.7.3 No Sharing Data/Permissions
**Rule:** May not share data or privacy permissions to individual software without explicit user consent in each instance.
**Auto-checkable:** Yes
**What to check:** Consent prompt before any individual mini-app gains access to user data/location.

### 4.7.4 Index of Software
**Rule:** Must provide an index of software/metadata with universal links to all software offered.
**Auto-checkable:** Yes
**What to check:** Universal links configured (`apple-app-site-association`) for catalog entries.

### 4.7.5 Age Restriction for Software
**Rule:** Must provide way for users to identify software that exceeds app's age rating and use age-restriction based on verified/declared age.

## 4.8 Login Services (Sign in with Apple equivalency)
**Rule:** Apps that use third-party/social login (Facebook, Google, Twitter/X, LinkedIn, Amazon, WeChat) for primary account must also offer an equivalent login service that:
- Limits data collection to user's name and email address.
- Allows users to keep their email private as part of account setup.
- Does not collect interactions with the app for advertising purposes without consent.

A primary account is the account used for identifying, signing in, and accessing app features.

Another login service NOT required if:
- App exclusively uses your company's own account systems.
- App is an alternative app marketplace or app distributed from an alternative marketplace using marketplace-specific login.
- App is education/enterprise/business requiring existing education/enterprise account.
- App uses government or industry-backed citizen ID / electronic ID.
- App is a client for a specific third-party service where users sign into their mail/social account directly.

**Auto-checkable:** Yes
**What to check:**
- If any of `FBSDKLoginKit`, `GoogleSignIn`, `LinkedInSwift`, `LoginWithAmazon`, `WeChatOpenSDK`, `TwitterKit` is linked AND used for primary account → must also link `AuthenticationServices` and implement `ASAuthorizationAppleIDProvider` (Sign in with Apple) **or** another equivalent service.
- Sign in with Apple button visually present alongside third-party buttons (Human Interface Guidelines compliance: prominent, not buried).
- `com.apple.developer.applesignin` entitlement present.
- Privacy-relay email handling: server respects relayed `@privaterelay.appleid.com`.

**Common rejection example:** Facebook Login present, no Sign in with Apple.
**Fix:** Add Sign in with Apple per HIG.

## 4.9 Apple Pay
**Rule:** Apps using Apple Pay must provide material purchase info prior to sale. Use Apple Pay branding and UI per Apple Pay Marketing Guidelines and HIG. For recurring payments, disclose:
- Length of renewal term and that it continues until canceled.
- What is provided during each period.
- Actual charges to customer.
- How to cancel.

**Auto-checkable:** Yes
**What to check:**
- Use of `PKPaymentAuthorizationController` / `PKPaymentButton`.
- Pre-payment screen lists item, total, taxes, shipping.
- Recurring payments: disclosure block + cancellation instructions.

## 4.10 Monetizing Built-In Capabilities
**Rule:** Don't monetize built-in capabilities provided by hardware/OS (Push, camera, gyroscope) or Apple services/technologies (Apple Music access, iCloud storage, Screen Time APIs).
**Auto-checkable:** Yes
**What to check:** IAP products tied to enabling camera/push/gyro/iCloud access. Free apps cannot charge for these.

---

# SECTION 5 — LEGAL

**Rule (intro):** Apps must comply with all legal requirements in any location where you make them available. Apps that solicit, promote, or encourage criminal or reckless behavior will be rejected.

## 5.1 Privacy

### 5.1.1 Data Collection and Storage

#### 5.1.1(i) Privacy Policies
**Rule:** All apps must include a link to their privacy policy in App Store Connect metadata and within the app, accessible. Policy must:
- Identify what data is collected, how, and all uses.
- Confirm that third parties receiving data provide equal protection.
- Explain retention/deletion policies and how user can revoke consent / request deletion.

**Auto-checkable:** Yes
**What to check:**
- `Privacy Policy URL` in App Store Connect is set and returns HTTP 200.
- In-app Settings/About screen contains visible link to privacy policy.
- Privacy policy page mentions: data collected, sharing, retention, deletion, revoke.
**Common rejection example:** Privacy URL points to 404 or placeholder.
**Fix:** Publish complete privacy policy.

#### 5.1.1(ii) Permission
**Rule:** Apps collecting user/usage data must secure consent (even anonymous-at-collection). Paid functionality must not depend on user granting access. Must provide easy way to withdraw consent. Purpose strings must clearly describe data use. GDPR/similar legitimate-interest collection must comply with that law.
**Auto-checkable:** Yes
**What to check:**
- Every `NSXxxUsageDescription` in `Info.plist` is descriptive and specific (not generic):
  - `NSCameraUsageDescription`
  - `NSMicrophoneUsageDescription`
  - `NSPhotoLibraryUsageDescription` / `NSPhotoLibraryAddUsageDescription`
  - `NSLocationWhenInUseUsageDescription` / `NSLocationAlwaysAndWhenInUseUsageDescription`
  - `NSContactsUsageDescription`
  - `NSCalendarsUsageDescription` / `NSCalendarsFullAccessUsageDescription` / `NSCalendarsWriteOnlyAccessUsageDescription`
  - `NSRemindersUsageDescription` / `NSRemindersFullAccessUsageDescription`
  - `NSMotionUsageDescription`
  - `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription`
  - `NSBluetoothAlwaysUsageDescription` / `NSBluetoothPeripheralUsageDescription`
  - `NSAppleMusicUsageDescription`
  - `NSSpeechRecognitionUsageDescription`
  - `NSFaceIDUsageDescription`
  - `NSLocalNetworkUsageDescription`
  - `NSNearbyInteractionUsageDescription`
  - `NSFocusStatusUsageDescription`
  - `NSGKFriendListUsageDescription`
  - `NSUserTrackingUsageDescription` (App Tracking Transparency)
- Strings are not "We need access" — must explain WHY/HOW.
- Generic strings like "Camera" / "Photo access" → reject.

**Common rejection example:** `NSCameraUsageDescription = "Camera"` → too vague.
**Fix:** "We use your camera to scan QR codes for ticket validation." (specific & purpose-driven)

#### 5.1.1(iii) Data Minimization
**Rule:** Apps should only request access to data relevant to core functionality. Use out-of-process picker or share sheet rather than full access to Photos/Contacts where possible.
**Auto-checkable:** Yes
**What to check:**
- Use of `PHPickerViewController` instead of `PHPhotoLibrary` full access.
- Use of `CNContactPickerViewController` instead of full Contacts framework access.
- Limited Photo Library access (`PHAccessLevel.addOnly`) where possible.

#### 5.1.1(iv) Access
**Rule:** Apps must respect user permission settings and not manipulate, trick, or force consent. Don't require microphone for photo posting. Provide alternative solutions for users who don't grant consent.
**Auto-checkable:** Partial
**What to check:**
- Multi-permission single-prompt UI that bundles unrelated permissions.
- Code that blocks features when permission denied without offering manual alternative (e.g., manual address entry when Location denied).

#### 5.1.1(v) Account Sign-In / Account Deletion
**Rule:** If app doesn't include significant account-based features, let people use it without login. If app supports account creation, you must also offer **account deletion within the app**. Apps may not require personal info to function except when directly relevant to core functionality or required by law. If core functionality is not tied to specific social network, must provide access without that login or via another mechanism. Pulling basic profile, sharing, inviting friends are not core functionality. Must include mechanism to revoke social network credentials and disable data access from within app. May not store credentials/tokens off device; only use them while app is in use.

**Auto-checkable:** Yes
**What to check:**
- If account creation present (sign-up screen): in-app "Delete Account" UI exists in Settings/Profile.
- "Delete Account" must initiate deletion of account and associated personal data (not just deactivate).
- Cannot be email-support-only (must be self-service in-app, allowing a request flow with confirmation is acceptable but in-app initiation required).
- For social-network-credential apps: revoke-and-disconnect button present.
- No backend storage of OAuth tokens beyond active app use without consent.

**Common rejection example:** App offers sign-up but no in-app account deletion (just an email/support form).
**Fix:** Add `DeleteAccountView` accessible from Profile/Settings; call backend `DELETE /account` and clear credentials/keychain.

#### 5.1.1(vi) Surreptitious Discovery
**Rule:** Developers who surreptitiously discover passwords or private data will be removed from the Developer Program.

#### 5.1.1(vii) SafariViewController Use
**Rule:** `SafariViewController` must be used to visibly present info to users; may not be hidden/obscured/tracked-via.
**Auto-checkable:** Yes
**What to check:** `SFSafariViewController` not added to a hidden view; not zero-sized; not used for headless requests.

#### 5.1.1(viii) Compiling Personal Info
**Rule:** Apps that compile personal info from any source not directly from user or without explicit consent — even public databases — are not permitted.

#### 5.1.1(ix) Regulated Fields
**Rule:** Banking, financial services, healthcare, gambling, legal cannabis, air travel, crypto exchanges, or sensitive-info apps should be submitted by a legal entity providing the services, not by an individual developer. Cannabis apps must be geo-restricted to legal jurisdictions.
**Auto-checkable:** Partial
**What to check:** Developer name = legal entity for regulated apps; geo-restriction in App Store Connect availability.

#### 5.1.1(x) Basic Contact Info
**Rule:** Apps may request name and email if request is optional, features not conditioned on providing, and complies with kid-data rules.

### 5.1.2 Data Use and Sharing

#### 5.1.2(i) Tracking & Consent (App Tracking Transparency)
**Rule:** Unless permitted by law, may not use/transmit/share personal data without permission. Must disclose data sharing including with third-party AI. Data may be shared only to improve app or serve ads (per DPLA). Must receive explicit permission via App Tracking Transparency APIs to track. May not require users to enable system functionality (push, location, tracking) to access content or get compensation.

**Auto-checkable:** Yes
**What to check:**
- `NSUserTrackingUsageDescription` in `Info.plist` if `ATTrackingManager.requestTrackingAuthorization` called.
- Tracking SDKs (AppsFlyer, Adjust, Branch, Singular, Kochava) linked → ATT call must precede IDFA collection.
- IDFA (`ASIdentifierManager.advertisingIdentifier`) is accessed only after ATT authorized.
- Privacy nutrition labels in App Store Connect declare every collected data type.
- `PrivacyInfo.xcprivacy` declares tracking domains under `NSPrivacyTrackingDomains` if `NSPrivacyTracking = true`.
- App functionality is not gated on enabling tracking (no "Allow Tracking to continue" screen).

**Common rejection example:** Calling ATT and only enabling app if user taps "Allow." Sending IDFA before ATT authorization.
**Fix:** Branch logic so denial still permits app use; only collect IDFA after `authorizationStatus == .authorized`.

#### 5.1.2(ii) Repurposing Data
**Rule:** Data collected for one purpose may not be repurposed without further consent.

#### 5.1.2(iii) Profile Building
**Rule:** No surreptitious user profile building; no reconstructing identities from anonymized/aggregated data.

#### 5.1.2(iv) Contacts/Photos Mining
**Rule:** Don't use Contacts/Photos/other APIs to build a contact DB for sale/distribution. Don't collect info about which other apps are installed (no `LSApplicationQueriesSchemes` brute-force).
**Auto-checkable:** Yes
**What to check:**
- `LSApplicationQueriesSchemes` in `Info.plist` ≤ ~50 entries and each is justifiable.
- `canOpenURL:` queries in code for analytics purpose.

#### 5.1.2(v) Contacting via Contacts/Photos
**Rule:** Don't contact people using info from Contacts/Photos except at user's explicit individualized initiative. No "Select All" / default-all-selected. Show user clear description of how the message will appear before sending.

#### 5.1.2(vi) HomeKit / HealthKit / Clinical / MovementDisorder / ClassKit / ARKit / Camera / Photos Data
**Rule:** Data from these APIs may not be used for marketing, advertising, or use-based data mining including by third parties.
**Auto-checkable:** Yes
**What to check:**
- HealthKit / HomeKit / ClassKit data flowing into analytics SDKs.
- ARKit face data sent to ad networks.

#### 5.1.2(vii) Apple Pay Data
**Rule:** Apple Pay data shared with third parties only to facilitate/improve delivery of goods/services.

### 5.1.3 Health and Health Research

#### 5.1.3(i)
**Rule:** Health/fitness/medical data (Clinical Health Records API, HealthKit, Motion and Fitness, MovementDisorder APIs, or health research) may not be used or disclosed to third parties for advertising/marketing/data mining other than for health management/research, then only with permission. May use to provide direct benefit to user (e.g., reduced insurance premium) if submitted by benefit-providing entity. Must disclose specific health data collected.

#### 5.1.3(ii)
**Rule:** Apps must not write false/inaccurate data into HealthKit. May not store personal health info in iCloud.
**Auto-checkable:** Yes
**What to check:**
- Health data writes (`HKHealthStore.save`) come from sensors/user input, not fabricated.
- No `CKContainer` operations storing HK data in CloudKit.

#### 5.1.3(iii) Health Research Consent
**Rule:** Must obtain consent from participants (or parent/guardian for minors) including:
- (a) nature, purpose, duration of research;
- (b) procedures, risks, benefits;
- (c) confidentiality and data handling;
- (d) contact for questions;
- (e) withdrawal process.

#### 5.1.3(iv) Ethics Review
**Rule:** Health research must secure approval from independent ethics review board.

### 5.1.4 Kids

#### 5.1.4(a)
**Rule:** Be careful with kid data; comply with COPPA, GDPR, etc. May ask for birthdate and parental contact only for statute compliance. Must include functionality regardless of age. Apps primarily for kids should not include third-party analytics or ads.

#### 5.1.4(b)
**Rule:** Limited third-party analytics and contextual ads permitted under 1.3 terms. Kids Category apps or any app collecting personal info from minors must have a privacy policy and comply with children's privacy statutes. Parental gate (Kids Category) differs from parental consent under privacy statutes. "For Kids"/"For Children" reserved for Kids Category.

**Auto-checkable:** Yes
**What to check:**
- Kids Category apps: no third-party analytics/ads (see 1.3 checks).
- DOB capture screen for COPPA workflow.
- Parental gate (math problem or hold-and-release) before any external link or IAP in Kids apps.

### 5.1.5 Location Services
**Rule:** Use Location Services only when directly relevant. Not for emergency services or autonomous control of vehicles/aircraft (except small drones, toys, car alarm remotes). Notify and obtain consent before collecting/transmitting/using location data. Purpose strings must explain why.

**Auto-checkable:** Yes
**What to check:**
- `CLLocationManager` use justifiable from feature set.
- `NSLocationWhenInUseUsageDescription` purpose specific.
- `NSLocationAlwaysAndWhenInUseUsageDescription` includes background justification.
- Background `location` mode (Info.plist `UIBackgroundModes`) used only when necessary.

## 5.2 Intellectual Property

### 5.2.1 Generally
**Rule:** Don't use protected third-party material (trademarks, copyrights, patents) without permission. No misleading/false/copycat names or metadata. App must be submitted by owner/licensee of IP.

### 5.2.2 Third-Party Sites/Services
**Rule:** If using/accessing/monetizing/displaying content from third-party service, must be permitted under service ToS. Authorization provided upon request.

### 5.2.3 Audio/Video Downloading
**Rule:** No facilitating illegal file sharing. No ability to save/convert/download media from Apple Music/YouTube/SoundCloud/Vimeo without explicit authorization.
**Auto-checkable:** Yes
**What to check:**
- youtube-dl / yt-dlp libraries.
- Strings: "download video", "save YouTube", "MP3 converter".
- URLs to youtube.com/api/playback streaming for download purposes.

### 5.2.4 Apple Endorsements
**(a)** Don't suggest Apple endorses app.
**(b)** "Editor's Choice" badge applied by Apple automatically.

### 5.2.5 Apple Products
**Rule:** Don't create confusingly-similar-to-Apple app/interface (Finder, App Store, iTunes Store, Messages). No Apple emoji in keyboards/Sticker packs. iTunes/Apple Music previews may not be used as entertainment (background music in photo collage). If using previews, link to iTunes/Apple Music. Activity rings may not visualize Move/Exercise/Stand resembling Activity control. Apple Weather data must follow WeatherKit attribution.
**Auto-checkable:** Yes
**What to check:**
- App name/icon similar to Apple's products.
- Bundled emoji assets match Apple emoji visually.
- WeatherKit data displayed with attribution "Weather" + Apple Weather link.

## 5.3 Gaming, Gambling, and Lotteries

### 5.3.1
**Rule:** Sweepstakes/contests must be sponsored by the developer.

### 5.3.2
**Rule:** Official rules for sweepstakes/contests/raffles must be presented in app and clarify Apple is not a sponsor.
**Auto-checkable:** Yes
**What to check:** Rules screen contains disclaimer "Apple is not a sponsor of this promotion."

### 5.3.3
**Rule:** Apps may not use IAP to purchase credit/currency for real-money gaming.
**Auto-checkable:** Yes
**What to check:** No StoreKit IAP that loads chips/casino-currency for real-money play.

### 5.3.4
**Rule:** Real-money gaming (sports betting, poker, casino, horse racing) or lotteries must have necessary licensing in locations used, geo-restricted, and free on App Store. No card counters / illegal gambling aids. Lottery apps must have consideration, chance, and prize.

**Auto-checkable:** Yes
**What to check:**
- App is Free in App Store Connect.
- Geo-restriction logic by CountryCode / `CLPlacemark.isoCountryCode`.
- Licensing info in Review Notes.

## 5.4 VPN Apps
**Rule:** Must use `NEVPNManager` API. Only offered by developers enrolled as organization. Must declare what data is collected and how on a screen prior to purchase/use. May not sell/use/disclose data to third parties — must commit to this in privacy policy. Must not violate local laws; provide license info in Review Notes for territories requiring VPN license. Parental control/content-blocking/security apps from approved providers may also use NEVPNManager.

**Auto-checkable:** Yes
**What to check:**
- Use of `NEVPNManager` / Network Extension framework.
- Entitlement `com.apple.developer.networking.vpn.api`.
- Developer enrollment = organization (not individual).
- Pre-purchase data-collection disclosure screen present.
- Privacy policy explicitly states "we do not sell, use, or disclose your data to third parties."

## 5.5 Mobile Device Management
**Rule:** MDM apps must request the capability from Apple. Only offered by commercial enterprises, educational institutions, or government agencies for the purpose of controlling devices owned/issued by the entity. Must have necessary permissions and privacy policy. Must not violate applicable laws. Must not sell, use, or disclose to third parties any data obtained through MDM functionality. Apps misusing MDM (e.g., consumer apps using MDM to bypass App Store policies) will be rejected and removed; developer will be removed from program.

**Auto-checkable:** Yes
**What to check:**
- MDM entitlement requested.
- Developer enrollment type matches enterprise/edu/gov.
- No data export of managed-device telemetry to ad networks.
- Privacy policy declares no third-party data sharing.

## 5.6 Developer Code of Conduct
**Rule (intro):** Treat customers and reviewers with respect. Maintain trustworthy behavior. Violations may result in removal from the Apple Developer Program. Excessive customer reports about an app may indicate non-compliance.

### 5.6.1 Developer Trust
**Rule:** Engaging in dishonest behavior, including but not limited to: manipulating App Store services (charts, reviews, etc.), inflating download counts, abusing the App Store or Developer Program, or attempting to disrupt the App Review or Apple software/services/customer experience, will result in removal from the Developer Program. If your account is terminated for fraud/abuse, you may not create a new account.

**Auto-checkable:** Yes
**What to check:**
- Use of services that purchase fake reviews / downloads.
- Bot/click-farm SDKs.
- Multiple Developer accounts tied to same individual after termination.

### 5.6.2 Community Etiquette (Developer Identity)
**Rule:** Be respectful and professional in communications. Use accurate developer name and contact info. Don't impersonate other developers or apps. Keep your account info accurate and up to date.
**Auto-checkable:** Yes
**What to check:**
- `App Store Connect` legal entity name matches business registration.
- Support contact info reachable.
- App name/icon not impersonating another developer's identity.

### 5.6.3 Discovery Fraud
**Rule:** Participating in the App Store requires integrity and commitment to customer trust. Manipulating any element of the App Store customer experience — such as charts, search results, ratings, reviews, or referrals to your app — erodes customer trust and is not permitted.
**Auto-checkable:** Partial
**What to check:**
- Code that prompts user to leave a review only after positive interaction (acceptable use of `SKStoreReviewController`) vs incentivized review-for-reward (rejection).
- SDKs that engage with rating-manipulation services.
- In-app prompts offering rewards in exchange for app review.

### 5.6.4 Government Apps / Hate Speech / Other Behavior
**Rule:** Apps that include false, fraudulent, or misleading representations, or attempt to demean/intimidate/harm a targeted individual or group, are prohibited. Government apps that suppress legitimate dissent or facilitate human rights abuses will be removed. Apps that target law enforcement or members of any specific group with violent intent will be rejected and may result in account termination.

---

# APPENDIX A — Privacy Manifest (`PrivacyInfo.xcprivacy`)

**Reference:** https://developer.apple.com/documentation/bundleresources/privacy-manifest-files

**File name:** `PrivacyInfo.xcprivacy`
**Location:** Root of app bundle and root of every embedded framework / SDK bundle (required for SDKs listed below).
**Format:** XML plist.

## Required Top-Level Keys

| Key | Type | Required | Purpose |
| --- | --- | --- | --- |
| `NSPrivacyTracking` | Boolean | Yes (if any tracking) | Whether the app/SDK engages in tracking per ATT |
| `NSPrivacyTrackingDomains` | Array of strings | Required if `NSPrivacyTracking = true` | Domains used for tracking; will be blocked at network layer if ATT denied |
| `NSPrivacyCollectedDataTypes` | Array of dicts | Yes | Data types collected with linkage/tracking flags and purposes |
| `NSPrivacyAccessedAPITypes` | Array of dicts | Yes (if any required-reason API used) | Required Reason API categories with approved reason codes |

## Sample Skeleton

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
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
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
  </array>
</dict>
</plist>
```

## Data Type Values (`NSPrivacyCollectedDataType`)
Common values (Apple's full list is mirrored in the App Privacy Nutrition Labels):
- `NSPrivacyCollectedDataTypeName`
- `NSPrivacyCollectedDataTypeEmailAddress`
- `NSPrivacyCollectedDataTypePhoneNumber`
- `NSPrivacyCollectedDataTypePhysicalAddress`
- `NSPrivacyCollectedDataTypeOtherUserContactInfo`
- `NSPrivacyCollectedDataTypeHealth`
- `NSPrivacyCollectedDataTypeFitness`
- `NSPrivacyCollectedDataTypePaymentInfo`
- `NSPrivacyCollectedDataTypeCreditInfo`
- `NSPrivacyCollectedDataTypeOtherFinancialInfo`
- `NSPrivacyCollectedDataTypePreciseLocation`
- `NSPrivacyCollectedDataTypeCoarseLocation`
- `NSPrivacyCollectedDataTypeSensitiveInfo`
- `NSPrivacyCollectedDataTypeContacts`
- `NSPrivacyCollectedDataTypeEmailsOrTextMessages`
- `NSPrivacyCollectedDataTypePhotosorVideos`
- `NSPrivacyCollectedDataTypeAudioData`
- `NSPrivacyCollectedDataTypeGameplayContent`
- `NSPrivacyCollectedDataTypeCustomerSupport`
- `NSPrivacyCollectedDataTypeOtherUserContent`
- `NSPrivacyCollectedDataTypeBrowsingHistory`
- `NSPrivacyCollectedDataTypeSearchHistory`
- `NSPrivacyCollectedDataTypeUserID`
- `NSPrivacyCollectedDataTypeDeviceID`
- `NSPrivacyCollectedDataTypePurchaseHistory`
- `NSPrivacyCollectedDataTypeProductInteraction`
- `NSPrivacyCollectedDataTypeAdvertisingData`
- `NSPrivacyCollectedDataTypeOtherUsageData`
- `NSPrivacyCollectedDataTypeCrashData`
- `NSPrivacyCollectedDataTypePerformanceData`
- `NSPrivacyCollectedDataTypeOtherDiagnosticData`
- `NSPrivacyCollectedDataTypeEnvironmentScanning`
- `NSPrivacyCollectedDataTypeHands`
- `NSPrivacyCollectedDataTypeHead`
- `NSPrivacyCollectedDataTypeOtherDataTypes`

## Purpose Values (`NSPrivacyCollectedDataTypePurposes`)
- `NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising`
- `NSPrivacyCollectedDataTypePurposeDeveloperAdvertising`
- `NSPrivacyCollectedDataTypePurposeAnalytics`
- `NSPrivacyCollectedDataTypePurposeProductPersonalization`
- `NSPrivacyCollectedDataTypePurposeAppFunctionality`
- `NSPrivacyCollectedDataTypePurposeOther`

---

# APPENDIX B — Required Reason APIs

**Reference:** https://developer.apple.com/documentation/bundleresources/privacy-manifest-files/describing-use-of-required-reason-api

Apple requires every use of these APIs to declare an approved reason code in `NSPrivacyAccessedAPITypes`.

## B.1 File Timestamp APIs
**Category:** `NSPrivacyAccessedAPICategoryFileTimestamp`
**APIs covered:**
- `creationDate`, `modificationDate` on `FileManager` / `URLResourceKey`
- `getattrlist`, `getattrlistat`, `fgetattrlist`
- `stat`, `fstat`, `lstat`, `fstatat`
- `NSFileCreationDate`, `NSFileModificationDate`

**Approved reasons:**
| Code | Meaning |
| --- | --- |
| `DDA9.1` | Display file timestamps to the user. Information may not be sent off-device. |
| `C617.1` | Access timestamps/size/metadata of files inside the app container, app group container, or app's CloudKit container. |
| `3B52.1` | Access timestamps/size/metadata of files/directories user specifically granted access to (e.g., document picker). |
| `0A2A.1` | Third-party SDK wrapper around file timestamp API — only accessed when host app calls wrapper. |

## B.2 System Boot Time APIs
**Category:** `NSPrivacyAccessedAPICategorySystemBootTime`
**APIs covered:**
- `mach_absolute_time` (in some contexts)
- `systemUptime` on `ProcessInfo`
- `clock_gettime(CLOCK_MONOTONIC, ...)`
- `kern.boottime` sysctl

**Approved reasons:**
| Code | Meaning |
| --- | --- |
| `35F9.1` | Measure elapsed time on-device between events that occur while app is running. Information may not be sent off-device. |
| `8FFB.1` | Synchronize events on the user's device; e.g., timestamping locally observed events. |
| `3D61.1` | Third-party SDK wrapper around boot time API. |

## B.3 Disk Space APIs
**Category:** `NSPrivacyAccessedAPICategoryDiskSpace`
**APIs covered:**
- `volumeAvailableCapacityKey` / `volumeAvailableCapacityForImportantUsageKey` / `volumeAvailableCapacityForOpportunisticUsageKey`
- `volumeTotalCapacityKey`
- `systemFreeSize` / `systemSize` on `FileManager.attributesOfFileSystem`
- `statfs`, `fstatfs`, `statvfs`, `fstatvfs`

**Approved reasons:**
| Code | Meaning |
| --- | --- |
| `85F4.1` | Display disk-space info to user. May not be sent off-device. |
| `E174.1` | Check for sufficient disk space before write operation. Reason may be sent off-device. |
| `7D9E.1` | Detect whether disk space is low to prompt user to take action. May be sent off-device only as low-disk signal. |
| `B728.1` | Third-party SDK wrapper around disk space API. |

## B.4 Active Keyboard APIs
**Category:** `NSPrivacyAccessedAPICategoryActiveKeyboards`
**APIs covered:**
- `UITextInputMode.activeInputModes`

**Approved reasons:**
| Code | Meaning |
| --- | --- |
| `3EC4.1` | Custom keyboard extension uses to determine the set of enabled keyboards. May not be sent off-device. |
| `54BD.1` | Provide customized UI to user based on active keyboard (e.g., display localized content matching keyboard language). May not be sent off-device. |

## B.5 User Defaults APIs
**Category:** `NSPrivacyAccessedAPICategoryUserDefaults`
**APIs covered:**
- `UserDefaults` / `NSUserDefaults`

**Approved reasons:**
| Code | Meaning |
| --- | --- |
| `CA92.1` | Access user defaults for app itself / app group containers app is a member of. |
| `1C8F.1` | Provide functionality to managed app via configuration profile installed by MDM. |
| `C56D.1` | Third-party SDK wrapper around UserDefaults APIs. |
| `AC6B.1` | Access info from same app group when SDK uses UserDefaults under group container shared with host app. |

---

# APPENDIX C — Third-Party SDKs Requiring Privacy Manifest + Signature

If your app embeds any of the following SDKs (or any SDK that repackages them), each SDK bundle must contain a `PrivacyInfo.xcprivacy` and be code-signed.

**Reference:** https://developer.apple.com/support/third-party-SDK-requirements/

Abseil, AFNetworking, Alamofire, AppAuth, BoringSSL / openssl_grpc, Capacitor, Charts, connectivity_plus, Cordova, device_info_plus, DKImagePickerController, DKPhotoGallery, FBAEMKit, FBLPromises, FBSDKCoreKit, FBSDKCoreKit_Basics, FBSDKLoginKit, FBSDKShareKit, file_picker, FirebaseABTesting, FirebaseAuth, FirebaseCore, FirebaseCoreDiagnostics, FirebaseCoreExtension, FirebaseCoreInternal, FirebaseCrashlytics, FirebaseDynamicLinks, FirebaseFirestore, FirebaseInstallations, FirebaseMessaging, FirebaseRemoteConfig, Flutter, flutter_inappwebview, flutter_local_notifications, fluttertoast, FMDB, geolocator_apple, GoogleDataTransport, GoogleSignIn, GoogleToolboxForMac, GoogleUtilities, grpcpp, GTMAppAuth, GTMSessionFetcher, hermes, image_picker_ios, IQKeyboardManager, IQKeyboardManagerSwift, Kingfisher, leveldb, Lottie, MBProgressHUD, nanopb, OneSignal, OneSignalCore, OneSignalExtension, OneSignalOutcomes, OpenSSL, OrderedSet, package_info, package_info_plus, path_provider, path_provider_ios, Promises, Protobuf, Reachability, RealmSwift, RxCocoa, RxRelay, RxSwift, SDWebImage, share_plus, shared_preferences_ios, SnapKit, sqflite, Starscream, SVProgressHUD, SwiftyGif, SwiftyJSON, Toast, UnityFramework, url_launcher, url_launcher_ios, video_player_avfoundation, wakelock, webview_flutter_wkwebview.

**Auto-checkable:** Yes
**What to check:**
- For each embedded `.framework` / `.xcframework` in the app bundle, verify presence of `PrivacyInfo.xcprivacy` at framework root.
- Verify `codesign -dv` output shows valid signature on each framework binary.
- If any listed SDK is present without manifest or signature → submission will be rejected with ITMS-91065 / ITMS-91064 errors.

---

# APPENDIX D — App Tracking Transparency (ATT) Quick Reference

**Reference:** https://developer.apple.com/documentation/apptrackingtransparency

**When required:** Whenever the app or any embedded SDK collects data linked to a user/device for tracking across apps and websites owned by other companies, or shares such data with data brokers.

**Implementation requirements:**
1. `Info.plist`: `NSUserTrackingUsageDescription` — explain why tracking is needed (specific, user-benefit-focused).
2. Call `ATTrackingManager.requestTrackingAuthorization` before accessing IDFA or initializing tracking SDKs.
3. Do not gate app functionality on the user choosing "Allow."
4. Respect status `.notDetermined`, `.denied`, `.restricted`, `.authorized`.
5. SDKs known to track: AppsFlyer, Adjust, Branch, Singular, Kochava, Facebook (Meta) SDK with ads, Google Mobile Ads (AdMob) with personalized ads, TikTok SDK, Snap SDK.

**Auto-checks for the plugin:**
- If `ATTrackingManager` is imported → `NSUserTrackingUsageDescription` MUST exist in Info.plist.
- If tracking SDK linked → `NSUserTrackingUsageDescription` MUST exist.
- ATT call must precede first IDFA access (control-flow analysis).
- Tracking SDKs configured to defer init until ATT authorized (`ATTrackingManager.trackingAuthorizationStatus == .authorized`).
- Privacy manifest `NSPrivacyTracking = true` if any tracking happens.
- `NSPrivacyTrackingDomains` populated with backend tracking endpoints.

---

# APPENDIX E — Account Deletion (Guideline 5.1.1(v)) Quick Reference

**Reference:** https://developer.apple.com/support/offering-account-deletion-in-your-app/

**Required since:** June 30, 2022.

**Requirements:**
1. If app supports account creation, app MUST offer in-app account deletion.
2. Deletion must initiate from inside the app — not solely a link to a website / email support form.
3. Deletion must remove the account AND the personal data associated with it (not merely deactivate).
4. Must be reachable from the app's account/settings UI.
5. May require additional confirmation, identity verification, or grace period — but the user-initiated flow must start in-app.
6. For regulated industries (banking, healthcare) where law requires data retention, must clearly explain what data is retained and for how long.

**Auto-checks:**
- Detect account-creation flow (sign-up screen / `register`, `signUp` functions).
- If sign-up exists → search for "Delete Account" / "Close Account" / `deleteAccount` function / API call to `DELETE /account` or similar.
- UI string scan: "Delete Account", "Close Account", "Remove Account" in Localizable.strings.
- Verify deletion endpoint exists in backend code (if accessible).
- Verify Keychain credentials cleared on delete.

---

# APPENDIX F — Sign in with Apple (Guideline 4.8) Quick Reference

**Reference:** https://developer.apple.com/sign-in-with-apple/

**Required when:** App uses any third-party/social login (Facebook, Google, Twitter/X, LinkedIn, Amazon, WeChat) for primary account.

**Exemptions:**
- Apps using only your own company's account system.
- Alternative marketplace apps using marketplace login.
- Education/enterprise/business apps requiring existing org account.
- Government/industry citizen-ID / electronic ID.
- Clients for a specific third-party service requiring direct sign-in to that service.

**Implementation requirements:**
1. Link `AuthenticationServices` framework.
2. Add entitlement `com.apple.developer.applesignin = ["Default"]`.
3. Use `ASAuthorizationAppleIDProvider` / `ASAuthorizationAppleIDButton`.
4. Display SIWA button per HIG (prominent, top of options, correct shape/style/size).
5. Limit data collected to name and email only.
6. Support Apple's private email relay (`@privaterelay.appleid.com`).
7. Don't track user interactions for advertising without consent.

**Auto-checks:**
- If any of [`FBSDKLoginKit`, `GoogleSignIn`, `LinkedInSwift`, `LoginWithAmazon`, `WeChatOpenSDK`, `TwitterKit`] is linked → `AuthenticationServices` MUST be linked AND `com.apple.developer.applesignin` entitlement MUST be set.
- Code references `ASAuthorizationAppleIDProvider` somewhere in the auth UI.
- SIWA button placement: search for `ASAuthorizationAppleIDButton` and verify it's not hidden / not buried below other buttons in same view.
- Server code accepts emails ending in `@privaterelay.appleid.com`.

---

# APPENDIX G — Common Static Checks Cheat Sheet

| Symptom | Likely Guideline | Quick Check |
| --- | --- | --- |
| Missing `PrivacyInfo.xcprivacy` | 5.1.2(i) / SDK requirements | Scan bundle and all `.framework`/`.xcframework` for the file |
| Generic permission string | 5.1.1(ii) | Each `NS*UsageDescription` ≥ 1 sentence, mentions purpose |
| 3rd-party login but no SIWA | 4.8 | Check linked frameworks + entitlements |
| Account sign-up but no delete | 5.1.1(v) | Code search for `deleteAccount` and UI string "Delete Account" |
| Stripe/Razorpay for digital unlock | 3.1.1 | Linked PSP SDK + StoreKit absent |
| Ad SDK in extension/widget/clip | 2.5.18 | Extension target's linked libs |
| Background mode without justification | 2.5.4 | Each entry in `UIBackgroundModes` |
| ATT not called before IDFA | 5.1.2(i) | Control-flow analysis around `advertisingIdentifier` |
| Crypto mining lib | 2.4.2 | Search for `xmrig`, `cgminer`, etc. |
| Hard-coded IPv4 | 2.5.5 | Regex in source |
| Private API selector | 2.5.1 | Strings table of binary for known private selectors |
| Placeholder text | 2.1 | "lorem ipsum", "TODO", "FIXME" |
| Kids Category with analytics | 1.3 / 5.1.4 | Category + linked SDKs |
| ATS disabled globally | 1.6 | `NSAllowsArbitraryLoads = true` in Info.plist |
| Disk APIs without manifest reason | Req. Reason API | `statfs` etc. used + manifest missing reason code |
| Secret in source | 1.6 | Regex for `AKIA`, `sk_live_`, `xox[abp]-`, `AIza` |
| Fake/prank content | 1.1.6 | App name/description scan |
| Loan APR > 36% | 3.2.2(ix) | APR field in app config / pre-acceptance UI |
| Loot box no odds | 3.1.1 | Loot-box UI without probability disclosure |
| Single-WebView app | 4.2 | Root VC is solely a `WKWebView` to external URL |
| External link to non-IAP in restricted storefront | 3.1.1(a) | Outbound URL to payment page without entitlement |

---

# DOCUMENT METADATA

- **Sources fetched:** 2026-05-19
- **Primary:** https://developer.apple.com/app-store/review/guidelines/
- **Privacy Manifest:** https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
- **Required Reason API:** https://developer.apple.com/documentation/bundleresources/privacy-manifest-files/describing-use-of-required-reason-api
- **Third-party SDKs:** https://developer.apple.com/support/third-party-SDK-requirements/
- **Account Deletion:** https://developer.apple.com/support/offering-account-deletion-in-your-app/
- **App Tracking Transparency:** https://developer.apple.com/documentation/apptrackingtransparency
- **Sign in with Apple:** https://developer.apple.com/sign-in-with-apple/

Notes:
- Section 5.6 subsection titles ("Developer Trust" / "Community Etiquette" / "Discovery Fraud") and exact text were reconstructed from authoritative Apple developer-news posts plus partial fetches of the live guidelines, because the full live page returned truncated content. Plugin authors should periodically re-fetch the live page and replace the 5.6.x verbatim text when Apple's HTML responds with the complete section.
- Some guideline subsections referenced in early drafts (e.g., 4.8.1–4.8.5, 4.9.1–4.9.2) do not exist in the current published guidelines; only the parent rules (4.8, 4.9) are active and captured above.
