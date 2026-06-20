"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { scan } = require("../src/scan");

let tmpRoot;
test.before(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rr-meta-"));
});
test.after(() => {
  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch {}
});

function makeProject(name, files) {
  const dir = path.join(tmpRoot, name);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, typeof content === "string" ? content : JSON.stringify(content, null, 2));
  }
  return dir;
}
const meta = (dir) => scan(dir, { category: "metadata" });
const has = (r, sev, sub) => r.issues.some((i) => i.severity === sev && i.title.includes(sub));

test("placeholder bundle id (com.anonymous.*) → HIGH", () => {
  const dir = makeProject("placeholder-bundle", {
    "package.json": { name: "x", dependencies: { expo: "54.0.0" } },
    "app.json": {
      expo: {
        name: "X",
        version: "1.0.0",
        ios: { bundleIdentifier: "com.scifistation.x", config: { usesNonExemptEncryption: false } },
        android: { package: "com.anonymous.x" },
      },
    },
  });
  const r = meta(dir);
  assert.ok(has(r, "HIGH", "Placeholder android.package"), JSON.stringify(r.issues, null, 2));
});

test("missing encryption flag → HIGH auto-fixable", () => {
  const dir = makeProject("no-encryption", {
    "package.json": { name: "x", dependencies: { expo: "54.0.0" } },
    "app.json": { expo: { name: "X", version: "1.0.0", ios: { bundleIdentifier: "com.acme.x" }, android: { package: "com.acme.x" } } },
  });
  const r = meta(dir);
  const enc = r.issues.find((i) => i.title.includes("Encryption export"));
  assert.ok(enc, "expected encryption issue");
  assert.strictEqual(enc.severity, "HIGH");
  assert.strictEqual(enc.auto_fixable, true);
});

test("Google sign-in without SiwA → BLOCKER; with SiwA → passed", () => {
  const base = {
    "package.json": { name: "x", dependencies: { expo: "54.0.0", "@react-native-google-signin/google-signin": "13.0.0" } },
    "app.json": { expo: { name: "X", version: "1.0.0", ios: { bundleIdentifier: "com.acme.x", config: { usesNonExemptEncryption: false } }, android: { package: "com.acme.x" } } },
  };
  const bad = meta(makeProject("siwa-missing", base));
  assert.ok(has(bad, "BLOCKER", "Sign in with Apple missing"), JSON.stringify(bad.issues, null, 2));

  const goodFiles = JSON.parse(JSON.stringify(base));
  goodFiles["package.json"].dependencies["expo-apple-authentication"] = "7.0.0";
  const good = meta(makeProject("siwa-present", goodFiles));
  assert.ok(!has(good, "BLOCKER", "Sign in with Apple"), "should not blocker when SiwA present");
  assert.ok(good.passed.some((p) => /Sign in with Apple/.test(p)));
});

test("Firebase phone auth without SiwA → HIGH (broader rule)", () => {
  const dir = makeProject("firebase-auth", {
    "package.json": { name: "x", dependencies: { expo: "54.0.0", "@react-native-firebase/auth": "21.0.0" } },
    "app.json": { expo: { name: "X", version: "1.0.0", ios: { bundleIdentifier: "com.acme.x", config: { usesNonExemptEncryption: false } }, android: { package: "com.acme.x" } } },
  });
  const r = meta(dir);
  assert.ok(has(r, "HIGH", "Sign in with Apple likely required"), JSON.stringify(r.issues, null, 2));
});

test("targetSdk below 35 in build.gradle → BLOCKER", () => {
  const dir = makeProject("low-target", {
    "package.json": { name: "x", dependencies: { "react-native": "0.79.0" } },
    "android/app/build.gradle": "android {\n  defaultConfig {\n    targetSdkVersion 33\n  }\n}",
  });
  const r = meta(dir);
  assert.ok(has(r, "BLOCKER", "below the required 35"), JSON.stringify(r.issues, null, 2));
});

test("Expo 54 infers target SDK 35 → passes", () => {
  const dir = makeProject("expo54-target", {
    "package.json": { name: "x", dependencies: { expo: "54.0.33" } },
    "app.json": { expo: { name: "X", version: "1.0.0", ios: { bundleIdentifier: "com.acme.x", config: { usesNonExemptEncryption: false } }, android: { package: "com.acme.x" } } },
  });
  const r = meta(dir);
  assert.ok(!has(r, "BLOCKER", "target"), "Expo 54 should not flag target SDK");
  assert.ok(r.passed.some((p) => /target SDK 35/.test(p)));
});

test("long app name → HIGH; business bundle id → 3.2", () => {
  const dir = makeProject("name-business", {
    "package.json": { name: "x", dependencies: { expo: "54.0.0" } },
    "app.json": {
      expo: {
        name: "Acme Dealer Admin Portal for our partners and staff members",
        version: "1.0.0",
        ios: { bundleIdentifier: "com.acme.dealer.admin", config: { usesNonExemptEncryption: false } },
        android: { package: "com.acme.dealer.admin" },
      },
    },
  });
  const r = meta(dir);
  assert.ok(has(r, "HIGH", "App name is"), "expected name-length HIGH");
  assert.ok(
    r.issues.some((i) => i.guideline.includes("3.2")),
    "expected Apple 3.2 business-app flag: " + JSON.stringify(r.issues.map((i) => i.title))
  );
});

test("integer-typed buildNumber → MEDIUM; non-integer versionCode → BLOCKER", () => {
  const dir = makeProject("bad-versions", {
    "package.json": { name: "x", dependencies: { expo: "54.0.0" } },
    "app.json": {
      expo: {
        name: "X",
        version: "1.0.0",
        ios: { bundleIdentifier: "com.acme.x", buildNumber: 3, config: { usesNonExemptEncryption: false } },
        android: { package: "com.acme.x", versionCode: "5" },
      },
    },
  });
  const r = meta(dir);
  assert.ok(has(r, "MEDIUM", "buildNumber should be a string"));
  assert.ok(has(r, "BLOCKER", "versionCode must be an integer"));
});

test("clean Expo app → no metadata blockers, has passed checks", () => {
  const dir = makeProject("clean", {
    "package.json": { name: "x", dependencies: { expo: "54.0.0" } },
    "app.json": {
      expo: {
        name: "Clean App",
        version: "1.0.0",
        ios: { bundleIdentifier: "com.acme.clean", config: { usesNonExemptEncryption: false } },
        android: { package: "com.acme.clean" },
      },
    },
    "eas.json": { cli: { appVersionSource: "remote" } },
  });
  const r = meta(dir);
  assert.strictEqual(r.counts.BLOCKER, 0, JSON.stringify(r.issues, null, 2));
  assert.ok(r.passed.length >= 3);
});
