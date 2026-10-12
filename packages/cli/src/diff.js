"use strict";

/**
 * diff — report only NEWLY-introduced findings relative to a baseline.
 *
 * This is what makes review-ready usable as a PR gate: a repo with existing
 * (legacy) issues won't fail every build, but any issue the PR *introduces*
 * does. Comparison is by a line-independent fingerprint so unrelated edits
 * that shift line numbers don't masquerade as new issues.
 */

const { finalize } = require("./scan");

/** Stable identity for an issue, independent of line number. */
function fingerprint(issue) {
  return [issue.severity, issue.category || "", issue.title || "", issue.file || ""].join("::");
}

function loadBaseline(data) {
  // Accept either a full result object or a bare array of issues.
  if (Array.isArray(data)) return { issues: data };
  if (data && Array.isArray(data.issues)) return data;
  return { issues: [] };
}

/**
 * @param {object} current  result from scan()
 * @param {object|array} baselineData  prior result (or its issues array)
 * @returns {object} a result containing only newly-introduced issues, with
 *   counts/score recomputed and a `.diff` summary attached.
 */
function applyDiff(current, baselineData) {
  const baseline = loadBaseline(baselineData);
  const baseSet = new Set(baseline.issues.map(fingerprint));

  const introduced = current.issues.filter((i) => !baseSet.has(fingerprint(i)));
  const resolvedCount = baseline.issues.filter(
    (i) => !current.issues.some((c) => fingerprint(c) === fingerprint(i))
  ).length;

  const result = finalize({
    ...current,
    issues: introduced,
    passed: current.passed,
    mode: "diff",
    diff: {
      baselineTotal: baseline.issues.length,
      currentTotal: current.issues.length,
      introduced: introduced.length,
      resolved: resolvedCount,
    },
  });
  return result;
}

module.exports = { applyDiff, fingerprint, loadBaseline };
