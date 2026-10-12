"use strict";

/** Knowledge for the metadata auditor, ported from agents/metadata-auditor.md. */

// Bundle identifiers that ship by accident — reviewers treat them as red flags
// and some block upload. com.anonymous.* is the create-expo-app default.
const PLACEHOLDER_BUNDLE_RE = /^(com\.example\.|host\.exp\.|com\.anonymous\.|com\.companyname\.|com\.yourcompany\.|com\.test\.)/i;

const VALID_BUNDLE_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

// App-name content that trips Google Play 6.2 / Apple 2.3 metadata rules.
const BANNED_NAME_RE = /\b(free|best|top|#1|no\.?\s*1|cheap|discount)\b/i;
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

// Sign in with Apple (4.8). Confirmed social logins → BLOCKER without SiwA.
const CONFIRMED_SOCIAL_LOGIN = [
  "@react-native-google-signin/google-signin",
  "react-native-fbsdk-next",
  "react-native-twitter-signin",
  "@react-native-seoul/kakao-login",
  "@react-native-seoul/naver-login",
];
// Hosted-account auth that Apple increasingly treats as third-party login → HIGH.
const BROADER_AUTH = [
  "@react-native-firebase/auth",
  "expo-auth-session",
  "react-native-auth0",
  "@clerk/clerk-expo",
  "@clerk/clerk-react",
];
// Presence of any of these satisfies the requirement.
const SIWA_PACKAGES = ["expo-apple-authentication", "@invertase/react-native-apple-authentication"];

// Apple 3.2 — business/internal app submitted to public distribution.
const BUSINESS_BUNDLE_RE = /\.(admin|staff|manager|b2b|internal|partner|partners|dealer|vendor)\b/i;
const BUSINESS_NAME_RE = /\b(admin|manager|partner portal|dealer|vendor|staff portal|merchant app|driver app)\b/i;

// Map Expo SDK major → Android targetSdk of its bundled React Native template
// (RN 0.76 → 34, 0.79 → 35, 0.81 → 36). SDK 52 compiles against 35 but targets 34.
function expoToTargetSdk(expoMajor) {
  if (expoMajor >= 54) return 36;
  if (expoMajor === 53) return 35;
  if (expoMajor >= 50) return 34;
  if (expoMajor >= 48) return 33;
  return null;
}

// Bare React Native: targetSdk from the template's libs.versions.toml.
function rnToTargetSdk(minor) {
  if (minor >= 81) return 36;
  if (minor >= 77) return 35;
  if (minor >= 73) return 34;
  return null;
}

const MIN_TARGET_SDK = 36; // Google Play requirement for new apps and updates since Aug 31, 2026

// Lowest Expo SDK whose default target meets the Play minimum.
function minExpoSdkForTarget(target) {
  for (let major = 48; major < 100; major++) {
    const t = expoToTargetSdk(major);
    if (t != null && t >= target) return major;
  }
  return null;
}

module.exports = {
  PLACEHOLDER_BUNDLE_RE,
  VALID_BUNDLE_RE,
  BANNED_NAME_RE,
  EMOJI_RE,
  CONFIRMED_SOCIAL_LOGIN,
  BROADER_AUTH,
  SIWA_PACKAGES,
  BUSINESS_BUNDLE_RE,
  BUSINESS_NAME_RE,
  expoToTargetSdk,
  rnToTargetSdk,
  minExpoSdkForTarget,
  MIN_TARGET_SDK,
};
