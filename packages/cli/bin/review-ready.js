#!/usr/bin/env node
"use strict";

/**
 * review-ready — deterministic pre-submission compliance scanner.
 *
 * Detects the stack, runs the deterministic rule engine, and prints a
 * severity-ranked report. Exits non-zero when blockers are found so it can
 * gate a CI pipeline.
 *
 * Usage:
 *   review-ready [scan] [dir]      Scan a project (default: cwd)
 *   review-ready --json            Print findings as JSON (for tooling / CI)
 *   review-ready --html            Also write review-ready-report.html
 *   review-ready --category=NAME   Run only one category
 *   review-ready --base <ref>      PR mode: only report issues new vs a git ref
 *   review-ready --diff <file>     PR mode: only report issues new vs a saved JSON
 *   review-ready --help
 */

const fs = require("fs");
const path = require("path");
const { scan } = require("../src/scan");
const { applyDiff } = require("../src/diff");
const { scanBaseRef } = require("../src/gitbase");
const { renderTerminal } = require("../src/report-terminal");
const { writeHtmlReport } = require("../src/report-html");

const VALUE_FLAGS = new Set(["--category", "--base", "--diff"]);

function parseArgs(argv) {
  const opts = { dir: process.cwd(), json: false, html: false, category: null, base: null, diff: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "scan") continue;
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--version" || arg === "-v") opts.version = true;
    else if (arg === "--json") opts.json = true;
    else if (arg === "--html") opts.html = true;
    else if (arg.startsWith("--") && arg.includes("=")) {
      const [k, v] = [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)];
      if (k === "--category") opts.category = v;
      else if (k === "--base") opts.base = v;
      else if (k === "--diff") opts.diff = v;
    } else if (VALUE_FLAGS.has(arg)) {
      const v = argv[++i];
      if (arg === "--category") opts.category = v;
      else if (arg === "--base") opts.base = v;
      else if (arg === "--diff") opts.diff = v;
    } else if (!arg.startsWith("-")) {
      opts.dir = path.resolve(arg);
    }
  }
  return opts;
}

const HELP = `review-ready — pre-submission compliance scanner

Usage:
  review-ready [dir]              Scan a project (default: current directory)
  review-ready --json            Output findings as JSON
  review-ready --html            Also write review-ready-report.html
  review-ready --category=NAME   Run only one category (e.g. permissions)
  review-ready --base <ref>      PR mode — only report issues introduced vs a git ref
  review-ready --diff <file>     PR mode — only report issues introduced vs a saved JSON
  review-ready --help            Show this help

Exit codes:
  0  no blockers found
  1  one or more blockers found (fails CI)
  2  usage / internal error
`;

function loadJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) return void process.stdout.write(HELP);
  if (opts.version) return void process.stdout.write(require("../package.json").version + "\n");

  let result;
  try {
    result = scan(opts.dir, { category: opts.category });
  } catch (e) {
    process.stderr.write("review-ready: " + (e && e.message ? e.message : String(e)) + "\n");
    process.exit(2);
  }

  // PR / diff mode — narrow to newly-introduced issues.
  if (opts.base) {
    const base = scanBaseRef(opts.dir, opts.base, { category: opts.category });
    if (base.ok) {
      result = applyDiff(result, base.result);
    } else if (!opts.json) {
      process.stderr.write(`review-ready: --base unavailable (${base.reason}); showing full scan.\n`);
    }
  } else if (opts.diff) {
    try {
      result = applyDiff(result, loadJsonFile(opts.diff));
    } catch (e) {
      process.stderr.write(`review-ready: could not read baseline "${opts.diff}": ${e.message}\n`);
      process.exit(2);
    }
  }

  if (opts.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    process.stdout.write(renderTerminal(result) + "\n");
  }

  if (opts.html) {
    const out = writeHtmlReport(result, opts.dir);
    if (!opts.json) process.stdout.write("\nHTML report: " + out + "\n");
  }

  const blockers = result.counts.BLOCKER;
  process.exit(blockers > 0 ? 1 : 0);
}

main();
