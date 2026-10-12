"use strict";

/**
 * Compliance knowledge, encoded as data — ported from agents/permissions-auditor.md,
 * rules/expo-rules.md and rules/android-guidelines.md §8.x. Keeping it declarative
 * makes each entry reviewable against the source guideline.
 */

/**
 * Expo / RN module → the iOS Info.plist usage strings it requires.
 * Missing a required string for an installed module = instant Apple 5.1.1 rejection.
 */
const MODULE_IOS_STRINGS = {
  "expo-camera": ["NSCameraUsageDescription"],
  "expo-image-picker": ["NSPhotoLibraryUsageDescription"],
  "expo-media-library": ["NSPhotoLibraryUsageDescription"],
  "expo-location": ["NSLocationWhenInUseUsageDescription"],
  "expo-contacts": ["NSContactsUsageDescription"],
  "expo-calendar": ["NSCalendarsUsageDescription"],
  "expo-av": ["NSMicrophoneUsageDescription"],
  "expo-audio": ["NSMicrophoneUsageDescription"],
  "expo-video": ["NSMicrophoneUsageDescription"],
  "expo-tracking-transparency": ["NSUserTrackingUsageDescription"],
  "expo-speech-recognition": ["NSSpeechRecognitionUsageDescription"],
  "expo-sensors": [],
  "@react-native-community/geolocation": ["NSLocationWhenInUseUsageDescription"],
  "react-native-vision-camera": ["NSCameraUsageDescription", "NSMicrophoneUsageDescription"],
  "react-native-image-picker": ["NSPhotoLibraryUsageDescription", "NSCameraUsageDescription"],
};

/** Human label for each usage-string key, for clearer messages. */
const IOS_STRING_LABEL = {
  NSCameraUsageDescription: "camera",
  NSPhotoLibraryUsageDescription: "photo library",
  NSPhotoLibraryAddUsageDescription: "photo library (add only)",
  NSMicrophoneUsageDescription: "microphone",
  NSLocationWhenInUseUsageDescription: "location (when in use)",
  NSLocationAlwaysAndWhenInUseUsageDescription: "location (always)",
  NSContactsUsageDescription: "contacts",
  NSCalendarsUsageDescription: "calendar",
  NSRemindersUsageDescription: "reminders",
  NSUserTrackingUsageDescription: "tracking (ATT)",
  NSSpeechRecognitionUsageDescription: "speech recognition",
};

/**
 * Expo / RN module → Android permissions it auto-injects into the merged
 * manifest during prebuild (rules/expo-rules.md §C.5).
 */
const MODULE_ANDROID_PERMISSIONS = {
  "expo-camera": ["CAMERA", "RECORD_AUDIO"],
  "expo-location": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
  "expo-image-picker": ["READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO"],
  "expo-media-library": ["READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "WRITE_EXTERNAL_STORAGE"],
  "expo-notifications": ["POST_NOTIFICATIONS"],
  "expo-contacts": ["READ_CONTACTS"],
};

/**
 * Android restricted permissions → the Play Console declaration required.
 * Declaring these without filing the declaration blocks the release.
 */
const RESTRICTED_ANDROID = {
  READ_SMS: "SMS/Call Log Permissions Declaration",
  SEND_SMS: "SMS/Call Log Permissions Declaration",
  RECEIVE_SMS: "SMS/Call Log Permissions Declaration",
  RECEIVE_MMS: "SMS/Call Log Permissions Declaration",
  READ_CALL_LOG: "SMS/Call Log Permissions Declaration",
  WRITE_CALL_LOG: "SMS/Call Log Permissions Declaration",
  PROCESS_OUTGOING_CALLS: "SMS/Call Log Permissions Declaration",
  MANAGE_EXTERNAL_STORAGE: "All Files Access Declaration",
  ACCESS_BACKGROUND_LOCATION: "Background Location Declaration",
  QUERY_ALL_PACKAGES: "Package Visibility Declaration",
  BIND_ACCESSIBILITY_SERVICE: "Accessibility Declaration",
  PACKAGE_USAGE_STATS: "Sensitive permission justification",
  REQUEST_INSTALL_PACKAGES: "Unknown sources / install-packages justification",
  BIND_VPN_SERVICE: "VPN Service Policy compliance",
  READ_HEALTH_DATA: "Health Apps Declaration + Verified Org Account",
};

/** Photo-library media permissions governed by Android §8.4. */
const MEDIA_PERMISSIONS = ["READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "READ_MEDIA_VISUAL_USER_SELECTED"];

/**
 * Source patterns used to decide the §8.4 BLOCKER-vs-HIGH heuristic.
 * One-off picker usage → permission not needed → BLOCKER if still declared.
 * Library enumeration / full gallery → may justify it → HIGH (needs Declaration).
 */
const PICKER_USAGE_RE = /launchImageLibraryAsync|PickVisualMedia|ACTION_PICK_IMAGES|ImagePicker\.|launchImageLibrary\(/;
const GALLERY_ENUMERATION_RE = /MediaStore\.Images\.Media|getAssetsAsync|MediaLibrary\.getAssets|cursor\.moveToNext|ContentResolver/;

/** Words that make an iOS usage string specific rather than boilerplate. */
const SPECIFIC_PURPOSE_RE = /\b(when you|for example|such as|so you can|to let you|in order to|so that)\b/i;

module.exports = {
  MODULE_IOS_STRINGS,
  IOS_STRING_LABEL,
  MODULE_ANDROID_PERMISSIONS,
  RESTRICTED_ANDROID,
  MEDIA_PERMISSIONS,
  PICKER_USAGE_RE,
  GALLERY_ENUMERATION_RE,
  SPECIFIC_PURPOSE_RE,
};
