"use strict";

/**
 * permissions — deterministic port of agents/permissions-auditor.md.
 *
 * Covers the mechanically-detectable subset: iOS usage strings, the Android
 * §8.4 photo/video BLOCKER, restricted permissions needing a Play declaration,
 * over-declared storage permissions, and foreground services missing a type.
 *
 * Judgment-based checks (prominent disclosure copy, scope minimisation, content
 * rules) stay in the LLM plugin — this engine never guesses intent it can't see.
 */

const {
  MODULE_IOS_STRINGS,
  IOS_STRING_LABEL,
  MODULE_ANDROID_PERMISSIONS,
  RESTRICTED_ANDROID,
  MEDIA_PERMISSIONS,
  PICKER_USAGE_RE,
  GALLERY_ENUMERATION_RE,
  SPECIFIC_PURPOSE_RE,
} = require("../data/permission-maps");

const CATEGORY = "permissions";

function run(ctx) {
  const issues = [];
  const passed = [];
  const add = (i) => issues.push({ category: CATEGORY, ...i });

  checkIosUsageStrings(ctx, add, passed);
  checkAndroidMedia(ctx, add, passed);
  checkRestrictedAndroid(ctx, add, passed);
  checkOverDeclaredStorage(ctx, add);
  checkForegroundServices(ctx, add);

  return { issues, passed };
}

// ── iOS usage strings (Apple 5.1.1) ────────────────────────────────────────────
function getIosString(ctx, key) {
  const cfg = ctx.appConfig.config;
  if (cfg && cfg.ios && cfg.ios.infoPlist && key in cfg.ios.infoPlist) {
    return String(cfg.ios.infoPlist[key]);
  }
  if (ctx.infoPlistRaw) {
    const re = new RegExp("<key>" + key + "</key>\\s*<string>([^<]*)</string>");
    const m = ctx.infoPlistRaw.match(re);
    if (m) return m[1];
  }
  return undefined;
}

function isGeneric(val) {
  const v = (val || "").trim();
  if (v.length < 40) return true;
  return v.length < 70 && !SPECIFIC_PURPOSE_RE.test(v);
}

function checkIosUsageStrings(ctx, add, passed) {
  if (!ctx.detected.hasIos && ctx.detected.kind !== "expo") return;
  if (ctx.appConfig.dynamic) {
    add({
      severity: "INFO",
      store: "apple",
      guideline: "Apple 5.1.1",
      file: ctx.rel(ctx.appConfig.path),
      title: "Dynamic app.config — iOS usage strings not statically checked",
      description:
        "app.config.js/ts can't be evaluated safely by the scanner, so iOS permission strings weren't verified. Run the plugin deep-scan or check ios.infoPlist manually.",
      auto_fixable: false,
    });
    return;
  }

  const needed = new Map(); // key -> Set(modules)
  for (const mod of ctx.detected.deps) {
    const keys = MODULE_IOS_STRINGS[mod];
    if (!keys) continue;
    for (const k of keys) {
      if (!needed.has(k)) needed.set(k, new Set());
      needed.get(k).add(mod);
    }
  }

  const iosFile = ctx.appConfig.config
    ? ctx.rel(ctx.appConfig.path)
    : ctx.infoPlistPath
    ? ctx.rel(ctx.infoPlistPath)
    : ctx.rel(ctx.appConfig.path || "app.json");
  const iosLine = ctx.appConfig.raw
    ? ctx.lineOfKey(ctx.appConfig.raw, "infoPlist") || ctx.lineOfKey(ctx.appConfig.raw, "ios")
    : null;

  for (const [key, mods] of needed) {
    const label = IOS_STRING_LABEL[key] || key;
    const modList = [...mods].join(", ");
    const val = getIosString(ctx, key);
    if (val === undefined) {
      add({
        severity: "BLOCKER",
        store: "apple",
        guideline: "Apple 5.1.1 — Data Collection and Storage",
        file: iosFile,
        line: iosLine || undefined,
        title: `Missing ${label} usage string (${key})`,
        description: `${modList} is installed but no ${key} is set. Apple rejects 100% of apps that access ${label} without a usage string.`,
        fix: `Add to ios.infoPlist in app.json: "${key}": "<explain when and why you use ${label}, e.g. so you can add a profile photo>".`,
        auto_fixable: true,
      });
    } else if (isGeneric(val)) {
      add({
        severity: "HIGH",
        store: "apple",
        guideline: "Apple 5.1.1(ii) — Purpose Strings",
        file: iosFile,
        line: iosLine || undefined,
        title: `Generic ${label} usage string`,
        description: `${key} is "${val}". Reviewers reject vague strings — it must name the concrete feature and when it runs (e.g. "when you", "so you can", "for example").`,
        fix: `Rewrite ${key} to state the specific purpose, e.g. "Used so you can attach a photo to your biodata."`,
        auto_fixable: false,
      });
    } else {
      passed.push(`iOS ${label} usage string present and specific`);
    }
  }
}

// ── Android permission resolution ──────────────────────────────────────────────
/**
 * Returns { perms: Map<name,{sources:string[],modules:string[],line:number|null,flags:string|null}>, blocked:Set }
 * "name" is the short permission name (READ_MEDIA_IMAGES, not the FQN).
 */
function resolveAndroidPermissions(ctx) {
  const perms = new Map();
  const blocked = new Set();
  const cfg = ctx.appConfig.config;

  const ensure = (name) => {
    if (!perms.has(name)) perms.set(name, { sources: [], modules: [], line: null, flags: null });
    return perms.get(name);
  };
  const shortName = (n) => String(n).replace(/^android\.permission\./, "").replace(/^.*\.permission\./, "");

  // Native / bare: the merged manifest is the source of truth.
  if (ctx.manifest) {
    for (const p of ctx.manifest.permissions) {
      const e = ensure(p.name);
      e.sources.push("manifest");
      e.line = p.line;
      if (p.flags) e.flags = p.flags;
    }
  }

  // Expo managed.
  if (cfg && cfg.android) {
    for (const b of cfg.android.blockedPermissions || []) blocked.add(shortName(b));
    for (const p of cfg.android.permissions || []) {
      const e = ensure(shortName(p));
      e.sources.push("app.json");
      e.line = ctx.lineOfKey(ctx.appConfig.raw, "permissions");
    }
  }
  // Auto-injected by Expo modules.
  if (ctx.detected.isExpo) {
    for (const mod of ctx.detected.deps) {
      const list = MODULE_ANDROID_PERMISSIONS[mod];
      if (!list) continue;
      for (const name of list) {
        const e = ensure(name);
        if (!e.sources.includes("expo-auto")) e.sources.push("expo-auto");
        e.modules.push(mod);
      }
    }
  }

  // Drop blocked permissions — they won't reach the released manifest.
  for (const name of blocked) perms.delete(name);
  return { perms, blocked };
}

// ── Android §8.4 — photo/video permissions (the flagship BLOCKER) ──────────────
function checkAndroidMedia(ctx, add, passed) {
  if (!ctx.detected.hasAndroid && !ctx.detected.isExpo) return;
  const { perms } = resolveAndroidPermissions(ctx);
  const declaredMedia = MEDIA_PERMISSIONS.filter((p) => perms.has(p));
  if (declaredMedia.length === 0) {
    passed.push("No broad photo/video permission declared (Android §8.4)");
    return;
  }

  const src = ctx.source.text;
  const usesPicker = PICKER_USAGE_RE.test(src);
  const enumeratesLibrary = GALLERY_ENUMERATION_RE.test(src);
  const entry = perms.get(declaredMedia[0]);
  const viaExpo = entry.sources.includes("expo-auto");
  const mods = [...new Set(entry.modules)].join(", ");
  const file = viaExpo
    ? ctx.rel(ctx.appConfig.path || "app.json")
    : ctx.manifestPath
    ? ctx.rel(ctx.manifestPath)
    : ctx.rel(ctx.appConfig.path || "app.json");
  const line = viaExpo
    ? ctx.lineOfKey(ctx.appConfig.raw, "android")
    : entry.line;

  const removalFix = viaExpo
    ? `Add ${declaredMedia.join(", ")} to "android.blockedPermissions" in app.json so prebuild can't re-inject them${mods ? ` (auto-added by ${mods})` : ""}. Keep using the system Photo Picker; for gallery save use requestPermissionsAsync(true) (write-only).`
    : `Remove ${declaredMedia.join(", ")} from AndroidManifest.xml (mark tools:node="remove"). Use the system Photo Picker (PickVisualMedia) which needs no permission.`;

  if (enumeratesLibrary && !usesPicker) {
    add({
      severity: "HIGH",
      store: "google",
      guideline: "Google Play §8.4 — Photo & Video Permissions",
      file,
      line: line || undefined,
      title: "Broad media permission requires Photo & Video Permissions Declaration",
      description: `${declaredMedia.join(", ")} is declared and the app appears to enumerate the media library. This is allowed only if core functionality needs broad access — and you must file the Photo & Video Permissions Declaration in Play Console or the release is rejected.`,
      fix: "File the Photo & Video Permissions Declaration in Play Console, or switch to the Photo Picker and remove the permission.",
      auto_fixable: false,
    });
  } else {
    // One-off picker usage (or no library-enumeration evidence) → hard block.
    add({
      severity: "BLOCKER",
      store: "google",
      guideline: "Google Play §8.4 — Photo & Video Permissions",
      file,
      line: line || undefined,
      title: "Photo/video permission declared for one-off access (Play pre-review block)",
      description: `${declaredMedia.join(", ")} is declared${viaExpo ? ` (auto-injected by ${mods})` : ""} but the app only does one-off photo access${usesPicker ? " via the image picker" : ""}. Google's automated pre-review STOPS the release from being sent for review with "Invalid use of the photo and video permissions." The Photo Picker needs no permission.`,
      fix: removalFix,
      auto_fixable: true,
    });
  }
}

// ── Restricted Android permissions needing a Play declaration ───────────────────
function checkRestrictedAndroid(ctx, add, passed) {
  if (!ctx.detected.hasAndroid && !ctx.detected.isExpo) return;
  const { perms } = resolveAndroidPermissions(ctx);
  let found = 0;
  for (const [name, info] of perms) {
    const decl = RESTRICTED_ANDROID[name];
    if (!decl) continue;
    found++;
    const viaExpo = info.sources.includes("expo-auto");
    add({
      severity: "HIGH",
      store: "google",
      guideline: "Google Play — Restricted Permissions",
      file: viaExpo || !ctx.manifestPath ? ctx.rel(ctx.appConfig.path || "app.json") : ctx.rel(ctx.manifestPath),
      line: info.line || undefined,
      title: `Restricted permission ${name} requires a Play Console declaration`,
      description: `${name} is declared${info.modules.length ? ` (via ${[...new Set(info.modules)].join(", ")})` : ""}. Play Console blocks the release until you submit the "${decl}".`,
      fix: `If the feature is core, submit the ${decl} in Play Console. Otherwise remove ${name}.`,
      auto_fixable: false,
    });
  }
  if (found === 0) passed.push("No restricted Android permissions declared");
}

// ── Over-declared storage permissions ──────────────────────────────────────────
function checkOverDeclaredStorage(ctx, add) {
  if (!ctx.detected.hasAndroid && !ctx.detected.isExpo) return;
  const { perms } = resolveAndroidPermissions(ctx);
  const legacy = ["READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"];
  for (const name of legacy) {
    if (!perms.has(name)) continue;
    const info = perms.get(name);
    const viaExpo = info.sources.includes("expo-auto");
    add({
      severity: "MEDIUM",
      store: "google",
      guideline: "Google Play — Permissions best practice",
      file: viaExpo || !ctx.manifestPath ? ctx.rel(ctx.appConfig.path || "app.json") : ctx.rel(ctx.manifestPath),
      line: info.line || undefined,
      title: `Legacy storage permission ${name} likely over-declared`,
      description: `${name} is deprecated on modern target SDKs (READ_* removed in favour of READ_MEDIA_* on SDK 33+, WRITE_* unused on SDK 30+) and can cause a Data Safety mismatch.`,
      fix: `Remove ${name} unless you support Android ≤12 with a real need. In Expo add it to android.blockedPermissions.`,
      auto_fixable: false,
    });
  }
}

// ── Foreground services without a declared type (Android 14+) ───────────────────
function checkForegroundServices(ctx, add) {
  if (!ctx.manifest) return;

  // A service whose tag itself signals foreground use but omits the type.
  for (const svc of ctx.manifest.services) {
    if (svc.isForeground && !svc.foregroundServiceType) {
      add(fgsIssue(ctx, svc.line, `Foreground service ${svc.name} has no foregroundServiceType`,
        `${svc.name} appears to run in the foreground but declares no android:foregroundServiceType. Since Android 14, services without an explicit type are rejected.`));
    }
  }

  // App declares FOREGROUND_SERVICE but no service in the manifest declares a
  // type — the typed service must exist on Android 14+.
  const fgsPerm = ctx.manifest.permissions.find((p) => p.name === "FOREGROUND_SERVICE");
  const anyTyped = ctx.manifest.services.some((s) => s.foregroundServiceType);
  const anyAlreadyFlagged = ctx.manifest.services.some((s) => s.isForeground && !s.foregroundServiceType);
  if (fgsPerm && !anyTyped && !anyAlreadyFlagged) {
    add(fgsIssue(ctx, fgsPerm.line, "Foreground service used but no foregroundServiceType declared",
      "The app declares the FOREGROUND_SERVICE permission but no <service> declares android:foregroundServiceType. Android 14+ requires every foreground service to declare a type, and the Play Store rejects builds that don't."));
  }
}

function fgsIssue(ctx, line, title, description) {
  return {
    severity: "BLOCKER",
    store: "google",
    guideline: "Google Play — Foreground Service Types",
    file: ctx.rel(ctx.manifestPath),
    line: line || undefined,
    title,
    description,
    fix: `Add android:foregroundServiceType="<type>" to the foreground <service> and the matching FOREGROUND_SERVICE_<TYPE> permission, then declare the FGS type in Play Console.`,
    auto_fixable: true,
  };
}

module.exports = { run, CATEGORY, resolveAndroidPermissions, isGeneric };
