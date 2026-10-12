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

test("targetSdk below 36 in build.gradle → BLOCKER", () => {
  const dir = makeProject("low-target", {
    "package.json": { name: "x", dependencies: { "react-native": "0.79.0" } },
    "android/app/build.gradle": "android {\n  defaultConfig {\n    targetSdkVersion 33\n  }\n}",
  });
  const r = meta(dir);
  assert.ok(has(r, "BLOCKER", "below the required 36"), JSON.stringify(r.issues, null, 2));
});

test("Expo 54 infers target SDK 36 → passes", () => {
  const dir = makeProject("expo54-target", {
    "package.json": { name: "x", dependencies: { expo: "54.0.33" } },
    "app.json": { expo: { name: "X", version: "1.0.0", ios: { bundleIdentifier: "com.acme.x", config: { usesNonExemptEncryption: false } }, android: { package: "com.acme.x" } } },
  });
  const r = meta(dir);
  assert.ok(!has(r, "BLOCKER", "target"), "Expo 54 should not flag target SDK");
  assert.ok(r.passed.some((p) => /target SDK 36/.test(p)));
});

test("Expo 53 infers target SDK 35 → HIGH (below 36, inferred)", () => {
  const dir = makeProject("expo53-target", {
    "package.json": { name: "x", dependencies: { expo: "53.0.0" } },
    "app.json": { expo: { name: "X", version: "1.0.0", ios: { bundleIdentifier: "com.acme.x", config: { usesNonExemptEncryption: false } }, android: { package: "com.acme.x" } } },
  });
  const r = meta(dir);
  assert.ok(has(r, "HIGH", "targetSdk 35 is below the required 36"), JSON.stringify(r.issues, null, 2));
});

const expoApp = (extra = {}) => ({ expo: { name: "X", version: "1.0.0", ios: { bundleIdentifier: "com.acme.x", config: { usesNonExemptEncryption: false } }, android: { package: "com.acme.x" }, ...extra } });
const targetTitle = (r) => (r.issues.find((i) => /targetSdk/.test(i.title)) || {}).title || "";

for (const [expo, target] of [["~52.0.11", 34], ["51.0.0", 34], ["50.0.0", 34]]) {
  test(`Expo ${expo} infers target SDK ${target}`, () => {
    const dir = makeProject(`expo-${expo}-target`, { "package.json": { name: "x", dependencies: { expo } }, "app.json": expoApp() });
    assert.equal(targetTitle(meta(dir)), `Android targetSdk ${target} is below the required 36`);
  });
}

test("non-numeric Expo range → INFO, not a crash or a guess", () => {
  const dir = makeProject("expo-latest", { "package.json": { name: "x", dependencies: { expo: "latest" } }, "app.json": expoApp() });
  const r = meta(dir);
  assert.equal(targetTitle(r), "");
  assert.ok(has(r, "INFO", "Could not determine Android target SDK"), JSON.stringify(r.issues, null, 2));
});

test("android/gradle.properties targetSdkVersion=36 overrides Expo 53 inference", () => {
  const dir = makeProject("expo53-gradleprops", {
    "package.json": { name: "x", dependencies: { expo: "53.0.0" } },
    "app.json": expoApp(),
    "android/app/build.gradle": "android {\n  defaultConfig {\n    targetSdkVersion rootProject.ext.targetSdkVersion\n  }\n}",
    "android/gradle.properties": "org.gradle.jvmargs=-Xmx2048m\nandroid.targetSdkVersion=36\n",
  });
  const r = meta(dir);
  assert.equal(targetTitle(r), "", JSON.stringify(r.issues, null, 2));
  assert.ok(r.passed.some((p) => /target SDK 36 .*gradle\.properties/.test(p)));
});

test("commented-out targetSdkVersion in build.gradle is ignored", () => {
  const dir = makeProject("gradle-comment", {
    "package.json": { name: "x", dependencies: { "react-native": "0.81.0" } },
    "android/app/build.gradle": "android {\n  defaultConfig {\n    // targetSdkVersion 33\n    /* targetSdkVersion 30 */\n    targetSdkVersion 36\n  }\n}",
  });
  const r = meta(dir);
  assert.equal(targetTitle(r), "", JSON.stringify(r.issues, null, 2));
});

test("bare RN 0.79 with rootProject.ext gradle → HIGH inferred 35", () => {
  const dir = makeProject("bare-rn79", {
    "package.json": { name: "x", dependencies: { "react-native": "0.79.2" } },
    "android/app/build.gradle": "android {\n  defaultConfig {\n    targetSdkVersion rootProject.ext.targetSdkVersion\n  }\n}",
  });
  const r = meta(dir);
  assert.ok(has(r, "HIGH", "targetSdk 35 is below the required 36"), JSON.stringify(r.issues, null, 2));
});

test("non-integer expo-build-properties targetSdkVersion is not trusted", () => {
  const dir = makeProject("plugin-latest", {
    "package.json": { name: "x", dependencies: { expo: "53.0.0" } },
    "app.json": expoApp({ plugins: [["expo-build-properties", { android: { targetSdkVersion: "latest" } }]] }),
  });
  const r = meta(dir);
  assert.ok(has(r, "MEDIUM", "is not an integer"), JSON.stringify(r.issues, null, 2));
  assert.ok(has(r, "HIGH", "targetSdk 35 is below the required 36"));
  assert.ok(!r.passed.some((p) => /latest/.test(p)));
});

test("fix text names the lowest Expo SDK that meets the minimum", () => {
  const dir = makeProject("expo53-fixtext", { "package.json": { name: "x", dependencies: { expo: "53.0.0" } }, "app.json": expoApp() });
  const issue = meta(dir).issues.find((i) => /targetSdk/.test(i.title));
  assert.match(issue.fix, /Expo SDK 54\+/);
});

test("expo-build-properties targetSdkVersion 36 overrides Expo 53 inference", () => {
  const dir = makeProject("expo53-plugin36", {
    "package.json": { name: "x", dependencies: { expo: "53.0.0" } },
    "app.json": { expo: { name: "X", version: "1.0.0", plugins: [["expo-build-properties", { android: { targetSdkVersion: 36 } }]], ios: { bundleIdentifier: "com.acme.x", config: { usesNonExemptEncryption: false } }, android: { package: "com.acme.x" } } },
  });
  const r = meta(dir);
  assert.ok(!has(r, "HIGH", "target") && !has(r, "BLOCKER", "target"), JSON.stringify(r.issues, null, 2));
  assert.ok(r.passed.some((p) => /target SDK 36/.test(p)));
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
