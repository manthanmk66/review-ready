"use strict";

/**
 * Stack detection — mirrors Step 0 of the scan skill.
 *
 * Returns a structured description of the project so rules know which files
 * to read and which checks apply.
 */

const fs = require("fs");
const path = require("path");

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

/** Find the iOS Info.plist inside ios/<project>/ for bare/native projects. */
function findInfoPlist(root) {
  const iosDir = path.join(root, "ios");
  if (!exists(iosDir)) return null;
  let dirs;
  try {
    dirs = fs.readdirSync(iosDir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const candidate = path.join(iosDir, d.name, "Info.plist");
    if (exists(candidate)) return candidate;
  }
  return null;
}

function findAndroidManifest(root) {
  const candidate = path.join(root, "android", "app", "src", "main", "AndroidManifest.xml");
  return exists(candidate) ? candidate : null;
}

function findAppConfig(root) {
  for (const name of ["app.json", "app.config.json"]) {
    const p = path.join(root, name);
    if (exists(p)) return p;
  }
  // app.config.js / .ts are JS — we can't statically read them safely; note them.
  for (const name of ["app.config.js", "app.config.ts"]) {
    const p = path.join(root, name);
    if (exists(p)) return p;
  }
  return null;
}

/**
 * @returns {{
 *   root: string,
 *   stack: string,            // human label
 *   kind: "expo"|"bare-rn"|"native-ios"|"native-android"|"flutter"|"unknown",
 *   isExpo: boolean,
 *   hasIos: boolean,
 *   hasAndroid: boolean,
 *   appConfigPath: string|null,
 *   appConfigDynamic: boolean,
 *   androidManifestPath: string|null,
 *   infoPlistPath: string|null,
 *   packageJson: object|null,
 *   deps: string[],           // all dependency names (deps + devDeps)
 *   expoSdk: string|null,
 *   rnVersion: string|null
 * }}
 */
function detect(root) {
  const pkgPath = path.join(root, "package.json");
  const pkg = readJson(pkgPath);
  const deps = pkg
    ? Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) })
    : [];

  const hasFlutter = exists(path.join(root, "pubspec.yaml"));
  const hasJs = !!pkg;
  const appConfigPath = findAppConfig(root);
  const appConfigDynamic = !!appConfigPath && /\.(js|ts)$/.test(appConfigPath);
  const isExpo = deps.includes("expo") || (!!appConfigPath && !appConfigDynamic && hasExpoKey(appConfigPath));
  const hasIos = exists(path.join(root, "ios"));
  const hasAndroid = exists(path.join(root, "android"));

  let kind = "unknown";
  let stack = "Unknown stack";
  if (hasFlutter) {
    kind = "flutter";
    stack = "Flutter (not yet supported)";
  } else if (isExpo) {
    kind = "expo";
    stack = "Expo / React Native";
  } else if (hasJs && (hasIos || hasAndroid || deps.includes("react-native"))) {
    kind = "bare-rn";
    stack = "React Native (bare)";
  } else if (hasIos && !hasJs) {
    kind = "native-ios";
    stack = "Native iOS";
  } else if (hasAndroid && !hasJs) {
    kind = "native-android";
    stack = "Native Android";
  }

  const expoSdk = pickVersion(pkg, "expo");
  const rnVersion = pickVersion(pkg, "react-native");
  if (kind === "expo" && (expoSdk || rnVersion)) {
    const bits = [];
    if (expoSdk) bits.push("Expo " + expoSdk);
    if (rnVersion) bits.push("RN " + rnVersion);
    stack = bits.join(" / ");
  }

  return {
    root,
    stack,
    kind,
    isExpo,
    hasIos,
    hasAndroid,
    appConfigPath,
    appConfigDynamic,
    androidManifestPath: findAndroidManifest(root),
    infoPlistPath: findInfoPlist(root),
    packageJson: pkg,
    deps,
    expoSdk,
    rnVersion,
    projectName: (pkg && pkg.name) || path.basename(root),
  };
}

function hasExpoKey(appConfigPath) {
  const json = readJson(appConfigPath);
  return !!(json && (json.expo || json.name));
}

function pickVersion(pkg, name) {
  if (!pkg) return null;
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const v = all[name];
  if (!v) return null;
  const m = String(v).match(/\d+(\.\d+)?(\.\d+)?/);
  return m ? m[0] : String(v);
}

module.exports = { detect, exists, readJson };
