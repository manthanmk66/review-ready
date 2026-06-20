---
name: scan
description: Pre-submission compliance audit for iOS App Store and Google Play. Scans an iOS/Android/React Native/Expo project against Apple App Store Review Guidelines and Google Play Developer Policy, flags rejection risks by severity, and recommends fixes. Use whenever the user mentions app store submission, app rejection, App Store Connect, Play Console, TestFlight rejection, iOS review, Android review, privacy manifest, ATT prompt, App Tracking Transparency, Sign in with Apple, in-app purchase compliance, target SDK, data safety form, foreground service type, account deletion requirement, or asks to "check my app before submitting".
---

# Review Ready — Pre-Submission Scanner

You are running a comprehensive pre-submission audit on a mobile app project. Your job is to find every issue that would cause an App Store or Play Store rejection BEFORE the user submits, and report them in a prioritized, actionable format.

## When this skill activates

- User runs `/review-ready:scan`
- User asks: "audit my app", "check before App Store submission", "will this get rejected", "is my app ready for Play Store", "review my app for compliance"
- User mentions a specific rejection reason and wants to verify nothing else will trip
- Hooks fire on edits to `Info.plist`, `AndroidManifest.xml`, `app.json`, `eas.json`, `PrivacyInfo.xcprivacy`, or entitlement files

## Step 0 — Detect the project type

Before scanning, identify the stack:

```
- Has app.json or app.config.js/ts → Expo / React Native managed
- Has ios/ directory with .xcodeproj/.xcworkspace → React Native bare OR native iOS
- Has android/ with build.gradle → React Native bare OR native Android
- Only Xcode project, no JS → Native iOS (Swift/Obj-C)
- Only Android project, no JS → Native Android
- Has pubspec.yaml → Flutter (out of scope for v0.1, warn user)
```

Read the relevant config files first:
- `package.json` — SDKs to check against
- `app.json` / `app.config.*` — Expo config
- `ios/<proj>/Info.plist` — native iOS
- `ios/<proj>/PrivacyInfo.xcprivacy` — Required Reason API manifest
- `android/app/src/main/AndroidManifest.xml` — Android permissions
- `android/app/build.gradle` — targetSdk, versionCode
- `eas.json` — build profiles

## Step 1 — Run 5 subagents in parallel

Spawn these subagents simultaneously using the Agent tool. Each gets a focused slice of compliance to investigate:

| Agent | Focus | Checks |
|-------|-------|--------|
| `privacy-auditor` | Privacy compliance | ATT, PrivacyInfo.xcprivacy, permission usage strings, Data Safety form alignment, privacy policy URL, account deletion |
| `iap-business-auditor` | Monetization | Apple IAP 3.1.1 enforcement, Stripe-for-digital-goods detection, subscription disclosure, external payment links, Play Billing |
| `permissions-auditor` | Permissions & APIs | iOS permission strings present for every used capability, Android restricted permissions (SMS, MANAGE_EXTERNAL_STORAGE, etc.), **`READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO` vs. one-off Photo Picker usage → BLOCKER when over-declared (§8.4)**, foreground service types, sensitive APIs |
| `metadata-auditor` | Store listing & app config | Bundle IDs, version numbers, app name length, icon spec, encryption export compliance, Sign in with Apple, target SDK, adaptive icon |
| `crash-risk-auditor` | Stability & quality | Force unwraps, unhandled promises, missing error boundaries, webview-only apps, minimum functionality, common crash patterns |

For each subagent, pass:
1. The project root path
2. The detected stack (Expo / native iOS / native Android / bare RN)
3. Pointer to relevant rule files in `rules/` directory
4. Output schema (severity, guideline ref, file:line, description, fix)

## Step 2 — Aggregate findings

Each subagent returns a JSON list of issues:

```json
{
  "issues": [
    {
      "severity": "BLOCKER" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "store": "apple" | "google" | "both",
      "guideline": "Apple 5.1.1 | Google Data Safety",
      "file": "ios/MyApp/Info.plist",
      "line": 42,
      "title": "Missing NSCameraUsageDescription",
      "description": "App uses expo-camera but Info.plist has no camera permission string.",
      "fix": "Add to ios.infoPlist in app.json: \"NSCameraUsageDescription\": \"Used to scan QR codes for product authentication.\"",
      "auto_fixable": true
    }
  ]
}
```

Severity definitions:
- **BLOCKER** — Will cause rejection 100% of the time (e.g., missing usage string for used permission, IAP bypass, missing PrivacyInfo.xcprivacy, **`READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO` declared on an app that only does one-off/infrequent photo access** — Google's automated pre-review blocks the release, see `rules/android-guidelines.md` §8.4 and `rules/real-rejections.md`)
- **HIGH** — Causes rejection in most cases (e.g., generic permission string, missing Sign in with Apple, Data Safety mismatch)
- **MEDIUM** — Frequent reviewer flag (e.g., over-declared permissions, missing account deletion)
- **LOW** — Best practice issue (e.g., missing privacy policy in-app link, console.log in production)
- **INFO** — Awareness only (e.g., upcoming policy changes, manual steps reminder)

## Step 3 — Produce the rich CLI report

Print a colourful, scannable summary directly in the chat. The terminal renders
GitHub-flavoured markdown, so use **emoji as severity colour**, a **summary
table**, and a **block-char severity bar** — not plain headers. This is the
instant view; the full visual report opens in the browser in Step 3.5.

Use the same severity emoji everywhere so the CLI and HTML always agree:
🛑 BLOCKER · ⚠️ HIGH · 📋 MEDIUM · 💡 LOW · ℹ️ INFO · ✅ Passed.

Output this exact structure:

```markdown
# 🛡️ Review Ready — Audit Report
**<project name>** · <Expo SDK X / Native iOS / etc.> · scanned <timestamp>

> ### <🔴 NOT READY — N blockers must be fixed | 🟡 READY — WITH WARNINGS | 🟢 READY>

| Store | 🛑 Blockers | ⚠️ High | 📋 Medium | ✅ Passed |
|-------|:----------:|:------:|:--------:|:--------:|
| 🍎 Apple | **N** | N | N | N |
| 🤖 Google | N | N | N | N |

**Severity mix**  `<emoji run, e.g. 🛑🛑⚠️⚠️📋>`  → `████░░░░░░ NN% critical`

## 🛑 Blockers — fix these first

**1. [Title]** &nbsp;`🔧 auto-fixable`   ← omit pill if not auto-fixable
- 📕 Apple 5.1.1 — Data Collection & Storage
- 📍 `app.json:15`
- [Full description]
- ✅ **Fix:** [Specific code or config to change]

**2. ...**

## ⚠️ High Risk
- **[Title]** — 📕 <guideline> · `file:line` · [one-line summary]

## 📋 Medium Risk
- ...

## 💡 Low + ℹ️ Info
- ...

## ✅ Passed (N)
`✓ PrivacyInfo.xcprivacy present` &nbsp; `✓ Target SDK 35` &nbsp; …
```

Build the `████░░░░` bar from the share of BLOCKER+HIGH issues out of all issues
(round to nearest 10%). Keep BLOCKER and HIGH issues fully expanded; MEDIUM/LOW/
INFO can be one-liners.

## Step 3.5 — Open the colourful HTML report

Generate a self-contained **Dashboard** HTML report and open it in the user's
browser instantly. The plugin ships a zero-dependency Node generator at
`${CLAUDE_PLUGIN_ROOT}/scripts/render-report.js`.

1. Write the aggregated findings to a temp JSON file using the generator's
   schema (see top of `render-report.js`):

   ```json
   {
     "project": "<name>",
     "stack": "<stack>",
     "scannedAt": "<ISO timestamp>",
     "issues": [ { "severity", "store", "guideline", "file", "line",
                   "title", "description", "fix", "auto_fixable" } ],
     "passed": [ "<verified check>", ... ]
   }
   ```

   Save it to a temp path, e.g. `<project root>/.review-ready-findings.json`.

2. Run the generator, passing the findings file and the project root as the
   output dir. It writes `review-ready-report.html` and prints its path:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/render-report.js" "<project root>/.review-ready-findings.json" "<project root>"
   ```

3. Open the printed HTML path in the default browser, trying in order until one
   succeeds, then clean up the temp JSON:

   ```bash
   open "<path>" 2>/dev/null || xdg-open "<path>" 2>/dev/null || start "" "<path>" 2>/dev/null || echo "Open this report in your browser: <path>"
   rm -f "<project root>/.review-ready-findings.json"
   ```

   - `open` → macOS · `xdg-open` → Linux · `start` → Windows. If all fail, the
     printed path is the fallback (the file is fully self-contained, so the user
     can open it manually anytime).

4. Confirm in chat: tell the user the colourful report just opened in their
   browser and that `review-ready-report.html` was saved to the project root
   (mention they can re-open it anytime). Suggest adding it to `.gitignore` if
   they don't want to commit it.

## Step 4 — Offer auto-fix

After presenting the report, ask the user:

> Want me to auto-fix the safe items? I can:
> 1. Add missing permission usage strings (with sensible defaults you can refine)
> 2. Set `usesNonExemptEncryption: false` if app only uses HTTPS
> 3. Add `expo-tracking-transparency` to package.json if IDFA SDKs detected
> 4. Generate stub `PrivacyInfo.xcprivacy` with common Required Reason API declarations
>
> I will NOT auto-fix:
> - Anything that requires App Store Connect / Play Console (manual)
> - IAP migration (architectural change)
> - Adding Sign in with Apple (requires UI work)
> - Account deletion implementation (backend + UI)

## Knowledge base references

All compliance rules are documented in the plugin's `rules/` directory. Subagents should consult:

- `rules/ios-guidelines.md` — Every Apple App Store Review Guideline 1.x–5.x with check patterns
- `rules/android-guidelines.md` — Every Google Play Developer Policy with check patterns
- `rules/expo-rules.md` — Maps Apple/Google rules to Expo `app.json` / `eas.json` / native files
- `rules/real-rejections.md` — **Verbatim real rejection emails** with the failing pattern and fix. Consult this for patterns reviewers actually cite, not just the published guideline text. Updated as new rejections are observed.

## Important behaviors

**Be specific, not generic.** Don't say "you might have a permissions issue." Say: "Line 47 of `app.json` requests `NSCameraUsageDescription` but the string 'We need camera access' is generic — Apple's 5.1.1 requires explaining the *specific* purpose. Change to: 'ReviewReady uses your camera to scan QR codes for product authentication.'"

**Cite the guideline.** Every issue must reference the exact Apple guideline number or Google policy name. Reviewers cite these; developers need to know which rule.

**Don't over-flag.** If a check is uncertain (heuristic), mark it MEDIUM or LOW and explain. Reserve BLOCKER for items that are 100% rejected.

**Respect the stack.** Don't tell an Expo dev to edit `Info.plist` directly — tell them to update `app.json > ios.infoPlist`. Don't tell a native iOS dev about `app.json`.

**Currency.** All guidelines were captured as of May 2026. Note upcoming deadlines (Play 16KB May 1 2026, Apple privacy manifest enforcement, etc.) as INFO items.

**Test on real apps first.** This plugin was developed and validated against real Expo / React Native projects. Subagents should default to a conservative interpretation when ambiguous.
