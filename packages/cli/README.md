# review-ready (CLI)

**Deterministic** pre-submission compliance scanner for the iOS App Store and Google Play. No API key, no LLM, no agent host — just a fast static scan you can run locally or in CI.

```bash
npx review-ready-cli
```

> Published as **`review-ready-cli`** on npm; the installed command is still **`review-ready`**.

This is the deterministic engine that complements the [Review Ready](https://github.com/manthanmk66/review-ready) AI plugin. The CLI catches the **mechanically-detectable** rejection causes (permission/manifest/config issues); the plugin adds the judgment-based checks (content rules, crash-risk heuristics, prominent-disclosure copy).

## Usage

```bash
review-ready [dir]              # scan a project (default: current dir)
review-ready --json             # machine-readable findings (for tooling/CI)
review-ready --html             # also write review-ready-report.html
review-ready --category=permissions
review-ready --base <git-ref>   # PR mode: only report issues NEW vs that ref
review-ready --diff <file.json> # PR mode: only report issues NEW vs a saved scan
```

**Exit codes** — designed to gate a pipeline:

| Code | Meaning |
|------|---------|
| `0`  | No blockers found (no *new* blockers in diff mode) |
| `1`  | One or more blockers — fails the build |
| `2`  | Usage / internal error |

## PR mode — fail only on *new* issues

A repo with pre-existing (legacy) issues shouldn't fail every build. `--base` scans the base git ref in a throwaway `git worktree` (never touches your tree) and reports only what the change **introduces** — so the PR fails only if it adds a new blocker.

```bash
review-ready --base origin/main          # local
review-ready --diff base-findings.json   # or compare against a saved scan
```

Findings are matched by a line-independent fingerprint, so unrelated edits that shift line numbers don't masquerade as new issues.

## GitHub Action

```yaml
# .github/workflows/review-ready.yml
on: { pull_request: { branches: [main] } }
jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }   # required for --base diffing
      - uses: manthanmk66/review-ready/packages/cli@main
        with:
          directory: "."
          # base-ref defaults to the PR base branch; only NEW blockers fail the build
```

The action uploads the HTML report as a build artifact. See [examples/github-workflow.yml](examples/github-workflow.yml) and [action.yml](action.yml).

## What it checks today

Two auditors are ported to the deterministic engine. Run all, or one with `--category=permissions` / `--category=metadata`.

### `permissions`
- **Android §8.4 photo/video BLOCKER** — `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO` declared for one-off picker usage (Google's automated pre-review hard-blocks this). Source heuristic separates one-off picking (BLOCKER) from genuine gallery enumeration (HIGH → needs Declaration).
- **iOS usage strings (Apple 5.1.1)** — every installed capability module (`expo-camera`, `expo-image-picker`, `expo-location`, …) must have its `NS…UsageDescription`. Missing → BLOCKER; vague → HIGH.
- **Restricted Android permissions** — SMS/Call Log, `MANAGE_EXTERNAL_STORAGE`, background location, `QUERY_ALL_PACKAGES`, accessibility, health → HIGH (needs Play Console declaration).
- **Over-declared legacy storage** — `READ_/WRITE_EXTERNAL_STORAGE` on modern target SDKs → MEDIUM.
- **Foreground service types (Android 14+)** — FGS without `foregroundServiceType` → BLOCKER.

### `metadata`
- **Bundle identifiers** — missing → BLOCKER; placeholder (`com.anonymous.*`, `com.example.*`) → HIGH.
- **Encryption export compliance** — `ios.config.usesNonExemptEncryption` unset → HIGH (auto-fixable; blocks every App Store Connect upload).
- **Sign in with Apple (Apple 4.8)** — confirmed social login (Google/Facebook/…) without `expo-apple-authentication` → BLOCKER; hosted-account auth (Firebase/Auth0/Clerk, incl. phone-OTP) without SiwA → HIGH.
- **Android target SDK** — below API 36 → BLOCKER (set in `android/app/build.gradle`, `android/gradle.properties` or `expo-build-properties`) or HIGH (inferred from the Expo / React Native version).
- **App name** — > 30 chars → HIGH; promotional words / emoji → MEDIUM.
- **Version & build numbers** — non-semver version, non-integer `versionCode`, non-string `buildNumber` → flagged (respects `eas.json` remote version source).
- **App Transport Security** — `NSAllowsArbitraryLoads: true` → HIGH.
- **Business app (Apple 3.2)** — B2B/internal signals in bundle id / name / description on public distribution → HIGH/BLOCKER.

Produces a **0–100 readiness score** and a severity-ranked report (terminal + optional HTML dashboard).

## Supported stacks

Expo (managed & bare), React Native CLI, native iOS, native Android. Flutter is detected and flagged as not-yet-supported.

## Scope & honesty

The CLI **only** reports what it can prove from your config/manifest/source. It does **not** evaluate content guidelines, copy quality, icon pixels, ambiguous auth (e.g. Supabase used only as a DB), or runtime behaviour — run the Review Ready plugin (or `--ai`, planned) for those. A green CLI scan means "no mechanical blockers," not "guaranteed approval."

## Development

```bash
npm test          # node:test suite, zero dependencies
npm run scan -- ../some-app
```

Zero runtime dependencies. New auditors plug into `src/scan.js`'s rule registry.

MIT © Manthan Reddy
