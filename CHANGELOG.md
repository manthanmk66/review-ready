# Changelog

## [0.3.0] - 2026-05-19

### Added
- New forced-login check (Apple 5.1.1(v)) in `privacy-auditor`. Detects auth-gated app entry, classifies the app as transactional vs content, and recommends the App Review Notes justification template for transactional apps.
- New "approved with justification" reference in `rules/real-rejections.md` showing a verified-approved App Review Notes template for forced-login food delivery / pickup apps.
- Plugin now reminds users that OTP-based forced login also requires demo credentials in App Review Notes to avoid Apple 2.1 rejection.

## [0.2.0] - 2026-05-19

### Added
- `rules/real-rejections.md` — verbatim rejection emails from production submissions, with failing patterns and fixes. Auditors now consult this for real-world reviewer behavior, not just published guideline text.
- Apple Guideline 3.2 (Business app distribution) check in `metadata-auditor` — flags B2B/internal apps submitted with public distribution. Detects multi-app developer accounts where the sibling app is clearly the customer-facing one.
- Tightened Sign in with Apple (4.8) detection — now flags `@react-native-firebase/auth`, Supabase Auth, Auth0, Cognito, Clerk even for **phone-OTP-only** flows (Apple's broader interpretation observed in 2024-2026 rejections).
- Tightened purpose string validation (5.1.1(ii)) — now requires specificity, example usage, and concrete consequence. Flags strings under 50 chars or without "when you / for example / such as" patterns.
- Reviewer demo-credentials reminder (Apple 2.1) — flags phone-OTP-only apps that need OTP bypass in App Review Information.

### Changed
- Bumped severity of Firebase Auth + no SiwA from "no issue" to HIGH (was wrongly cleared in 0.1.0).

## [0.1.0] - 2026-05-19

### Added
- Initial release
- `/review-ready:scan` — full pre-submission audit with 5 parallel subagents
- `/review-ready:precheck` — quick top-10 blocker check
- `/review-ready:fix` — auto-fix safe compliance issues
- Auto-warning hooks on edits to `Info.plist`, `AndroidManifest.xml`, `app.json`, `eas.json`, `PrivacyInfo.xcprivacy`, `*.entitlements`
- Knowledge bases:
  - Apple App Store Review Guidelines (Sections 1–5, ~1400 rule entries)
  - Google Play Developer Policy (all sections, ~970 rule entries)
  - Expo / React Native config-to-rule mapping
- Subagents:
  - `privacy-auditor` — Apple 5.1, Google Privacy / Data Safety
  - `iap-business-auditor` — Apple 3.1, Google Play Billing, ad policy
  - `permissions-auditor` — Apple 5.1.1, Google permission declarations + FGS
  - `metadata-auditor` — bundle IDs, icons, Sign in with Apple, target SDK
  - `crash-risk-auditor` — stability, minimum functionality, dev artifacts

### Known limitations
- Flutter and other cross-platform stacks not yet supported (planned for v0.2)
- Cannot inspect App Store Connect / Play Console settings (manual steps flagged as INFO items)
- Heuristic-based detection for some Apple guidelines (1.x content rules) requires human confirmation
