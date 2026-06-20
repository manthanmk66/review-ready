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

// Map Expo SDK major → Android targetSdk it compiles against (rules/expo-rules.md).
function expoToTargetSdk(expoMajor) {
  if (expoMajor >= 52) return 35;
  if (expoMajor === 51) return 34;
  if (expoMajor === 50) return 34;
  if (expoMajor >= 48) return 33;
  return null;
}

const MIN_TARGET_SDK = 35; // Google Play requirement as of Aug 2025

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
  MIN_TARGET_SDK,
};
