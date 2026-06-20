# Changelog

## [0.6.0] - 2026-06-20

### Fixed — Photo & Video permissions severity
- **`READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` on one-off / infrequent photo access is now a Play BLOCKER** (was previously HIGH / "needs Declaration"). Google's automated pre-review **blocks the release from being sent for review** in this pattern, so it must be a blocker. Auditors now use a usage heuristic: single `launchImageLibraryAsync` / `PickVisualMedia` picker call → BLOCKER + remove the permission; full in-app gallery / photo editor → HIGH + file the Photo & Video Permissions Declaration.
- `rules/android-guidelines.md` §8.4 rewritten with the BLOCKER-vs-HIGH severity rule, the Expo auto-injection caveat (`expo-media-library` / `expo-image-picker`), and the exact removal fix (`tools:node="remove"` + `android.blockedPermissions`, `requestPermissionsAsync(true)` for write-only gallery save).
- Added verbatim June 2026 Play Console pre-review block to `rules/real-rejections.md` with the failing pattern and verified fix.
- `scan` skill: BLOCKER severity definition and `permissions-auditor` scope updated to flag this case.

## [0.5.0] - 2026-06-14

### Added
- **Colourful scan reports.** Every `/review-ready:scan` now produces two views:
  - A rich **terminal report** — emoji-coded severity, a per-store summary table, and a `████░░░░` severity gauge.
  - A self-contained **Dashboard HTML report** (`review-ready-report.html`) that opens in the browser automatically the moment a scan finishes — readiness badge, colour stat cards (Blockers / High / Medium / Passed), severity-coded issue cards with guideline refs and fixes, and a manual-steps checklist.
- `scripts/render-report.js` — zero-dependency Node generator that turns aggregated findings JSON into the HTML report. All CSS inlined, so the report opens offline and can be re-opened or shared anytime. HTML-escapes all content.

### Changed
- `skills/scan/SKILL.md` — Step 3 rewritten as the rich CLI report; new Step 3.5 generates and opens the HTML report (`open` / `xdg-open` / `start` with a printed-path fallback). Shared via symlink with the Cursor/Codex `.agents/skills/` tree.

## [0.4.0] - 2026-05-23

### Added — Multi-tool support
- **Cursor** plugin support: `.cursor-plugin/plugin.json` manifest + `.cursor/rules/review-ready.mdc` activator rule. Listed on the [Cursor Marketplace](https://cursor.com/marketplace) submission queue.
- **Codex** plugin support: `AGENTS.md` for project-level instructions, `marketplace.json` for marketplace catalog, `.agents/skills/` directory with symlinks to the shared SKILL.md files. Discoverable via Codex CLI `/plugin marketplace add`.
- Updated README with Claude Code + Cursor + Codex install instructions.

### Architecture
- Skills (`skills/`), agents (`agents/`), hooks (`hooks/`), and knowledge base (`rules/`) are shared across all three tools — single source of truth.
- Tool-specific differences live in `.claude-plugin/`, `.cursor-plugin/`, `.cursor/`, `.agents/`, `AGENTS.md`, `marketplace.json`.

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
