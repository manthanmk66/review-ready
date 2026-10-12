"use strict";

/**
 * Lightweight, zero-dependency parsers for the config files the rules read.
 *
 * These are intentionally NOT full XML/plist/JSON parsers — they extract the
 * specific facts the compliance rules need, along with line numbers so the
 * report can point at `file:line` like the LLM auditors do.
 */

const fs = require("fs");
const path = require("path");

function readText(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

/** Find the 1-based line number where a top-ish-level JSON key first appears. */
function lineOfKey(raw, key) {
  if (!raw) return null;
  const lines = raw.split(/\r?\n/);
  const needle = '"' + key + '"';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(needle)) return i + 1;
  }
  return null;
}

/** Find the line of a literal substring (first match). */
function lineOf(raw, substr) {
  if (!raw) return null;
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(substr)) return i + 1;
  }
  return null;
}

/**
 * Read the Expo app config. Returns { config, raw, dynamic, path }.
 * Unwraps the `expo` key. For app.config.js/ts we can't safely eval, so
 * config is null and dynamic is true (rules degrade gracefully).
 */
function readAppConfig(detected) {
  const p = detected.appConfigPath;
  if (!p) return { config: null, raw: null, dynamic: false, path: null };
  if (detected.appConfigDynamic) {
    return { config: null, raw: readText(p), dynamic: true, path: p };
  }
  const raw = readText(p);
  let json = null;
  try {
    json = JSON.parse(raw);
  } catch {
    json = null;
  }
  const config = json && json.expo ? json.expo : json;
  return { config, raw, dynamic: false, path: p };
}

const ANDROID_PERM_RE = /<uses-permission(?:-sdk-23)?\b[^>]*android:name\s*=\s*"([^"]+)"[^>]*\/?>/;

/**
 * Parse an AndroidManifest.xml string.
 * @returns {{
 *   permissions: {name:string, line:number, flags:string|null}[],
 *   services: {name:string, line:number, foregroundServiceType:string|null}[]
 * }}
 */
function parseAndroidManifest(raw) {
  const out = { permissions: [], services: [] };
  if (!raw) return out;
  const lines = raw.split(/\r?\n/);

  // Permissions can wrap across lines; scan line-by-line but also handle the
  // common single-line form which is what Expo prebuild and most apps emit.
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(ANDROID_PERM_RE);
    if (m) {
      const full = m[0];
      const flagsM = full.match(/android:usesPermissionFlags\s*=\s*"([^"]+)"/);
      out.permissions.push({
        name: stripAndroidPrefix(m[1]),
        line: i + 1,
        flags: flagsM ? flagsM[1] : null,
      });
    }
  }

  // Services — capture <service ...> opening tags (may span lines).
  const serviceRe = /<service\b([\s\S]*?)(?:\/>|>)/g;
  let sm;
  while ((sm = serviceRe.exec(raw)) !== null) {
    const block = sm[0];
    const nameM = block.match(/android:name\s*=\s*"([^"]+)"/);
    const fgsM = block.match(/android:foregroundServiceType\s*=\s*"([^"]+)"/);
    const line = raw.slice(0, sm.index).split(/\r?\n/).length;
    out.services.push({
      name: nameM ? nameM[1] : "(unnamed service)",
      line,
      foregroundServiceType: fgsM ? fgsM[1] : null,
      isForeground: /FOREGROUND_SERVICE|foregroundServiceType/.test(block) ||
        /:foregroundServiceType/.test(block),
    });
  }

  return out;
}

function stripAndroidPrefix(name) {
  return name.replace(/^android\.permission\./, "").replace(/^com\.google\.android\.gms\.permission\./, "");
}

/**
 * Extract the keys present in an Info.plist (string/dict top-level keys) and
 * the UIBackgroundModes array entries. Regex-based — good enough for the
 * "is this key present?" question the rules ask.
 */
function parseInfoPlist(raw) {
  const out = { keys: new Set(), backgroundModes: [] };
  if (!raw) return out;
  const keyRe = /<key>([^<]+)<\/key>/g;
  let m;
  while ((m = keyRe.exec(raw)) !== null) out.keys.add(m[1].trim());

  const bgBlock = raw.match(/<key>UIBackgroundModes<\/key>\s*<array>([\s\S]*?)<\/array>/);
  if (bgBlock) {
    const strRe = /<string>([^<]+)<\/string>/g;
    let s;
    while ((s = strRe.exec(bgBlock[1])) !== null) out.backgroundModes.push(s[1].trim());
  }
  return out;
}

const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".kt", ".java", ".swift", ".m"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "ios", "android", "build", "dist", ".expo", "Pods", ".next"]);

/**
 * Read project source into one big string for pattern heuristics (e.g. does
 * the app actually call the photo picker?). Capped to keep `npx` fast.
 */
function readSource(root, { maxFiles = 1500, maxBytes = 6 * 1024 * 1024 } = {}) {
  let buf = "";
  let files = 0;
  const stack = [root];
  while (stack.length && files < maxFiles && buf.length < maxBytes) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") && e.name !== ".") {
        if (SKIP_DIRS.has(e.name)) continue;
      }
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        stack.push(path.join(dir, e.name));
      } else if (SOURCE_EXT.has(path.extname(e.name))) {
        const t = readText(path.join(dir, e.name));
        if (t) {
          buf += "\n" + t;
          files++;
        }
      }
      if (files >= maxFiles || buf.length >= maxBytes) break;
    }
  }
  return { text: buf, files };
}

module.exports = {
  readText,
  lineOfKey,
  lineOf,
  readAppConfig,
  parseAndroidManifest,
  parseInfoPlist,
  readSource,
  stripAndroidPrefix,
};
