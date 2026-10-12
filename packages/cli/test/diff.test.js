"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { applyDiff, fingerprint } = require("../src/diff");

function result(issues) {
  return {
    project: "x",
    stack: "Expo",
    issues,
    passed: [],
    counts: { BLOCKER: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 },
  };
}
const issue = (severity, title, file = "app.json") => ({ severity, category: "permissions", title, file });

test("diff reports only newly-introduced issues", () => {
  const baseline = result([issue("MEDIUM", "Legacy storage permission WRITE_EXTERNAL_STORAGE likely over-declared")]);
  const current = result([
    issue("MEDIUM", "Legacy storage permission WRITE_EXTERNAL_STORAGE likely over-declared"),
    issue("BLOCKER", "Missing photo library usage string (NSPhotoLibraryUsageDescription)"),
  ]);
  const d = applyDiff(current, baseline);
  assert.strictEqual(d.issues.length, 1);
  assert.strictEqual(d.issues[0].severity, "BLOCKER");
  assert.strictEqual(d.counts.BLOCKER, 1);
  assert.strictEqual(d.ready, false);
  assert.strictEqual(d.diff.introduced, 1);
  assert.strictEqual(d.diff.baselineTotal, 1);
});

test("diff is clean when the PR introduces nothing new", () => {
  const baseline = result([issue("BLOCKER", "Pre-existing blocker")]);
  const current = result([issue("BLOCKER", "Pre-existing blocker")]);
  const d = applyDiff(current, baseline);
  assert.strictEqual(d.issues.length, 0);
  assert.strictEqual(d.counts.BLOCKER, 0);
  assert.strictEqual(d.ready, true, "pre-existing blocker should NOT fail the PR");
  assert.strictEqual(d.diff.introduced, 0);
});

test("diff counts resolved issues", () => {
  const baseline = result([issue("HIGH", "A"), issue("HIGH", "B")]);
  const current = result([issue("HIGH", "B")]);
  const d = applyDiff(current, baseline);
  assert.strictEqual(d.diff.resolved, 1);
  assert.strictEqual(d.diff.introduced, 0);
});

test("diff accepts a bare issues array as baseline", () => {
  const current = result([issue("HIGH", "A"), issue("HIGH", "B")]);
  const d = applyDiff(current, [issue("HIGH", "A")]);
  assert.strictEqual(d.issues.length, 1);
  assert.strictEqual(d.issues[0].title, "B");
});

test("fingerprint ignores line number, distinguishes title/file/severity", () => {
  assert.strictEqual(
    fingerprint({ severity: "HIGH", category: "permissions", title: "T", file: "a.json", line: 5 }),
    fingerprint({ severity: "HIGH", category: "permissions", title: "T", file: "a.json", line: 99 })
  );
  assert.notStrictEqual(
    fingerprint({ severity: "HIGH", title: "T", file: "a.json" }),
    fingerprint({ severity: "HIGH", title: "T", file: "b.json" })
  );
});
