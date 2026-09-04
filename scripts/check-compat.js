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
 * Violations fail the pipeline. Tier controls how a use is *reported*, not
 * whether it needs a gate: an optional-tier feature that is safe-drop stays
 * informational, but an optional-tier feature that is structural must still be
 * guarded or justified. Tier says how far above the floor a capability sits;
 * kind says what happens on an engine that lacks it, and only kind can excuse
 * a use.
 *
 * "Above the floor" is not the same as "outside the Minimal range". An
 * optional-tier capability such as Popover is simply not part of Actual's
 * Minimal contract: engines well inside the Minimal range may still lack it,
 * so a gate tracks the capability, never a browser generation.
 *
 * Prose does not excuse an optional-tier structural use. A comment explaining
 * why a capability needs a gate reads, to a keyword matcher, exactly like a
 * comment excusing its absence — so removing the @supports would keep passing.
 * Optional-tier structural uses therefore need either a real guard or an
 * explicit "compat-ok:" pragma naming the reason.
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
  {
    name: "oklch()/oklab()",
    pattern: /\bokl(?:ch|ab)\(/gi,
    kind: "safe-drop",
    tier: "intermediate",
  },
  {
    name: "dvh/svh/lvh units",
    pattern: /\b(?:d|l|s)vh\b/gi,
    kind: "safe-drop",
    tier: "intermediate",
  },
  {
    name: "scrollbar-gutter",
    pattern: /scrollbar-gutter\b/gi,
    kind: "safe-drop",
    tier: "intermediate",
  },
  /* scrollbar-width and scrollbar-color land in Chromium 121 / Safari 18.2,
     both above the floor. An engine that knows neither draws its native
     scrollbar, which is the intended fallback. */
  {
    name: "scrollbar-width",
    pattern: /scrollbar-width\b/gi,
    kind: "safe-drop",
    tier: "intermediate",
  },
  {
    name: "scrollbar-color",
    pattern: /scrollbar-color\b/gi,
    kind: "safe-drop",
    tier: "intermediate",
  },
  { name: "light-dark()", pattern: /light-dark\(/gi, kind: "safe-drop", tier: "recommended" },
  {
    name: "text-wrap: balance",
    pattern: /text-wrap:\s*balance/gi,
    kind: "safe-drop",
    tier: "recommended",
  },
  { name: "field-sizing", pattern: /field-sizing\b/gi, kind: "safe-drop", tier: "recommended" },
  { name: ":has()", pattern: /:has\(/gi, kind: "structural", tier: "recommended" },
  {
    name: "@container queries",
    pattern: /@container\b/gi,
    kind: "structural",
    tier: "recommended",
  },
  { name: "subgrid", pattern: /subgrid/gi, kind: "structural", tier: "recommended" },
  {
    name: "anchor positioning",
    pattern: /(?:position-anchor|position-area|anchor-name|anchor-size)\b/gi,
    kind: "safe-drop",
    tier: "optional",
  },
  /* Two capabilities that fail differently, so they are tracked separately —
     but both are structural.

     The attribute selector matches whether or not the engine implements
     Popover, and without it the UA neither hides nor promotes the element, so
     an ungated reset restyles a panel nothing will ever hide. The pattern
     covers a value too ([popover="manual"], [popovertargetaction="hide"]),
     which is the form real code reaches for, without matching an unrelated
     [popover-foo].

     :popover-open is safe *in a forgiving list* — :is()/:where() discard an
     unknown member and leave the rest — but that is a property of the list,
     not of the pseudo-class: in a plain selector list an unsupported member
     invalidates the whole rule. So it needs a guard or a compat-ok naming the
     forgiving context. */
  {
    name: "popover attribute",
    pattern: /\[\s*popover(?:target(?:action)?)?(?=\s*(?:\]|[~|^$*]?=))[^\]]*\]/gi,
    kind: "structural",
    tier: "optional",
  },
  {
    name: ":popover-open",
    pattern: /:popover-open\b/gi,
    kind: "structural",
    tier: "optional",
  },
];

const JUSTIFIED =
  /(?:progressive|minimal|enhancement|fallback|unsupported|without|retain|degrade|optional|justif|why|browsers)/i;

/*
 * Grandfathered progressive decisions: features used above the Minimal floor
 * with an explicitly documented fallback (see the cited source comments).
 * Any use outside these files still needs a local why comment. This ledger is
 * the "raising Minimal is an explicit decision" record — extend it in the same
 * commit as the source comment that documents the fallback.
 */
const PROGRESSIVE = {
  "src/css/components/join.css": [":has()"],
  "src/css/effects/aura.css": [":has()"],
  "src/css/components/modal.css": [":has()"],
  "src/css/forms/choice-card.css": [":has()"],
  "src/css/forms/choice.css": [":has()"],
  "src/css/layout/grid.css": ["@container queries"],
  "src/css/layout/container-query.css": ["@container queries"],
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

/* An explicit pragma on the rule's own comment. Unlike prose, it cannot be
   tripped by a comment that merely discusses the capability. */
function hasPragma(css, index) {
  const lineStart = css.lastIndexOf("\n", index - 1) + 1;
  const ruleStart = css.lastIndexOf("}", lineStart - 1) + 1;
  return /compat-ok:/i.test(css.slice(ruleStart, lineStart));
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

function splitSelectorList(prelude) {
  const selectors = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = 0; index < prelude.length; index++) {
    const char = prelude[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(" || char === "[") depth++;
    else if (char === ")" || char === "]") depth--;
    else if (char === "," && depth === 0) {
      selectors.push(prelude.slice(start, index).trim());
      start = index + 1;
    }
  }

  selectors.push(prelude.slice(start).trim());
  return selectors.filter(Boolean);
}

function vendorSignature(selector) {
  const prefixes = new Set(
    [...selector.matchAll(/::-(moz|webkit)-/gi)].map((match) => match[1].toLowerCase()),
  );
  return prefixes.size === 0 ? "standard" : [...prefixes].sort().join("+");
}

export function mixedVendorSelectorLists(css) {
  const violations = [];
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => " ".repeat(comment.length));

  for (const match of withoutComments.matchAll(/([^{}]+)\{/g)) {
    const prelude = match[1].trim();
    if (prelude.startsWith("@") || !prelude.includes("::-")) continue;

    const signatures = new Set(splitSelectorList(prelude).map(vendorSignature));
    const signature = [...signatures].join(", ");
    if (signatures.size === 1 && !signature.includes("+")) continue;

    const selectorOffset = match[1].search(/\S/);
    violations.push({
      line: lineNo(css, match.index + Math.max(selectorOffset, 0)),
      selector: prelude,
    });
  }

  return violations;
}

/*
 * Classify every above-floor capability in one stylesheet. Exported so the
 * guard's own rules can be tested on a CSS string instead of on the tree.
 * `name` only feeds the entry labels and the PROGRESSIVE ledger lookup.
 */
export function auditCss(css, name = "test.css") {
  const violations = [];
  const progressive = [];
  const optional = [];

  // Comments must not trigger feature detection, but indices must stay in
  // sync with the real source so line numbers and justification checks line up.
  const masked = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => " ".repeat(comment.length));
  const guarded = supportsRanges(masked);

  for (const feature of FEATURES) {
    const grandfathered = (PROGRESSIVE[name] ?? []).includes(feature.name);
    for (const m of masked.matchAll(feature.pattern)) {
      const entry = `${name}:${lineNo(css, m.index)}  ${feature.name}`;
      // Excuse on kind and guarding only. Tier then decides which bucket an
      // excused use is reported in, so "optional" can no longer wave through
      // an unguarded structural rule.
      const excused =
        feature.kind === "safe-drop" ||
        isGuarded(m.index, guarded) ||
        grandfathered ||
        (feature.tier === "optional" ? hasPragma(css, m.index) : isJustified(css, m.index));
      if (!excused) violations.push(entry);
      else if (feature.tier === "optional") optional.push(entry);
      else progressive.push(entry);
    }
  }

  return { violations, progressive, optional };
}

function main() {
  const files = walkCss(SRC);
  const violations = [];
  const progressive = [];
  const optional = [];
  const vendorViolations = [];

  for (const file of files) {
    const css = readFileSync(file, "utf8");
    vendorViolations.push(
      ...mixedVendorSelectorLists(css).map(
        ({ line, selector }) => `${rel(file)}:${line}  mixed vendor pseudo-elements: ${selector}`,
      ),
    );

    const audit = auditCss(css, rel(file));
    violations.push(...audit.violations);
    progressive.push(...audit.progressive);
    optional.push(...audit.optional);
  }

  console.log("CSS compatibility audit");
  console.log("────────────────────────────────────────────");
  console.log("Minimal floor: Firefox 98 / Safari 15.4 / Chromium 99");
  console.log(`Progressive/safe-drop: ${progressive.length}`);
  console.log(`Optional enhancements: ${optional.length}`);
  console.log(`Unguarded structural above floor: ${violations.length}`);
  for (const line of violations) console.log(`  ✗ ${line}`);
  console.log(`Mixed vendor selector lists: ${vendorViolations.length}`);
  for (const line of vendorViolations) console.log(`  ✗ ${line}`);

  if (violations.length > 0 || vendorViolations.length > 0) {
    console.error("\ncheck:compat failed — structural capabilities need a guarded fallback, and");
    console.error("selector lists must not mix browser-specific pseudo-elements.");
    process.exit(1);
  }
  console.log("\ncheck:compat passed.");
}

function lineNo(css, index) {
  return css.slice(0, index).split("\n").length;
}

if (import.meta.main) main();
