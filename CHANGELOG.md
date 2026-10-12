# Changelog

## [0.7.0] / [cli-0.2.0] - 2026-10-12

Policy refresh against everything Apple and Google shipped between May and October 2026.

### Changed: Google Play
- **Target API 36 (Android 16)** is now the minimum for new apps and updates (in force since Aug 31, 2026; extensions ran to Nov 1, 2026). Wear OS / Automotive need 35, TV / XR need 34; existing apps need 35 to stay visible to new users. The CLI's `MIN_TARGET_SDK` is now 36.
- **Fixed Expo → targetSdk mapping.** Expo SDK 52 targets API 34 (it compiles against 35), not 35, so the CLI was passing SDK 52 projects it should have flagged. The map is now 52 → 34, 53 → 35, 54+ → 36, taken from the bundled React Native template.
- July 15, 2026 announcement folded in: `READ_CALL_LOG` for missed-call / flash-call phone verification is banned (BLOCKER; use SMS Retriever or the Digital Credentials API), anonymous / random chat apps fall under Age-Restricted Content + Child Safety from Aug 26, unrated apps aren't allowed, third-party AI integrations are covered by User Data, location Data safety guidance, and app registration for Android developer verification.
- Past deadlines (16 KB pages, News declaration, Health org accounts, prediction-market enrollment) are now described as enforced instead of upcoming.

### Changed: Apple
- **Xcode 26 / iOS 26 SDK upload gate** (since Apr 28, 2026) and the iOS 13 deployment-target floor (since Sep 9, 2026). The metadata auditor and precheck flag Expo SDK ≤ 53 builds without an Xcode 26 EAS image.
- **4.3(b) rewrite (Jun 8, 2026):** dating, flashlight, sound effects, wallpaper, simple timer, and fortune telling apps are rejected without a meaningful differentiator, and stale ones may be removed. New metadata-auditor Check 16.
- **1.2:** random / anonymous chat named as not belonging on the App Store (Feb 6, 2026); developers must actually remove violating content (Jun 8, 2026).
- **4.5.3:** Live Activities added to the no-spam rule.
- **2.3.6:** new 13+ / 16+ / 18+ age rating questionnaire (required since Jan 31, 2026), plus an INFO note on US state age-assurance laws (Declared Age Range / Play Age Signals).

### Added
- `privacy-auditor` Check 10 (third-party AI data sharing) and Check 11 (UGC moderation and anonymous chat). Neither store rule was checked by any auditor before.
- CLI target SDK check now reads `android/gradle.properties` (`android.targetSdkVersion`, where `expo-build-properties` writes it) and `android/build.gradle` / `build.gradle.kts`, ignores commented-out lines, infers from the React Native version for bare projects (0.73–0.76 → 34, 0.77–0.80 → 35, 0.81+ → 36), rejects non-integer `expo-build-properties` values instead of passing them, and derives the "upgrade to Expo SDK N+" advice from the map. Without the `gradle.properties` read, the API 36 bump would have flagged Expo 53 projects that already target 36.
- 11 CLI tests for target SDK resolution (34 total).

## [cli-0.1.0] - 2026-06-20

### Added — Standalone deterministic CLI (`review-ready-cli` on npm)
- New `packages/cli` — a zero-dependency, no-LLM scanner that runs the same compliance knowledge as deterministic static checks. `npx review-ready-cli` works locally or in CI with no API key; the installed command is `review-ready`.
- **Two auditors ported from the plugin's agent prompts:** `permissions` (Android §8.4 photo/video BLOCKER, iOS usage strings, restricted permissions, over-declared storage, foreground service types) and `metadata` (bundle IDs, encryption export flag, Sign in with Apple 4.8, target SDK, app name, version/build, ATS, Apple 3.2 business-app signal).
- **PR mode** — `--base <git-ref>` scans the base ref in a throwaway `git worktree` and reports only newly-introduced issues (line-independent fingerprint), so pre-existing issues don't fail every build. `--diff <file.json>` compares against a saved scan.
- **0–100 readiness score**, severity-ranked terminal report, and an optional self-contained HTML dashboard (`--html`). Exit code 1 on blockers gates CI.
- **GitHub Action** (`action.yml`) + example workflow: auto-derives the PR base branch, fails only on new blockers, uploads the HTML report as an artifact.
- 23 tests (`node:test`, zero deps). Judgment-based checks (content rules, icon pixels, ambiguous auth, crash-risk) remain in the plugin by design.

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
