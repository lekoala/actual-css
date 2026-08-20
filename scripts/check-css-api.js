/*
 * CSS API contract check. Run with bun run check:css-api.
 *
 * Each component file may declare three header sections that classify its
 * custom properties:
 *
 *   - "Public hooks:"    — author-facing customization points (a real
 *     contract: every listed hook must be referenced by the file, and each
 *     listed once).
 *   - "Framework plumbing:" — shared relays consumed across components
 *     (--ui-*, --intent*, --density-*). Classified once at framework level,
 *     not repeated in every file.
 *   - "Internal:"        — properties derived from hooks, owned by
 *     state/variant rules, or written by JavaScript.
 *
 * The framework-plumbing families are also recognized by prefix so a shared
 * relay can never drift into an unclassified state without an explicit header
 * entry: /^--ui-/, /^--density-/, /^--intent(?:-|$)/.
 *
 * Every custom property used ONLY in a fallback position (var(--x, default))
 * and never declared anywhere must have at least one classification. These are
 * unset extension points; leaving one unclassified means nobody owns the
 * contract, so the check fails. This deliberately does NOT force an artificial
 * declaration — a fallback-only hook like --btn-gap is intentional.
 *
 * In audit mode (--audit) it lists declared-but-unclassified component-prefixed
 * properties (declare public or internal), and prints the fallback-only
 * inventory grouped by classification.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src", "css");
const PAGES = join(ROOT, "docs", "pages");

const audit = process.argv.includes("--audit");

/* Shared variant/intent/density relays are framework plumbing by prefix, so a
   fallback-only use of one can never be "unclassified" without an explicit
   header entry. Kept as prefixes, not startsWith("--intent"), so --intent-fg
   matches but a hypothetical --intentions-x would not. */
const PLUMBING_PREFIXES = [/^--ui-/, /^--density-/, /^--intent(?:-|$)/];

function walkCss(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkCss(full));
    else if (entry.name.endsWith(".css")) files.push(full);
  }
  return files;
}

/* { public, internal, plumbing } from every "Public hooks:" / "Framework
   plumbing:" / "Internal:" block in the file. A section ends at the next
   label-like line ("Child contract:", "Intent boundary —" is not label-like
   because it has no trailing colon, but "JS target contract:" is). */
function parseHookSections(css) {
  const sections = { public: [], internal: [], plumbing: [] };
  for (const block of css.matchAll(/\/\*[\s\S]*?\*\//g)) {
    let active = null;
    for (const rawLine of block[0].split("\n")) {
      const line = rawLine.trim().replace(/^\*\s?/, "").trim();
      if (/^Public hooks:$/.test(line)) {
        active = "public";
        continue;
      }
      if (/^Framework plumbing:$/.test(line)) {
        active = "plumbing";
        continue;
      }
      if (/^Internal:$/.test(line)) {
        active = "internal";
        continue;
      }
      if (active && /^[A-Za-z][A-Za-z -]*:$/.test(line)) {
        active = null; // next section (e.g. "Child contract:")
        continue;
      }
      if (active) {
        const hook = line.match(/--[a-z0-9-]+/);
        if (hook) sections[active].push(hook[0]);
      }
    }
  }
  return sections;
}

function declaredProps(css) {
  return new Set([...css.matchAll(/(?<![-\w])(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));
}

function fallbackOnlyUses(css) {
  /* First argument of any var(): catches nested fallbacks too (e.g.
     var(--ui-bg, var(--btn-default-bg, …))), not just the outermost var. */
  return [...css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*,/gi)].map((m) => m[1]);
}

function rel(file) {
  return relative(ROOT, file).replaceAll(sep, "/");
}

/* Path-segment helpers so both the real src tree and fixture roots (e.g.
   tests/fixtures/css-api/*) classify the same way. */
function pathSegments(relPath) {
  return relPath.split("/");
}

function isThemeFile(relPath) {
  return pathSegments(relPath).includes("themes");
}

const CORE_CATALOGUE = new Set([
  "src/css/core/tokens.css",
  "src/css/core/theme.css",
  "src/css/core/variants.css",
  "src/css/utilities/base.css",
  "src/css/core/intents.css",
  "src/css/core/focus.css",
]);

function isCataloguePath(relPath) {
  return isThemeFile(relPath) || CORE_CATALOGUE.has(relPath);
}

/* Resolve a property's single best classification across every file's
   headers, then the framework-plumbing prefixes. */
function classify(hooksByFile, prop) {
  for (const [, s] of hooksByFile) {
    if (s.public.includes(prop)) return "Public hooks";
    if (s.internal.includes(prop)) return "Internal";
    if (s.plumbing.includes(prop)) return "Framework plumbing";
  }
  if (PLUMBING_PREFIXES.some((re) => re.test(prop))) return "Framework plumbing";
  return null;
}

/* Analyze every CSS file under `root`. Theme files never satisfy a core
   contract: they are excluded from global declarations, from the fallback-only
   scan, and from the classifications consulted to satisfy the fallback-only
   guard. A property consumed by the core must be classified in the core even
   if a demo theme also defines or classifies it. */
export function analyzeCss(root) {
  const issues = [];
  const unclassified = [];
  const hooksByFile = new Map();

  /* Per-file data (reused for both the header contract and the global
     fallback-only inventory). */
  const declaredGlobal = new Set();
  const files = walkCss(root);
  const coreFiles = files.filter((file) => !isThemeFile(rel(file)));

  for (const file of files) {
    const relPath = rel(file);
    const css = readFileSync(file, "utf8");
    const sections = parseHookSections(css);
    const { public: hooks, internal, plumbing } = sections;
    hooksByFile.set(file, sections);

    if (!isThemeFile(relPath)) {
      for (const prop of declaredProps(css)) declaredGlobal.add(prop);
    }

    for (const hook of hooks) {
      const referenced = new RegExp(`var\\(\\s*${hook}|${hook}\\s*:`).test(css);
      if (!referenced) {
        issues.push(`${rel(file)}: Public hooks lists ${hook} but the file never references it`);
      }
    }
    const seen = new Set();
    for (const hook of hooks) {
      if (seen.has(hook)) {
        issues.push(`${rel(file)}: hook ${hook} listed more than once`);
      }
      seen.add(hook);
    }

    if (audit) {
      if (!isCataloguePath(relPath)) {
        const classified = new Set([...hooks, ...internal, ...plumbing]);
        for (const prop of declaredProps(css)) {
          if (classified.has(prop)) continue;
          if (PLUMBING_PREFIXES.some((re) => re.test(prop))) continue; // shared relay, not authored
          unclassified.push(`${relPath}: ${prop}`);
        }
      }
    }
  }

  /* Fallback-only guard: every property used only in a fallback position and
     never declared must be classified somewhere in the core. Scanned after
     declaredGlobal is complete so a prop declared in any non-theme file is
     never mistaken for fallback-only. Theme files are excluded entirely: a
     theme-private fallback must not fail the core, and a theme classification
     must not satisfy it. */
  const coreHooksByFile = new Map(
    [...hooksByFile].filter(([file]) => !isThemeFile(rel(file)))
  );
  const fallbackUses = new Map(); // prop -> { file: n }
  for (const file of coreFiles) {
    const css = readFileSync(file, "utf8");
    for (const use of fallbackOnlyUses(css)) {
      if (declaredGlobal.has(use)) continue;
      const entry = fallbackUses.get(use) ?? new Map();
      entry.set(file, (entry.get(file) ?? 0) + 1);
      fallbackUses.set(use, entry);
    }
  }

  const categoryCounts = { "Public hooks": 0, "Framework plumbing": 0, Internal: 0, Unclassified: 0 };
  const unclassifiedFallback = [];
  for (const [prop, files] of fallbackUses) {
    const cat = classify(coreHooksByFile, prop);
    categoryCounts[cat ?? "Unclassified"] += 1;
    if (!cat) {
      unclassifiedFallback.push(`${prop} (${[...files.keys()].map(rel).join(", ")})`);
    }
  }

  if (unclassifiedFallback.length > 0) {
    issues.push(
      `Unclassified fallback-only custom properties (declare as public, framework plumbing, or internal):`
    );
    for (const line of unclassifiedFallback) issues.push(`- ${line}`);
  }

  return { issues, unclassified, categoryCounts, fileCount: files.length };
}

function main() {
  const { issues, unclassified, categoryCounts, fileCount } = analyzeCss(SRC);

  console.log("Fallback-only custom properties:");
  for (const [cat, n] of Object.entries(categoryCounts)) {
    console.log(`  ${cat}: ${n}`);
  }

  if (issues.length > 0) {
    console.error("check:css-api failed.");
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }

  console.log(`CSS API check passed (${fileCount} CSS files checked).`);
  if (audit) {
    console.log(`\nUnclassified component-prefixed properties (declare public or internal):`);
    for (const line of unclassified) console.log(`  ${line}`);
  }
}

if (import.meta.main) main();
