"use strict";

/**
 * scan — orchestrator. Detects the stack, builds the shared context the rules
 * read from, runs the rule registry, and aggregates findings into the schema
 * the report renderers (terminal + HTML) consume.
 */

const path = require("path");
const { detect } = require("./detect");
const parse = require("./parse");
const permissions = require("./rules/permissions");
const metadata = require("./rules/metadata");

// Rule registry. New auditors (privacy, iap, crash-risk) plug in here.
const RULES = {
  permissions,
  metadata,
};

// Score weights — blockers dominate, info is free. Mirrors the report's
// severity model and react-doctor's "errors weigh more than warnings".
const SCORE_WEIGHT = { BLOCKER: 25, HIGH: 10, MEDIUM: 4, LOW: 1, INFO: 0 };

function buildContext(detected) {
  const appConfig = parse.readAppConfig(detected);

  const manifestRaw = detected.androidManifestPath ? parse.readText(detected.androidManifestPath) : null;
  const manifest = manifestRaw ? parse.parseAndroidManifest(manifestRaw) : null;

  const infoPlistRaw = detected.infoPlistPath ? parse.readText(detected.infoPlistPath) : null;
  const infoPlist = infoPlistRaw ? parse.parseInfoPlist(infoPlistRaw) : null;

  const source = parse.readSource(detected.root);

  return {
    detected,
    appConfig,
    manifest,
    manifestRaw,
    manifestPath: detected.androidManifestPath,
    infoPlist,
    infoPlistRaw,
    infoPlistPath: detected.infoPlistPath,
    source,
    rel: (p) => (p ? path.relative(detected.root, path.resolve(detected.root, p)) || path.basename(p) : ""),
    lineOfKey: parse.lineOfKey,
  };
}

function computeScore(counts) {
  let penalty = 0;
  for (const sev of Object.keys(SCORE_WEIGHT)) penalty += (counts[sev] || 0) * SCORE_WEIGHT[sev];
  return Math.max(0, Math.min(100, 100 - penalty));
}

/**
 * @param {string} root project directory
 * @param {{category?: string|null}} [opts]
 */
function scan(root, opts = {}) {
  const detected = detect(root);
  const scannedAt = new Date().toISOString();

  const base = {
    project: detected.projectName,
    stack: detected.stack,
    kind: detected.kind,
    scannedAt,
    score: 100,
    ready: true,
    counts: { BLOCKER: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 },
    issues: [],
    passed: [],
  };

  if (detected.kind === "flutter") {
    base.issues.push({
      category: "meta",
      severity: "INFO",
      store: "both",
      guideline: "Coverage",
      title: "Flutter is not yet supported by the deterministic engine",
      description: "Stack detection found pubspec.yaml. Flutter rules are planned. Run the Claude/Cursor plugin for an LLM-driven review in the meantime.",
      auto_fixable: false,
    });
  } else if (detected.kind === "unknown") {
    base.issues.push({
      category: "meta",
      severity: "INFO",
      store: "both",
      guideline: "Coverage",
      title: "No mobile project detected here",
      description: "Couldn't find app.json, an ios/ or android/ folder. Point review-ready at your app's root directory.",
      auto_fixable: false,
    });
  } else {
    const ctx = buildContext(detected);
    const selected = opts.category
      ? { [opts.category]: RULES[opts.category] }
      : RULES;
    for (const [name, rule] of Object.entries(selected)) {
      if (!rule) {
        base.issues.push({
          category: "meta",
          severity: "INFO",
          store: "both",
          guideline: "Coverage",
          title: `Unknown category "${name}"`,
          description: `Available categories: ${Object.keys(RULES).join(", ")}.`,
          auto_fixable: false,
        });
        continue;
      }
      const { issues, passed } = rule.run(ctx);
      base.issues.push(...issues);
      base.passed.push(...passed);
    }
  }

  return finalize(base);
}

/** Recompute counts, score and readiness from a result's issue list. */
function finalize(result) {
  result.counts = { BLOCKER: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const i of result.issues) {
    const sev = result.counts[i.severity] !== undefined ? i.severity : "INFO";
    result.counts[sev]++;
  }
  result.score = computeScore(result.counts);
  result.ready = result.counts.BLOCKER === 0;
  return result;
}

module.exports = { scan, finalize, computeScore, SCORE_WEIGHT };
