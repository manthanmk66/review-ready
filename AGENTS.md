# Review Ready

Pre-submission compliance auditor for iOS App Store and Google Play. This is a multi-tool plugin compatible with Claude Code, Cursor, and Codex.

## What this plugin does

Scans iOS / Android / React Native / Expo projects against Apple App Store Review Guidelines (Sections 1-5) and Google Play Developer Policy. Flags rejection risks with severity ranking and recommends fixes. Auto-applies safe fixes for common compliance issues.

## Available commands

- `/review-ready:scan` — Full audit. Spawns parallel subagents (privacy, IAP, permissions, metadata, crash-risk) to produce a severity-ranked report.
- `/review-ready:precheck` — Quick 30-second top-10 blocker check.
- `/review-ready:fix` — Auto-fixes safe issues (permission strings, encryption flags, PrivacyInfo.xcprivacy stub, etc.).

## When to invoke

Invoke these commands when the user:
- Is preparing to submit to the App Store, Play Store, TestFlight, or runs EAS Build for production
- Has received an Apple or Google rejection email
- Asks about specific guidelines (e.g., "Apple 4.8 Sign in with Apple", "Apple 5.1.1 privacy", "Google Data Safety")
- Edits sensitive files: `Info.plist`, `PrivacyInfo.xcprivacy`, `AndroidManifest.xml`, `app.json`, `eas.json`, entitlements
- Mentions ITMS-xxxxx error codes from App Store Connect

## How the audit works

1. **Detect the stack** — Read `package.json`, `app.json`, `ios/`, `android/` to determine whether this is Expo managed, Expo bare, React Native CLI, native iOS, or native Android.
2. **Spawn 5 parallel subagents** — each agent in `agents/` audits one slice:
   - `privacy-auditor.md` — ATT, PrivacyInfo.xcprivacy, permission usage strings, account deletion, data safety, forced-login justification
   - `iap-business-auditor.md` — Apple 3.1.1, Play Billing, subscription disclosure, ad placement
   - `permissions-auditor.md` — Android restricted permissions, foreground service types, prominent disclosure
   - `metadata-auditor.md` — bundle IDs, icons, Sign in with Apple (Apple 4.8), target SDK, Guideline 3.2 business app distribution
   - `crash-risk-auditor.md` — stability, dev artifacts, minimum functionality, demo credentials
3. **Aggregate findings** — produce a markdown report with BLOCKER, HIGH, MEDIUM, LOW, INFO severity tiers.
4. **Reference the knowledge base** — `rules/ios-guidelines.md`, `rules/android-guidelines.md`, `rules/expo-rules.md`, and `rules/real-rejections.md` contain the source-of-truth compliance data.

## Critical behaviors

- **Cite the exact guideline number** for every finding (Apple X.X.X or Google policy name).
- **Be specific** — never say "you might have an issue"; say "Line 47 of `app.json` is missing X."
- **Don't over-flag** — uncertain findings are MEDIUM, not BLOCKER. Reserve BLOCKER for 100%-rejected items.
- **Respect the stack** — Expo devs edit `app.json`, native iOS devs edit `Info.plist` directly.
- **Consult `rules/real-rejections.md`** — for patterns reviewers actually cite, not just published guideline text.

## Tool compatibility

This plugin is structured for all three major AI coding tools:

| Tool | Manifest | Plugin discovery |
|------|----------|------------------|
| Claude Code | `.claude-plugin/plugin.json` | `~/.claude/plugins/` or marketplace |
| Cursor | `.cursor-plugin/plugin.json` + `.cursor/rules/review-ready.mdc` | Cursor marketplace |
| Codex | `AGENTS.md` + `marketplace.json` + `.agents/skills/` | Codex CLI / VS Code extension |

Skill content (`skills/*/SKILL.md`), agent definitions (`agents/*.md`), hooks (`hooks/`), and knowledge base (`rules/`) are shared across all three tools.
