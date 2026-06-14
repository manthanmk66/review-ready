<h1 align="left">
  <img src="https://github.com/user-attachments/assets/8a830804-529a-4c0d-b901-8092bf82c3a4" alt="RR Logo" width="28" />
   Review Ready
</h1>

**Pre-submission compliance auditor for iOS App Store & Google Play.** Stop guessing what will get your app rejected — scan it first.

[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-blueviolet)](https://claude.ai/plugins) [![Cursor](https://img.shields.io/badge/Cursor-Plugin-black)](https://cursor.com/marketplace) [![Codex](https://img.shields.io/badge/Codex-Plugin-10a37f)](https://developers.openai.com/codex/plugins) ![Status](https://img.shields.io/badge/status-beta-orange) ![License](https://img.shields.io/badge/license-MIT-green)

Works in **Claude Code**, **Cursor**, and **Codex** — one plugin, three tools.

---

## What it does

Run one command and find out **before** you submit:

- Every Apple App Store Review Guideline violation in your project
- Every Google Play Developer Policy issue
- Privacy manifest gaps (the #1 cause of "ITMS-91053" emails from Apple)
- Permission usage strings missing or too generic
- IAP bypass attempts that get auto-rejected
- Account deletion missing (required since 2022)
- Sign in with Apple gaps when third-party login is present
- Target SDK / 64-bit / 16 KB page size compliance
- Foreground service type declarations
- Data Safety form misalignment

Built for **Expo / React Native** projects first, with full **native iOS** and **native Android** support.

---

## Install

### Claude Code
```bash
# From marketplace (after approval)
/plugin install review-ready

# Or locally:
git clone https://github.com/manthanmk66/review-ready ~/.claude/plugins/review-ready
```
Restart Claude Code after install.

### Cursor
1. Open Cursor → Settings → Plugins → Add from GitHub
2. Paste: `https://github.com/manthanmk66/review-ready`
3. Or install directly from the [Cursor Marketplace](https://cursor.com/marketplace) (after approval)

### Codex
```bash
# Inside Codex CLI
/plugin marketplace add manthanmk66/review-ready
/plugin install review-ready@review-ready-marketplace
/reload-plugins
```

Or clone the repo into a project — Codex auto-reads the `AGENTS.md` file.

---

## Commands

### `/review-ready:scan`
Full audit. Spawns 5 parallel subagents:
- `privacy-auditor` — ATT, PrivacyInfo.xcprivacy, usage strings, data safety
- `iap-business-auditor` — IAP enforcement, subscriptions, ad placement
- `permissions-auditor` — restricted permissions, FGS types, prominent disclosure
- `metadata-auditor` — bundle IDs, icons, Sign in with Apple, target SDK
- `crash-risk-auditor` — crash patterns, localhost URLs, minimum functionality

Outputs a severity-ranked report with exact file:line references and fixes for every issue.

### `/review-ready:precheck`
Fast pre-submission sanity check. Top 10 blockers only. ~30 seconds.

### `/review-ready:fix`
Auto-applies safe fixes from the latest scan — missing usage strings, encryption flags, PrivacyInfo.xcprivacy stub, expo-tracking-transparency setup.

---

## Auto-warnings (hooks)

The plugin watches edits to these files and reminds you of compliance pitfalls in real time:

- `Info.plist`
- `PrivacyInfo.xcprivacy`
- `AndroidManifest.xml`
- `app.json` / `app.config.js`
- `eas.json`
- `*.entitlements`

---

## Example output

Every scan produces **two views**: a rich summary in your terminal, and a
colourful **Dashboard HTML report** that opens in your browser automatically.

**1. In the terminal** — emoji-coded severity, a per-store summary table, and a
severity gauge:

```
# 🛡️ Review Ready — Audit Report
Acme · Expo SDK 54 / React Native 0.81 · scanned 2026-06-14

> 🔴 NOT READY — 2 blockers must be fixed before submitting

| Store    | 🛑 Blockers | ⚠️ High | 📋 Medium | ✅ Passed |
|----------|:----------:|:------:|:--------:|:--------:|
| 🍎 Apple | 2          | 3      | 4        | 24       |
| 🤖 Google| 0          | 1      | 2        | 28       |

Severity mix  🛑🛑⚠️⚠️⚠️📋📋📋📋  → ████░░░░░░ 22% critical

## 🛑 Blockers — fix these first
1. Missing NSCameraUsageDescription   🔧 auto-fixable
   📕 Apple 5.1.1 — Data Collection & Storage · 📍 app.json:15
   ✅ Fix: add NSCameraUsageDescription to ios.infoPlist
...
```

**2. In your browser** — a self-contained `review-ready-report.html` (Dashboard
style): readiness badge, colour stat cards (Blockers / High / Medium / Passed),
severity-coded issue cards with guideline refs and fixes, and a manual-steps
checklist. It opens the instant the scan finishes, has zero external
dependencies, and can be re-opened or shared anytime.

> Tip: add `review-ready-report.html` to `.gitignore` if you don't want to
> commit the report.

---

## What it knows

The plugin ships with a structured knowledge base captured from the latest Apple and Google policies:

- **`rules/ios-guidelines.md`** — All Apple App Store Review Guidelines (Sections 1–5), Privacy Manifest spec, Required Reason APIs, ATT requirements, Sign in with Apple rules
- **`rules/android-guidelines.md`** — Full Google Play Developer Policy, Data Safety, foreground service types, permission declarations, target SDK requirements, 2026 deadlines (16 KB pages, Health/News declarations, contacts policy)
- **`rules/expo-rules.md`** — Maps every store rule to specific Expo `app.json` / `eas.json` keys and SDK detection patterns

Updated against guidelines as of **May 2026**.

---

## Supported stacks

| Stack | Status |
|-------|--------|
| Expo (managed) | ✅ Fully supported |
| Expo (bare) | ✅ Fully supported |
| React Native CLI | ✅ Fully supported |
| Native iOS (Swift/Obj-C) | ✅ Fully supported |
| Native Android (Kotlin/Java) | ✅ Fully supported |
| Flutter | 🚧 Planned for v0.2 |

---

## Why this plugin exists

App Store rejections are the silent killer of mobile development velocity:

- Average rejection cycle: 24–48 hours of wait time per round
- Average iOS app needs 2–4 rejection cycles before approval
- Each cycle costs roughly a week of momentum
- Most rejections are for the **same handful of issues** the developer didn't know about

This plugin encodes the institutional knowledge that experienced mobile leads have — applied automatically before you ever hit "Submit for Review."

---

## Limitations

Some issues can't be detected from code alone:

- **App Store Connect / Play Console settings** — privacy nutrition labels, demo account info, age rating, content policies. The plugin reminds you to verify these manually.
- **Visual / content judgment** — copycat detection, asset quality, design polish.
- **Runtime behavior** — actual crashes, performance, ANRs (recommend integrating Sentry or Crashlytics).
- **Pending policy changes** — the plugin flags known upcoming deadlines (16 KB pages, target SDK bumps), but new policies may emerge. Re-check Apple/Google docs quarterly.

---

## Contributing

Issues and PRs welcome at [github.com/manthanmk66/review-ready](https://github.com/manthanmk66/review-ready).

**Adding a rule?** Edit the relevant `rules/*.md` file and the corresponding subagent in `agents/`.
**Adding a stack?** Add a new `rules/<stack>-rules.md` and update the scan skill's stack detection.

---

## License

MIT

---

## Acknowledgments

Built on the [Claude Code](https://claude.com/claude-code) plugin platform. Knowledge base compiled from Apple's [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) and Google's [Play Developer Policy Center](https://play.google/developer-content-policy/).

Inspired by every developer who's watched their build sit in "In Review" for 48 hours just to be rejected for a missing usage string.
