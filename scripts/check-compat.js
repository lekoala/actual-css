/*
 * Capability floor audit. Run with bun run check:compat.
 *
 * Answers: which capabilities above the CSS floor are used on a path that does
 * not degrade? Two kinds of above-floor use are acceptable:
 *
 *   - safe-drop: an unknown declaration/value is ignored and the previous
 *     declaration or default wins — the component keeps working, only an
 *     enhancement is lost. No gate required.
 *   - structural: the rule changes which elements get styles or how a layout
 *     behaves. Must be inside @supports (or have a comment on the preceding
 *     lines explaining why the fallback keeps the base functional).
 *
 * Violations fail the pipeline. Tier controls how a use is *reported*, not
 * whether it needs a gate: kind says what happens on an engine that lacks the
 * capability, and only kind can excuse a use.
 *
 * The floor here is the Degraded tier, not Minimal. Minimal is the JavaScript
 * baseline; a Degraded browser runs no supported runtime but still receives
 * every stylesheet, so CSS owes its fallbacks that far down. Raising Minimal
 * therefore does not turn a CSS capability into baseline — it only moves the
 * tier label a capability is reported under.
 *
 * Tier says which Actual tier first guarantees the capability: "minimal" is
 * lost only on Degraded, "recommended" is lost across part of Minimal too, and
 * "optional" is guaranteed by no tier — either because it lands above
 * Recommended on some engine, or because it is capability-shaped rather than
 * version-shaped.
 *
 * If an optional structural capability ever returns to this table, it needs a
 * machine-checkable escape hatch rather than a prose one: a comment explaining
 * why a capability needs a gate reads, to a keyword matcher, exactly like a
 * comment excusing its absence, so isJustified() would wave through a rule
 * whose @supports had been deleted. The removed form was a "compat-ok:" pragma
 * on the rule's own comment; reinstate that, not a wider keyword list.
 *
 * CSS floor (Degraded): Firefox 78 / Safari 14 / Chromium 88.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");

const FEATURES = [
  { name: "color-mix()", pattern: /color-mix\(/gi, kind: "safe-drop", tier: "minimal" },
  {
    name: "oklch()/oklab()",
    pattern: /\bokl(?:ch|ab)\(/gi,
    kind: "safe-drop",
    tier: "minimal",
  },
  {
    name: "dvh/svh/lvh units",
    pattern: /\b(?:d|l|s)vh\b/gi,
    kind: "safe-drop",
    tier: "minimal",
  },
  /* Scrollbar styling lands in Chromium 121 and Safari 18.2, so it is above
     Recommended on WebKit and belongs to no tier. An engine that knows none of
     the three draws its native scrollbar, which is the intended fallback. */
  {
    name: "scrollbar-gutter",
    pattern: /scrollbar-gutter\b/gi,
    kind: "safe-drop",
    tier: "optional",
  },
  {
    name: "scrollbar-width",
    pattern: /scrollbar-width\b/gi,
    kind: "safe-drop",
    tier: "optional",
  },
  {
    name: "scrollbar-color",
    pattern: /scrollbar-color\b/gi,
    kind: "safe-drop",
    tier: "optional",
  },
  { name: "light-dark()", pattern: /light-dark\(/gi, kind: "safe-drop", tier: "recommended" },
  {
    name: "text-wrap: balance",
    pattern: /text-wrap:\s*balance/gi,
    kind: "safe-drop",
    tier: "recommended",
  },
  { name: "field-sizing", pattern: /field-sizing\b/gi, kind: "safe-drop", tier: "recommended" },
  /* :has() and @container are guaranteed from Minimal up, so a Minimal browser
     never needs their fallbacks — Degraded does, which is why they stay
     tracked as structural rather than being dropped when Minimal rose. */
  { name: ":has()", pattern: /:has\(/gi, kind: "structural", tier: "minimal" },
  {
    name: "@container queries",
    pattern: /@container\b/gi,
    kind: "structural",
    tier: "minimal",
  },
  /* Subgrid is Chromium 117 — one version above Minimal's Chromium 116, which
     is why it is not "minimal" alongside the two above. */
  { name: "subgrid", pattern: /subgrid/gi, kind: "structural", tier: "recommended" },
  {
    name: "anchor positioning",
    pattern: /(?:position-anchor|position-area|anchor-name|anchor-size)\b/gi,
    kind: "safe-drop",
    tier: "optional",
  },
];

const JUSTIFIED =
  /(?:progressive|minimal|enhancement|fallback|unsupported|without|retain|degrade|optional|justif|why|browsers)/i;

/*
 * Grandfathered progressive decisions: features used above the CSS floor with
 * an explicitly documented fallback (see the cited source comments). Any use
 * outside these files still needs a local why comment. This ledger is the
 * "degrading below the floor is an explicit decision" record — extend it in
 * the same commit as the source comment that documents the fallback.
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
      // Excuse on kind and guarding only; tier then decides which bucket an
      // excused use is reported in.
      const excused =
        feature.kind === "safe-drop" ||
        isGuarded(m.index, guarded) ||
        grandfathered ||
        isJustified(css, m.index);
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
  console.log("CSS floor (Degraded): Firefox 78 / Safari 14 / Chromium 88");
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
