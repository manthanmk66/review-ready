"use strict";

/**
 * gitbase — scan the project at a base git ref to use as a diff baseline.
 *
 * Uses a detached `git worktree` so it never touches the user's working tree
 * (no stash, no checkout). Best-effort: returns null if the project isn't a
 * git repo, the ref is missing, or git isn't available — callers degrade to a
 * full scan.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { scan } = require("./scan");

function git(root, args) {
  return execFileSync("git", ["-C", root, ...args], { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
}

function isGitRepo(root) {
  try {
    return git(root, ["rev-parse", "--is-inside-work-tree"]) === "true";
  } catch {
    return false;
  }
}

function resolveRef(root, ref) {
  // Try the ref as given, then a few common remote-qualified forms.
  for (const candidate of [ref, `origin/${ref}`, `refs/remotes/origin/${ref}`]) {
    try {
      return git(root, ["rev-parse", "--verify", "--quiet", candidate + "^{commit}"]);
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * @returns {{ ok: true, result: object, ref: string, sha: string } | { ok: false, reason: string }}
 */
function scanBaseRef(root, ref, opts = {}) {
  if (!isGitRepo(root)) return { ok: false, reason: "not a git repository" };
  const sha = resolveRef(root, ref);
  if (!sha) return { ok: false, reason: `base ref "${ref}" not found (try fetch-depth: 0)` };

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rr-base-"));
  let added = false;
  try {
    git(root, ["worktree", "add", "--detach", "--quiet", tmp, sha]);
    added = true;
    const result = scan(tmp, opts);
    return { ok: true, result, ref, sha };
  } catch (e) {
    return { ok: false, reason: (e && e.message) || "git worktree failed" };
  } finally {
    if (added) {
      try {
        git(root, ["worktree", "remove", "--force", tmp]);
      } catch {
        /* leave the temp dir; OS will reclaim it */
      }
    }
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

module.exports = { scanBaseRef, isGitRepo };
