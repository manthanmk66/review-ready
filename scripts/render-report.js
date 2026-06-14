#!/usr/bin/env node
/**
 * Review Ready — HTML report generator.
 *
 * Turns aggregated scan findings (JSON) into a self-contained "Dashboard"
 * HTML report. Zero npm dependencies — pure Node `fs` + string templating.
 * All CSS is inlined so the file opens offline, forever.
 *
 * Usage:
 *   node render-report.js <findings.json> [outputDir]
 *
 * findings.json shape:
 * {
 *   "project": "Acme",
 *   "stack": "Expo SDK 54 / React Native 0.81",
 *   "scannedAt": "2026-06-14T10:00:00Z",   // optional, defaults to now
 *   "issues": [
 *     {
 *       "severity": "BLOCKER|HIGH|MEDIUM|LOW|INFO",
 *       "store": "apple|google|both",
 *       "guideline": "Apple 5.1.1 — Data Collection and Storage",
 *       "file": "app.json",                 // optional
 *       "line": 15,                          // optional
 *       "title": "Missing NSCameraUsageDescription",
 *       "description": "expo-camera is installed but ...",
 *       "fix": "Add to ios.infoPlist: ...",  // optional
 *       "auto_fixable": true                 // optional
 *     }
 *   ],
 *   "passed": ["PrivacyInfo.xcprivacy present", "Target SDK 35", ...] // optional
 * }
 *
 * Output: writes <outputDir>/review-ready-report.html and prints the path.
 */

const fs = require("fs");
const path = require("path");

// ── Severity model — single source of truth for colour + emoji ──────────────
const SEVERITY = {
  BLOCKER: { label: "Blockers", emoji: "🛑", color: "#ef4444", weight: 0 },
  HIGH: { label: "High", emoji: "⚠️", color: "#f59e0b", weight: 1 },
  MEDIUM: { label: "Medium", emoji: "📋", color: "#3b82f6", weight: 2 },
  LOW: { label: "Low", emoji: "💡", color: "#8b5cf6", weight: 3 },
  INFO: { label: "Info", emoji: "ℹ️", color: "#64748b", weight: 4 },
};
const SECTION_TITLE = {
  BLOCKER: "🛑 Blockers — fix these before submitting",
  HIGH: "⚠️ High Risk — likely to be rejected",
  MEDIUM: "📋 Medium Risk — often flagged in review",
  LOW: "💡 Low Risk",
  INFO: "ℹ️ Info",
};
const ORDER = ["BLOCKER", "HIGH", "MEDIUM", "LOW", "INFO"];

const STORE_LABEL = {
  apple: "🍎 Apple",
  google: "🤖 Google",
  both: "🍎🤖 Both",
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normSeverity(s) {
  const up = String(s || "").toUpperCase();
  return SEVERITY[up] ? up : "INFO";
}

function loadFindings(file) {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("findings JSON must be an object");
  data.issues = Array.isArray(data.issues) ? data.issues : [];
  data.passed = Array.isArray(data.passed) ? data.passed : [];
  return data;
}

// ── Report rendering ─────────────────────────────────────────────────────────
function buildReport(data) {
  const project = escapeHtml(data.project || "Your app");
  const stack = escapeHtml(data.stack || "Unknown stack");
  const scanned = data.scannedAt ? new Date(data.scannedAt) : new Date();
  const scannedStr = isNaN(scanned.getTime()) ? "" : scanned.toLocaleString();

  const counts = { BLOCKER: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const i of data.issues) counts[normSeverity(i.severity)]++;
  const passedCount = data.passed.length;

  const ready = counts.BLOCKER === 0;
  const readyWithWarnings = ready && counts.HIGH > 0;
  const badge = !ready
    ? { text: "NOT READY", bg: "#fee2e2", fg: "#b91c1c", sub: `${counts.BLOCKER} blocker${counts.BLOCKER === 1 ? "" : "s"} must be fixed before submitting` }
    : readyWithWarnings
    ? { text: "READY — WITH WARNINGS", bg: "#fef3c7", fg: "#b45309", sub: `${counts.HIGH} high-risk item${counts.HIGH === 1 ? "" : "s"} likely to be flagged` }
    : { text: "READY", bg: "#dcfce7", fg: "#15803d", sub: "No blockers found — good to submit" };

  // Stat cards
  const statCards = [
    { key: "BLOCKER", n: counts.BLOCKER },
    { key: "HIGH", n: counts.HIGH },
    { key: "MEDIUM", n: counts.MEDIUM },
    { key: "PASSED", n: passedCount, label: "Passed", color: "#22c55e" },
  ]
    .map((c) => {
      const meta = c.key === "PASSED" ? { label: "Passed", color: "#22c55e" } : SEVERITY[c.key];
      return `<div class="stat" style="--c:${meta.color}">
        <div class="n">${c.n}</div>
        <div class="l">${escapeHtml(meta.label)}</div>
      </div>`;
    })
    .join("");

  // Issue sections grouped by severity, in order
  const grouped = {};
  for (const i of data.issues) {
    const sev = normSeverity(i.severity);
    (grouped[sev] = grouped[sev] || []).push(i);
  }

  const sections = ORDER.filter((sev) => grouped[sev] && grouped[sev].length)
    .map((sev) => {
      const meta = SEVERITY[sev];
      const cards = grouped[sev]
        .map((i, idx) => {
          const loc = i.file ? `${i.file}${i.line ? ":" + i.line : ""}` : "";
          const store = STORE_LABEL[String(i.store || "").toLowerCase()];
          return `<div class="card" style="--c:${meta.color}">
            <div class="card-top">
              <span class="gl">${meta.emoji} ${escapeHtml(i.guideline || "")}</span>
              ${i.auto_fixable ? `<span class="fix-pill">🔧 auto-fixable</span>` : ""}
            </div>
            <h4>${idx + 1}. ${escapeHtml(i.title || "Issue")}</h4>
            ${loc ? `<div class="loc"><code>${escapeHtml(loc)}</code>${store ? ` · ${escapeHtml(store)}` : ""}</div>` : ""}
            ${i.description ? `<p class="desc">${escapeHtml(i.description)}</p>` : ""}
            ${i.fix ? `<div class="fix"><span class="fix-label">Fix</span> ${escapeHtml(i.fix)}</div>` : ""}
          </div>`;
        })
        .join("");
      return `<section class="sev-section">
        <h2 style="--c:${meta.color}">${escapeHtml(SECTION_TITLE[sev])} <span class="count">${grouped[sev].length}</span></h2>
        ${cards}
      </section>`;
    })
    .join("");

  const passedBlock = passedCount
    ? `<section class="passed">
        <h2 style="--c:#22c55e">✅ Passed checks <span class="count">${passedCount}</span></h2>
        <div class="passed-grid">
          ${data.passed.map((p) => `<span class="passed-item">✓ ${escapeHtml(p)}</span>`).join("")}
        </div>
      </section>`
    : "";

  const manualBlock = `<section class="manual">
    <h2 style="--c:#64748b">📝 Manual steps — can't be auto-checked</h2>
    <div class="manual-cols">
      <div>
        <div class="manual-head">🍎 App Store Connect</div>
        <ul>
          <li>Privacy Nutrition Labels filled</li>
          <li>Demo account credentials provided</li>
          <li>Age rating questionnaire completed</li>
          <li>Encryption Export Compliance answered</li>
        </ul>
      </div>
      <div>
        <div class="manual-head">🤖 Play Console</div>
        <ul>
          <li>Data Safety form completed</li>
          <li>Account deletion URL set</li>
          <li>Privacy policy URL set</li>
          <li>Required declarations submitted (FGS, sensitive permissions)</li>
        </ul>
      </div>
    </div>
  </section>`;

  const emptyState = data.issues.length === 0
    ? `<section class="empty">🎉 No issues detected. Complete the manual steps below and submit with confidence.</section>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Review Ready — ${project}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #f4f6fb;
    color: #0f172a;
    line-height: 1.5;
  }
  .wrap { max-width: 920px; margin: 0 auto; padding: 32px 20px 64px; }

  header.top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
  .brand { font-size: 13px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #6366f1; }
  h1 { font-size: 26px; margin: 4px 0 2px; }
  .sub { color: #64748b; font-size: 13px; }

  .badge { border-radius: 999px; padding: 10px 18px; text-align: right; }
  .badge .b-text { font-size: 15px; font-weight: 800; }
  .badge .b-sub { font-size: 11px; opacity: .85; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 24px 0; }
  .stat { background: var(--c); color: #fff; border-radius: 16px; padding: 18px; box-shadow: 0 6px 18px rgba(15,23,42,.10); }
  .stat .n { font-size: 34px; font-weight: 800; line-height: 1; }
  .stat .l { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; opacity: .92; margin-top: 6px; }

  .sev-section, .passed, .manual { margin-top: 28px; }
  h2 { font-size: 16px; margin: 0 0 12px; padding-left: 12px; border-left: 4px solid var(--c); }
  h2 .count { color: #94a3b8; font-weight: 600; font-size: 13px; }

  .card { background: #fff; border-radius: 14px; padding: 16px 18px; margin-bottom: 12px;
          border-left: 5px solid var(--c); box-shadow: 0 1px 3px rgba(15,23,42,.07); }
  .card-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .gl { font-size: 12px; font-weight: 700; color: var(--c); }
  .fix-pill { font-size: 11px; font-weight: 700; background: #eef2ff; color: #4338ca; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
  .card h4 { margin: 8px 0 4px; font-size: 15px; }
  .loc { font-size: 12px; color: #64748b; margin-bottom: 6px; }
  code { background: #f1f5f9; padding: 1px 6px; border-radius: 5px; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .desc { margin: 6px 0; color: #334155; font-size: 13px; }
  .fix { margin-top: 8px; font-size: 13px; background: #f0fdf4; border-radius: 8px; padding: 8px 12px; color: #166534; }
  .fix-label { font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: .5px; color: #15803d; margin-right: 4px; }

  .passed-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .passed-item { background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 5px 11px; border-radius: 999px; }

  .manual { background: #fff; border-radius: 14px; padding: 18px; box-shadow: 0 1px 3px rgba(15,23,42,.07); }
  .manual-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .manual-head { font-weight: 700; font-size: 13px; margin-bottom: 6px; }
  .manual ul { margin: 0; padding-left: 18px; color: #475569; font-size: 13px; }
  .manual li { margin: 4px 0; }

  .empty { background: #dcfce7; color: #166534; border-radius: 14px; padding: 18px; font-weight: 600; margin-top: 24px; }

  footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }

  @media (max-width: 640px) {
    .stats { grid-template-columns: repeat(2, 1fr); }
    .manual-cols { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <header class="top">
      <div>
        <div class="brand">🛡️ Review Ready — Audit Report</div>
        <h1>${project}</h1>
        <div class="sub">${stack}${scannedStr ? ` · scanned ${escapeHtml(scannedStr)}` : ""}</div>
      </div>
      <div class="badge" style="background:${badge.bg};color:${badge.fg}">
        <div class="b-text">${badge.text}</div>
        <div class="b-sub">${escapeHtml(badge.sub)}</div>
      </div>
    </header>

    <div class="stats">${statCards}</div>

    ${emptyState}
    ${sections}
    ${passedBlock}
    ${manualBlock}

    <footer>Generated by Review Ready · guidelines current as of May 2026</footer>
  </div>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const findingsPath = process.argv[2];
  const outDir = process.argv[3] || process.cwd();
  if (!findingsPath) {
    console.error("Usage: node render-report.js <findings.json> [outputDir]");
    process.exit(2);
  }
  let data;
  try {
    data = loadFindings(findingsPath);
  } catch (e) {
    console.error("Failed to read findings JSON:", e.message);
    process.exit(1);
  }
  const html = buildReport(data);
  const outPath = path.join(outDir, "review-ready-report.html");
  fs.writeFileSync(outPath, html, "utf8");
  // Print only the path on stdout so callers can capture it for `open`.
  console.log(outPath);
}

main();
