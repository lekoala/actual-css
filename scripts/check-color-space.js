/*
 * Color interpolation space contract. Run with bun run check:color-space.
 *
 * The rule:
 *
 *   When an intent is tinted against a theme-controlled surface or border,
 *   interpolate in oklab.
 *
 * Not because rectangular interpolation preserves hue better — measured across
 * the shipped presets it is a few degrees worse, because a browser treats hue
 * as powerless below a small chroma epsilon and a polar mix therefore snaps
 * cleanly onto the intent. The reason is continuity. A theme owns --surface and
 * --border, and it may move them anywhere from achromatic to vivid. Under polar
 * interpolation that range contains a cliff: cross the epsilon and the same mix
 * jumps into another color family (154 degrees, measured — a blue tint landing
 * in the greens). Cartesian interpolation responds smoothly across the whole
 * range a public token allows, which is the property a themeable framework
 * needs. The present cost is imperceptible: the largest difference this rule
 * introduces in any shipped preset is 3/255 on one channel.
 *
 * Scope is deliberately narrow — intent × contextual surface/border, the pair
 * the audit actually found. Polar interpolation of two chromatic colors stays
 * legitimate elsewhere (sweeping a gradient through hues, blending two accents
 * to build a ramp); this check does not forbid it. Where a contextual mix wants
 * polar interpolation on purpose, mark it:
 *
 *   /* intentional-oklch: reason *\/
 *   background: color-mix(in oklch, var(--surface) 80%, var(--primary));
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src/css");

/* Theme-controlled contextual colors: a theme may make any of these chromatic. */
const CONTEXT = new Set([
  "--surface",
  "--surface-raised",
  "--surface-subtle",
  "--surface-solid",
  "--border",
]);

/* Semantic intent colors, including the relay components read. */
const INTENT = new Set([
  "--intent",
  "--primary",
  "--secondary",
  "--success",
  "--warning",
  "--danger",
  "--neutral",
]);

const ESCAPE = /intentional-oklch/;

const cssFiles = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? cssFiles(path) : path.endsWith(".css") ? [path] : [];
  });

/* Split on top-level commas so var(--x, fallback) stays one operand. */
const splitTopLevel = (body) => {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of body) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
};

/* Every custom property an operand can resolve to, fallbacks included. */
const referenced = (operand) =>
  Array.from(operand.matchAll(/var\(\s*(--[\w-]+)/g), (match) => match[1]);

const has = (operand, family) => referenced(operand).some((name) => family.has(name));

/* Balanced-paren scan so multi-line calls come out whole. */
const polarCalls = (source) => {
  const found = [];
  for (let i = source.indexOf("color-mix("); i !== -1; i = source.indexOf("color-mix(", i + 1)) {
    let depth = 0;
    let end = i + "color-mix".length;
    for (; end < source.length; end += 1) {
      if (source[end] === "(") depth += 1;
      else if (source[end] === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const call = source.slice(i, end + 1).replace(/\s+/g, " ");
    if (!/^color-mix\(\s*in\s+oklch\s*,/i.test(call)) continue;
    const body = call.replace(/^color-mix\(\s*in\s+oklch\s*,\s*/i, "").replace(/\)$/, "");
    const operands = splitTopLevel(body).map((part) =>
      part
        .trim()
        .replace(/\s+(-?[\d.]+%|calc\(.*\)|var\(--[\w-]*mix[\w-]*\))$/, "")
        .trim(),
    );
    found.push({ line: source.slice(0, i).split("\n").length, operands });
  }
  return found;
};

/* A contextual tint: one operand is a theme surface/border, another an intent. */
const isContextualTint = (operands) =>
  operands.some((operand) => has(operand, CONTEXT)) &&
  operands.some((operand) => has(operand, INTENT));

const violations = [];
let inspected = 0;

for (const file of cssFiles(SRC)) {
  const raw = readFileSync(file, "utf8");
  const exempt = new Set(
    raw.split("\n").flatMap((line, index) => (ESCAPE.test(line) ? [index + 1] : [])),
  );
  // Comments can quote color-mix() prose, so blank them out rather than remove
  // them: keeping their newlines means reported line numbers match the file.
  const source = raw.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));

  for (const call of polarCalls(source)) {
    inspected += 1;
    if (!isContextualTint(call.operands)) continue;
    // The marker sits on the declaration or just above it.
    if (exempt.has(call.line) || exempt.has(call.line - 1) || exempt.has(call.line - 2)) continue;
    violations.push({ file: relative(ROOT, file), ...call });
  }
}

if (violations.length > 0) {
  console.error("check:color-space failed.");
  console.error("Intent tinted against a theme surface or border must interpolate in oklab:");
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line}`);
    console.error(`    ${violation.operands.join("  ×  ")}`);
  }
  console.error("Mark a deliberate exception with a /* intentional-oklch: reason */ comment.");
  process.exit(1);
}

console.log(`Color space check passed (${inspected} polar color-mix calls inspected).`);
