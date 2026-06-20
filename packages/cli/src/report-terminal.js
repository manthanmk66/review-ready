"use strict";

/**
 * Terminal report — ANSI-coloured, scannable summary printed to stdout.
 * Honours NO_COLOR and non-TTY output (CI logs) by dropping colour codes.
 */

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = c("1");
const dim = c("2");
const red = c("31");
const yellow = c("33");
const blue = c("34");
const magenta = c("35");
const green = c("32");
const gray = c("90");

const SEV = {
  BLOCKER: { emoji: "🛑", color: red, label: "Blockers" },
  HIGH: { emoji: "⚠️ ", color: yellow, label: "High" },
  MEDIUM: { emoji: "📋", color: blue, label: "Medium" },
  LOW: { emoji: "💡", color: magenta, label: "Low" },
  INFO: { emoji: "ℹ️ ", color: gray, label: "Info" },
};
const ORDER = ["BLOCKER", "HIGH", "MEDIUM", "LOW", "INFO"];
const SECTION_TITLE = {
  BLOCKER: "Blockers — fix these before submitting",
  HIGH: "High risk — likely to be rejected",
  MEDIUM: "Medium risk — often flagged in review",
  LOW: "Low risk",
  INFO: "Info",
};

function bar(score) {
  const filled = Math.round(score / 10);
  const blocks = "█".repeat(filled) + "░".repeat(10 - filled);
  const col = score >= 90 ? green : score >= 70 ? yellow : red;
  return col(blocks);
}

function renderTerminal(result) {
  const counts = result.counts;
  const out = [];
  const line = (s = "") => out.push(s);

  line();
  const mode = result.mode === "diff" ? "  ·  PR diff (new issues only)" : "  ·  deterministic scan";
  line(bold("  🛡  Review Ready") + dim(mode));
  line("  " + bold(result.project) + dim("  —  " + result.stack));
  if (result.mode === "diff" && result.diff) {
    const d = result.diff;
    line(
      dim(
        `  vs baseline: ${d.introduced} introduced, ${d.resolved} resolved ` +
          `(${d.baselineTotal} pre-existing not shown)`
      )
    );
  }
  line();

  // Readiness badge + score
  const ready = counts.BLOCKER === 0;
  const badge = !ready
    ? red("  ✗ NOT READY")
    : counts.HIGH > 0
    ? yellow("  ▲ READY — WITH WARNINGS")
    : green("  ✓ READY");
  line(bold(badge) + dim("   score ") + bold(String(result.score) + "/100") + "  " + bar(result.score));
  line();

  // Summary table
  const cell = (n, sev) => SEV[sev].color(SEV[sev].emoji + " " + n + " " + SEV[sev].label);
  line(
    "  " +
      [cell(counts.BLOCKER, "BLOCKER"), cell(counts.HIGH, "HIGH"), cell(counts.MEDIUM, "MEDIUM")].join(
        dim("   ")
      )
  );
  line(
    "  " +
      [cell(counts.LOW, "LOW"), cell(counts.INFO, "INFO"), green("✅ " + result.passed.length + " Passed")].join(
        dim("   ")
      )
  );

  // Sections
  const grouped = {};
  for (const i of result.issues) (grouped[i.severity] = grouped[i.severity] || []).push(i);

  for (const sev of ORDER) {
    const list = grouped[sev];
    if (!list || !list.length) continue;
    const meta = SEV[sev];
    line();
    line(meta.color(bold(`  ${meta.emoji} ${SECTION_TITLE[sev]} (${list.length})`)));
    list.forEach((i, idx) => {
      line();
      line("  " + bold(`${idx + 1}. ${i.title}`));
      const locParts = [];
      if (i.guideline) locParts.push(i.guideline);
      if (i.file) locParts.push(i.file + (i.line ? ":" + i.line : ""));
      if (locParts.length) line(dim("     " + locParts.join("  ·  ")));
      if (i.description) line("     " + wrap(i.description, 88, "     "));
      if (i.fix) line("     " + green("Fix: ") + wrap(i.fix, 88, "     "));
    });
  }

  line();
  const isDiff = result.mode === "diff";
  if (counts.BLOCKER > 0) {
    const what = isDiff ? "new blocker(s)" : "blocker(s)";
    line(red(bold(`  ${counts.BLOCKER} ${what} must be fixed before this build will be accepted.`)));
  } else if (isDiff && result.issues.length === 0) {
    line(green(bold("  No new issues introduced by this change. ✅")));
  } else if (isDiff) {
    line(green(bold("  No new blockers introduced by this change.")));
  } else {
    line(green(bold("  No blockers found. Complete the manual store-console steps and submit.")));
  }
  line(dim("  Deterministic checks only — run the Review Ready plugin for content & judgment checks."));
  line();
  return out.join("\n");
}

// Soft-wrap long text, indenting continuation lines.
function wrap(text, width, indent) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > width) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur += " " + w;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.join("\n" + indent);
}

module.exports = { renderTerminal };
