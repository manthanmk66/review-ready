"use strict";

/**
 * metadata — deterministic port of agents/metadata-auditor.md.
 *
 * Covers the config-checkable subset: bundle identifiers, version/build numbers,
 * app name, encryption export flag, Sign in with Apple (4.8), Android target SDK,
 * App Transport Security, and the Apple 3.2 business-app signal.
 *
 * Icon pixel inspection, minimum-functionality judgment, and ambiguous auth
 * (e.g. Supabase used only as a DB) stay in the LLM plugin.
 */

const path = require("path");
const { readText } = require("../parse");
const M = require("../data/metadata-maps");

const CATEGORY = "metadata";

function run(ctx) {
  const issues = [];
  const passed = [];
  const add = (i) => issues.push({ category: CATEGORY, ...i });
  const cfg = ctx.appConfig.config;
  const isExpo = ctx.detected.isExpo;

  // Dynamic config can't be statically read — note once and bail on Expo checks.
  if ((isExpo || ctx.appConfig.path) && ctx.appConfig.dynamic) {
    add({
      severity: "INFO",
      store: "both",
      guideline: "Coverage",
      file: ctx.rel(ctx.appConfig.path),
      title: "Dynamic app.config — metadata not statically checked",
      description: "app.config.js/ts can't be evaluated safely; bundle IDs, version, encryption flag and Sign in with Apple weren't verified. Run the plugin deep-scan.",
      auto_fixable: false,
    });
  }

  checkBundleIds(ctx, cfg, add, passed);
  checkVersions(ctx, cfg, add);
  checkAppName(ctx, cfg, add, passed);
  checkEncryption(ctx, cfg, add, passed);
  checkSignInWithApple(ctx, add, passed);
  checkTargetSdk(ctx, add, passed);
  checkAppTransportSecurity(ctx, cfg, add);
  checkBusinessApp(ctx, cfg, add);

  return { issues, passed };
}

function appFile(ctx) {
  return ctx.rel(ctx.appConfig.path || "app.json");
}
function lineFor(ctx, key) {
  return (ctx.appConfig.raw && ctx.lineOfKey(ctx.appConfig.raw, key)) || undefined;
}

// ── Check 1 — bundle identifiers ────────────────────────────────────────────────
function checkBundleIds(ctx, cfg, add, passed) {
  if (!cfg || ctx.appConfig.dynamic) return;
  const checks = [];
  if (ctx.detected.isExpo || ctx.detected.hasIos)
    checks.push(["ios", "bundleIdentifier", (cfg.ios || {}).bundleIdentifier, "Apple"]);
  if (ctx.detected.isExpo || ctx.detected.hasAndroid)
    checks.push(["android", "package", (cfg.android || {}).package, "Google"]);

  for (const [platform, key, value, store] of checks) {
    const label = platform === "ios" ? "ios.bundleIdentifier" : "android.package";
    if (!value) {
      add({
        severity: "BLOCKER",
        store: store.toLowerCase(),
        guideline: store === "Apple" ? "Apple — App Config" : "Google — App Config",
        file: appFile(ctx),
        line: lineFor(ctx, key),
        title: `Missing ${label}`,
        description: `${label} is not set. Production builds (EAS Build) fail without it.`,
        fix: `Set "${platform}": { "${key}": "com.yourcompany.yourapp" } in app.json (reverse-DNS).`,
        auto_fixable: false,
      });
    } else if (M.PLACEHOLDER_BUNDLE_RE.test(value)) {
      add({
        severity: "HIGH",
        store: store.toLowerCase(),
        guideline: "App identity",
        file: appFile(ctx),
        line: lineFor(ctx, key),
        title: `Placeholder ${label}: ${value}`,
        description: `${label} is "${value}", a generated/placeholder identifier. Stores and reviewers flag com.anonymous.* / com.example.* — and you can't change it after first publish.`,
        fix: `Change ${label} to your real reverse-DNS id (e.g. com.yourcompany.${(value.split(".").pop() || "app")}) before first submission.`,
        auto_fixable: false,
      });
    } else if (!M.VALID_BUNDLE_RE.test(value)) {
      add({
        severity: "HIGH",
        store: store.toLowerCase(),
        guideline: "App identity",
        file: appFile(ctx),
        line: lineFor(ctx, key),
        title: `Malformed ${label}: ${value}`,
        description: `${label} "${value}" is not a valid reverse-DNS identifier.`,
        fix: `Use a valid reverse-DNS id such as com.yourcompany.yourapp.`,
        auto_fixable: false,
      });
    } else {
      passed.push(`${label} set and valid (${value})`);
    }
  }
}

// ── Check 2 — version & build numbers ───────────────────────────────────────────
function checkVersions(ctx, cfg, add) {
  if (!cfg || ctx.appConfig.dynamic) return;
  const version = cfg.version || (ctx.detected.packageJson && ctx.detected.packageJson.version);
  if (!version) {
    add({
      severity: "MEDIUM",
      store: "both",
      guideline: "App Config",
      file: appFile(ctx),
      line: lineFor(ctx, "version"),
      title: "No app version set",
      description: "No `version` in app.json. Set a semver version for the store listing.",
      fix: 'Add "version": "1.0.0" to app.json.',
      auto_fixable: false,
    });
  } else if (!/^\d+\.\d+(\.\d+)?$/.test(String(version))) {
    add({
      severity: "MEDIUM",
      store: "both",
      guideline: "App Config",
      file: appFile(ctx),
      line: lineFor(ctx, "version"),
      title: `Version "${version}" is not semver`,
      description: "Store versions should be semantic (e.g. 1.0.0).",
      fix: 'Use a semver string like "1.0.3".',
      auto_fixable: false,
    });
  }

  // versionCode/buildNumber may legitimately live in eas.json (remote source).
  const easRemote = readEas(ctx) && readEas(ctx).cli && readEas(ctx).cli.appVersionSource === "remote";
  const vc = (cfg.android || {}).versionCode;
  if (vc !== undefined && !Number.isInteger(vc)) {
    add({
      severity: "BLOCKER",
      store: "google",
      guideline: "App Config",
      file: appFile(ctx),
      line: lineFor(ctx, "versionCode"),
      title: "android.versionCode must be an integer",
      description: `versionCode is ${JSON.stringify(vc)}; Play requires a monotonically increasing integer.`,
      fix: 'Set "android": { "versionCode": 1 } (integer, no quotes).',
      auto_fixable: false,
    });
  }
  const bn = (cfg.ios || {}).buildNumber;
  if (bn !== undefined && typeof bn !== "string") {
    add({
      severity: "MEDIUM",
      store: "apple",
      guideline: "App Config",
      file: appFile(ctx),
      line: lineFor(ctx, "buildNumber"),
      title: "ios.buildNumber should be a string",
      description: `buildNumber is ${JSON.stringify(bn)}; Expo expects a string like "1".`,
      fix: 'Use "ios": { "buildNumber": "1" }.',
      auto_fixable: false,
    });
  }
  void easRemote; // documented: we don't flag missing build numbers when remote.
}

// ── Check 3 — app name ──────────────────────────────────────────────────────────
function checkAppName(ctx, cfg, add, passed) {
  if (!cfg || ctx.appConfig.dynamic) return;
  const name = cfg.name;
  if (!name) {
    add({
      severity: "HIGH",
      store: "both",
      guideline: "Store Listing",
      file: appFile(ctx),
      line: lineFor(ctx, "name"),
      title: "No app name set",
      description: "app.json has no `name`.",
      fix: 'Add "name": "Your App".',
      auto_fixable: false,
    });
    return;
  }
  if (name.length > 30) {
    add({
      severity: "HIGH",
      store: "google",
      guideline: "Google Play 6.2 — Store Listing",
      file: appFile(ctx),
      line: lineFor(ctx, "name"),
      title: `App name is ${name.length} chars (max 30)`,
      description: `"${name}" exceeds Google Play's 30-character app-name limit.`,
      fix: "Shorten the app name to 30 characters or fewer.",
      auto_fixable: false,
    });
  }
  if (M.BANNED_NAME_RE.test(name) || M.EMOJI_RE.test(name)) {
    add({
      severity: "MEDIUM",
      store: "both",
      guideline: "Google Play 6.2 / Apple 2.3.7",
      file: appFile(ctx),
      line: lineFor(ctx, "name"),
      title: "App name contains promotional text or emoji",
      description: `"${name}" includes words like Free/Best/#1 or an emoji, which Google and Apple strip or reject in the app name.`,
      fix: "Remove promotional words and emoji from the name; put keywords in the description instead.",
      auto_fixable: false,
    });
  }
  if (name.length <= 30 && !M.BANNED_NAME_RE.test(name) && !M.EMOJI_RE.test(name)) {
    passed.push("App name within limits and clean");
  }
}

// ── Check 5 — encryption export compliance ──────────────────────────────────────
function checkEncryption(ctx, cfg, add, passed) {
  if (!cfg || ctx.appConfig.dynamic) return;
  if (!(ctx.detected.isExpo || ctx.detected.hasIos)) return;
  const v = ((cfg.ios || {}).config || {}).usesNonExemptEncryption;
  const plistV = ctx.infoPlist && ctx.infoPlist.keys.has("ITSAppUsesNonExemptEncryption");
  if (v === undefined && !plistV) {
    add({
      severity: "HIGH",
      store: "apple",
      guideline: "Apple 5.4 — Encryption Export Compliance",
      file: appFile(ctx),
      line: lineFor(ctx, "ios"),
      title: "Encryption export compliance not declared",
      description: "ios.config.usesNonExemptEncryption is unset. App Store Connect blocks every upload with the encryption question until you answer it. Most apps (HTTPS only) answer false.",
      fix: 'Add "ios": { "config": { "usesNonExemptEncryption": false } } to app.json.',
      auto_fixable: true,
    });
  } else if (v === false) {
    passed.push("Encryption export compliance declared (false)");
  } else if (v === true) {
    add({
      severity: "INFO",
      store: "apple",
      guideline: "Apple 5.4 — Encryption Export Compliance",
      file: appFile(ctx),
      line: lineFor(ctx, "ios"),
      title: "App declares non-exempt encryption",
      description: "usesNonExemptEncryption is true — you'll need an ERN / CCATS export documentation. Confirm this is intended.",
      auto_fixable: false,
    });
  }
}

// ── Check 6 — Sign in with Apple (4.8) ──────────────────────────────────────────
function checkSignInWithApple(ctx, add, passed) {
  if (!(ctx.detected.isExpo || ctx.detected.hasIos)) return;
  const deps = ctx.detected.deps;
  const cfg = ctx.appConfig.config;
  const hasSiwa =
    M.SIWA_PACKAGES.some((p) => deps.includes(p)) ||
    (cfg && cfg.ios && cfg.ios.usesAppleSignIn === true);

  const confirmed = M.CONFIRMED_SOCIAL_LOGIN.filter((p) => deps.includes(p));
  const broader = M.BROADER_AUTH.filter((p) => deps.includes(p));

  if (confirmed.length && !hasSiwa) {
    add({
      severity: "BLOCKER",
      store: "apple",
      guideline: "Apple 4.8 — Sign in with Apple",
      file: ctx.rel("package.json"),
      title: "Sign in with Apple missing despite third-party login",
      description: `${confirmed.join(", ")} provides third-party login but expo-apple-authentication isn't present. Apple 4.8 requires Sign in with Apple as an equivalent option — guaranteed rejection.`,
      fix: "Install expo-apple-authentication, set ios.usesAppleSignIn: true, and render the Sign in with Apple button with equal prominence.",
      auto_fixable: false,
    });
  } else if (broader.length && !hasSiwa) {
    add({
      severity: "HIGH",
      store: "apple",
      guideline: "Apple 4.8 — Sign in with Apple",
      file: ctx.rel("package.json"),
      title: "Sign in with Apple likely required",
      description: `${broader.join(", ")} hosts user accounts off-device. Apple increasingly treats this as a third-party login service under 4.8 (including phone-OTP-only flows). Add Sign in with Apple to avoid rejection, and supply demo credentials in App Review notes if you use OTP.`,
      fix: "Add expo-apple-authentication + ios.usesAppleSignIn: true, or be ready to justify in App Review notes.",
      auto_fixable: false,
    });
  } else if ((confirmed.length || broader.length) && hasSiwa) {
    passed.push("Sign in with Apple present alongside third-party login");
  }
}

// ── Check 7 — Android target SDK ────────────────────────────────────────────────
const stripGradleComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

function toSdkInt(v) {
  const n = typeof v === "number" ? v : /^\s*\d+\s*$/.test(String(v)) ? parseInt(v, 10) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}

function readGradleTarget(root) {
  for (const name of ["build.gradle", "build.gradle.kts"]) {
    const src = readText(path.join(root, "android", "app", name));
    if (!src) continue;
    const m = stripGradleComments(src).match(/\btargetSdk(?:Version)?\s*(?:=\s*)?\(?\s*(\d+)/);
    if (m) return { value: parseInt(m[1], 10), source: `android/app/${name}` };
  }
  const props = readText(path.join(root, "android", "gradle.properties"));
  if (props) {
    const m = props.match(/^\s*android\.targetSdkVersion\s*=\s*(\d+)\s*$/m);
    if (m) return { value: parseInt(m[1], 10), source: "android/gradle.properties" };
  }
  const rootGradle = readText(path.join(root, "android", "build.gradle"));
  if (rootGradle) {
    const src = stripGradleComments(rootGradle);
    const m =
      src.match(/\btargetSdkVersion\s*=\s*(\d+)/) ||
      src.match(/findProperty\(\s*['"]android\.targetSdkVersion['"]\s*\)\s*\?:\s*['"](\d+)['"]/);
    if (m) return { value: parseInt(m[1], 10), source: "android/build.gradle" };
  }
  return null;
}

function checkTargetSdk(ctx, add, passed) {
  if (!(ctx.detected.isExpo || ctx.detected.hasAndroid)) return;

  // Precedence mirrors what the build actually uses: native gradle files, then
  // expo-build-properties (applied at prebuild), then the SDK's default.
  const gradle = readGradleTarget(ctx.detected.root);

  let pluginTarget = null;
  let pluginInvalid = null;
  const cfg = ctx.appConfig.config;
  if (cfg && Array.isArray(cfg.plugins)) {
    for (const p of cfg.plugins) {
      if (Array.isArray(p) && p[0] === "expo-build-properties" && p[1] && p[1].android && p[1].android.targetSdkVersion != null) {
        const v = p[1].android.targetSdkVersion;
        pluginTarget = toSdkInt(v);
        pluginInvalid = pluginTarget == null ? v : null;
      }
    }
  }

  let inferred = null;
  let inferredFrom = null;
  const expoMajor = ctx.detected.expoSdk ? parseInt(ctx.detected.expoSdk, 10) : NaN;
  if (Number.isInteger(expoMajor)) {
    inferred = M.expoToTargetSdk(expoMajor);
    inferredFrom = "Expo SDK " + ctx.detected.expoSdk;
  } else if (ctx.detected.rnVersion) {
    const [maj, min] = String(ctx.detected.rnVersion).split(".").map((n) => parseInt(n, 10));
    if (maj === 0 && Number.isInteger(min)) {
      inferred = M.rnToTargetSdk(min);
      inferredFrom = "React Native " + ctx.detected.rnVersion;
    }
  }

  if (pluginInvalid != null && !gradle) {
    add({
      severity: "MEDIUM",
      store: "google",
      guideline: "Google Play — Target API level",
      file: appFile(ctx),
      title: `expo-build-properties targetSdkVersion ${JSON.stringify(pluginInvalid)} is not an integer`,
      description: `android.targetSdkVersion must be a plain API level such as ${M.MIN_TARGET_SDK}; this value can break prebuild or be ignored.`,
      fix: `Set android.targetSdkVersion: ${M.MIN_TARGET_SDK} in the expo-build-properties plugin.`,
      auto_fixable: false,
    });
  }

  const effective = gradle ? gradle.value : pluginTarget != null ? pluginTarget : inferred;
  const sourceName = gradle ? gradle.source : pluginTarget != null ? "expo-build-properties" : inferredFrom;
  const fileRef = gradle ? ctx.rel(gradle.source) : appFile(ctx);

  if (effective == null) {
    add({
      severity: "INFO",
      store: "google",
      guideline: "Google Play — Target API level",
      title: "Could not determine Android target SDK",
      description: `Couldn't read targetSdkVersion from the Android gradle files, expo-build-properties, or the Expo / React Native version. Play requires API ${M.MIN_TARGET_SDK}+ for new/updated apps.`,
      auto_fixable: false,
    });
    return;
  }

  if (effective < M.MIN_TARGET_SDK) {
    const determined = !!gradle || pluginTarget != null;
    const minExpo = M.minExpoSdkForTarget(M.MIN_TARGET_SDK);
    add({
      severity: determined ? "BLOCKER" : "HIGH",
      store: "google",
      guideline: "Google Play — Target API level (Aug 2026)",
      file: fileRef,
      title: `Android targetSdk ${effective} is below the required ${M.MIN_TARGET_SDK}`,
      description:
        `Target API ${effective} (from ${sourceName}) is below Google Play's API ${M.MIN_TARGET_SDK} requirement for new apps and updates; the Console rejects the upload. ` +
        "Exceptions: apps granted an extension (to Nov 1, 2026), Wear OS / Automotive (API 35) and TV / XR (API 34).",
      fix: gradle
        ? `Set targetSdkVersion to ${M.MIN_TARGET_SDK} in ${gradle.source}.`
        : ctx.detected.isExpo
          ? `Upgrade to Expo SDK ${minExpo}+ (targets API ${M.MIN_TARGET_SDK}) or set targetSdkVersion: ${M.MIN_TARGET_SDK} via expo-build-properties.`
          : `Upgrade React Native or set targetSdkVersion ${M.MIN_TARGET_SDK} in android/app/build.gradle.`,
      auto_fixable: false,
    });
  } else {
    passed.push(`Android target SDK ${effective} meets the Play requirement (from ${sourceName})`);
  }
}

// ── Check 13 — App Transport Security arbitrary loads ───────────────────────────
function checkAppTransportSecurity(ctx, cfg, add) {
  const ats =
    cfg && cfg.ios && cfg.ios.infoPlist && cfg.ios.infoPlist.NSAppTransportSecurity;
  const arbitrary =
    (ats && ats.NSAllowsArbitraryLoads === true) ||
    (ctx.infoPlistRaw && /<key>NSAllowsArbitraryLoads<\/key>\s*<true\/>/.test(ctx.infoPlistRaw));
  if (arbitrary) {
    add({
      severity: "HIGH",
      store: "apple",
      guideline: "Apple — App Transport Security",
      file: cfg && ats ? appFile(ctx) : ctx.rel(ctx.infoPlistPath || "Info.plist"),
      line: lineFor(ctx, "NSAppTransportSecurity"),
      title: "NSAllowsArbitraryLoads enabled (ATS disabled)",
      description: "NSAllowsArbitraryLoads=true disables App Transport Security globally. Apple requires written justification in App Review notes; unexplained use is frequently rejected.",
      fix: "Remove NSAllowsArbitraryLoads and scope any HTTP exceptions to specific domains via NSExceptionDomains, or justify it in App Review notes.",
      auto_fixable: false,
    });
  }
}

// ── Check 15 — Apple 3.2 business / internal app on public distribution ─────────
function checkBusinessApp(ctx, cfg, add) {
  if (!cfg || ctx.appConfig.dynamic) return;
  const signals = [];
  const bundle = (cfg.ios || {}).bundleIdentifier || (cfg.android || {}).package || "";
  const name = cfg.name || "";
  if (M.BUSINESS_BUNDLE_RE.test(bundle)) signals.push(`bundle id "${bundle}"`);
  if (M.BUSINESS_NAME_RE.test(name)) signals.push(`app name "${name}"`);
  const desc = (cfg.description || "") + " " + JSON.stringify(cfg.extra || {});
  if (/\b(for our (partners|merchants|staff|employees)|internal use only|client portal|dealer app)\b/i.test(desc))
    signals.push("description language");

  if (signals.length === 0) return;
  add({
    severity: signals.length >= 2 ? "BLOCKER" : "HIGH",
    store: "apple",
    guideline: "Apple 3.2 — Business app distribution",
    file: appFile(ctx),
    title: "App looks like a business/internal app on public distribution",
    description: `Signals (${signals.join(", ")}) suggest a B2B/internal app. Apple 3.2 rejects such apps when submitted to the public App Store.`,
    fix: "Use Custom App or Unlisted App Distribution via Apple Business Manager, or update metadata + add public onboarding if it's genuinely public-facing.",
    auto_fixable: false,
  });
}

function readEas(ctx) {
  const raw = readText(path.join(ctx.detected.root, "eas.json"));
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

module.exports = { run, CATEGORY };
