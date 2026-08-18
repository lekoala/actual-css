/*
 * Capability floor audit. Run with bun run check:compat.
 *
 * Answers: which capabilities above the Minimal floor are used on a path that
 * does not degrade? Two kinds of above-floor use are acceptable:
 *
 *   - safe-drop: an unknown declaration/value is ignored and the previous
 *     declaration or default wins — the component keeps working, only an
 *     enhancement is lost. No gate required.
 *   - structural: the rule changes which elements get styles or how a layout
 *     behaves. Must be inside @supports (or have a comment on the preceding
 *     lines explaining why the fallback keeps the base functional).
 *
 * Violations fail the pipeline. Optional-tier features are informational only.
 *
 * Minimal floor: Firefox 98 / Safari 15.4 / Chromium 99.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");

const FEATURES = [
  { name: "color-mix()", pattern: /color-mix\(/gi, kind: "safe-drop", tier: "intermediate" },
  { name: "oklch()/oklab()", pattern: /\bokl(?:ch|ab)\(/gi, kind: "safe-drop", tier: "intermediate" },
  { name: "dvh/svh/lvh units", pattern: /\b(?:d|l|s)vh\b/gi, kind: "safe-drop", tier: "intermediate" },
  { name: "scrollbar-gutter", pattern: /scrollbar-gutter\b/gi, kind: "safe-drop", tier: "intermediate" },
  { name: "light-dark()", pattern: /light-dark\(/gi, kind: "safe-drop", tier: "recommended" },
  { name: "text-wrap: balance", pattern: /text-wrap:\s*balance/gi, kind: "safe-drop", tier: "recommended" },
  { name: "field-sizing", pattern: /field-sizing\b/gi, kind: "safe-drop", tier: "recommended" },
  { name: ":has()", pattern: /:has\(/gi, kind: "structural", tier: "recommended" },
  { name: "@container queries", pattern: /@container\b/gi, kind: "structural", tier: "recommended" },
  { name: "subgrid", pattern: /subgrid/gi, kind: "structural", tier: "recommended" },
  { name: "anchor positioning", pattern: /(?:position-anchor|position-area|anchor-name|anchor-size)\b/gi, kind: "safe-drop", tier: "optional" },
  { name: "popover", pattern: /(?:popovertarget|popover-open|\[popover\])/gi, kind: "safe-drop", tier: "optional" },
];

const JUSTIFIED = /(?:progressive|minimal|enhancement|fallback|unsupported|without|retain|degrade|optional|justif|why|browsers)/i;

/*
 * Grandfathered progressive decisions: features used above the Minimal floor
 * with an explicitly documented fallback (see the cited source comments).
 * Any use outside these files still needs a local why comment. This ledger is
 * the "raising Minimal is an explicit decision" record — extend it in the same
 * commit as the source comment that documents the fallback.
 */
const PROGRESSIVE = {
  "src/css/components/join.css": [":has()"],
  "src/css/components/modal.css": [":has()"],
  "src/css/forms/choice-card.css": [":has()"],
  "src/css/forms/choice.css": [":has()"],
  "src/css/grid.css": ["@container queries"],
  "src/css/layout.css": ["@container queries"],
};

function walkCss(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkCss(full));
    else if (entry.name.endsWith(".css")) files.push(full);
  }
  return files;
}

/* Ranges of top-level @supports blocks, so a match inside one counts as guarded. */
function supportsRanges(css) {
  const ranges = [];
  for (const m of css.matchAll(/@supports/gi)) {
    let i = m.index + m[0].length;
    let parens = 0;
    while (i < css.length) {
      const ch = css[i];
      if (ch === "(") parens++;
      else if (ch === ")") parens--;
      else if (ch === "{" && parens === 0) break;
      i++;
    }
    if (i >= css.length) continue;
    let depth = 1;
    let j = i + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    ranges.push([m.index, j]);
  }
  return ranges;
}

function isGuarded(index, ranges) {
  return ranges.some(([start, end]) => index > start && index < end);
}

/* The comment attached to the rule (back to the previous rule boundary) or the
   file header justifies an unguarded structural use. */
function isJustified(css, index) {
  const lineStart = css.lastIndexOf("\n", index - 1) + 1;
  const ruleStart = css.lastIndexOf("}", lineStart - 1) + 1;
  const segment = css.slice(ruleStart, lineStart);
  if (JUSTIFIED.test(segment)) return true;
  const header = css.match(/^\/\*[\s\S]*?\*\//);
  return Boolean(header && JUSTIFIED.test(header[0]));
}

function rel(file) {
  return relative(ROOT, file).replaceAll(sep, "/");
}

function main() {
  const files = walkCss(SRC);
  const violations = [];
  const progressive = [];
  const optional = [];

  for (const file of files) {
    const css = readFileSync(file, "utf8");
    const guarded = supportsRanges(css);

    for (const feature of FEATURES) {
      const grandfathered = (PROGRESSIVE[rel(file)] ?? []).includes(feature.name);
      for (const m of css.matchAll(feature.pattern)) {
        const entry = `${rel(file)}:${lineNo(css, m.index)}  ${feature.name}`;
        if (feature.tier === "optional") {
          optional.push(entry);
        } else if (feature.kind === "safe-drop" || isGuarded(m.index, guarded) || grandfathered || isJustified(css, m.index)) {
          progressive.push(entry);
        } else {
          violations.push(entry);
        }
      }
    }
  }

  console.log("CSS compatibility audit");
  console.log("────────────────────────────────────────────");
  console.log("Minimal floor: Firefox 98 / Safari 15.4 / Chromium 99");
  console.log(`Progressive/safe-drop: ${progressive.length}`);
  console.log(`Optional enhancements: ${optional.length}`);
  console.log(`Unguarded structural above floor: ${violations.length}`);
  for (const line of violations) console.log(`  ✗ ${line}`);

  if (violations.length > 0) {
    console.error("\ncheck:compat failed — unguarded structural capabilities above the Minimal");
    console.error("floor must live in @supports or be justified by a comment on the lines above.");
    process.exit(1);
  }
  console.log("\ncheck:compat passed.");
}

function lineNo(css, index) {
  return css.slice(0, index).split("\n").length;
}

main();