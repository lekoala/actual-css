/*
 * CSS architecture guard. Run with `bun run check:architecture`.
 *
 * The v0.4 module contract:
 *   - actual.css is the minimal core: it imports only ./core/index.css.
 *   - actual.full.css is the exact ordered list of every shipped family.
 *   - Leaf modules never import; only family manifests (index.css,
 *     forms/base.css) and root entrypoints import, and a family manifest only
 *     imports within its own directory.
 *   - No file or directory named optional may exist under src/css.
 *   - Every distributed leaf appears exactly once in the actual.full.css graph.
 *   - core/print.css stays generic: no class or id selectors.
 *
 * The analyzer is exported so tests can run it against fixture trees.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * An @import in a leaf is a contract violation in any syntax — layer(),
 * supports(), or media modifiers included — so leaves are checked with a
 * detector, not a parser. Only manifests and root entrypoints need the
 * specifier, so those go through parseImports.
 */
const IMPORT_DETECT_RE = /^\s*@import\b/m;
const IMPORT_RE = /^\s*@import\s+(?:url\(\s*)?["']([^"')]+)["']/;

function isManifest(rel) {
  return rel.endsWith("/index.css") || rel === "forms/base.css";
}

const FAMILIES = ["core", "layout", "typography", "forms", "components", "effects", "utilities"];
const ROOT_ENTRYPOINTS = new Set(["actual.css", "actual.full.css", "actual.layer.css"]);

const FULL_ENTRYPOINTS = [
  "./actual.css",
  "./typography/index.css",
  "./layout/index.css",
  "./forms/index.css",
  "./components/index.css",
  "./effects/index.css",
  "./utilities/index.css",
];

function walkCss(root) {
  const files = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(full);
      } else if (entry.name.endsWith(".css")) {
        files.push(full);
      }
    }
  };
  visit(root);
  return files;
}

function parseImports(abs) {
  const css = readFileSync(abs, "utf8");
  return css
    .split(/\r?\n/)
    .map((line) => line.match(IMPORT_RE)?.[1])
    .filter(Boolean);
}

function importTarget(file, spec) {
  return resolve(dirname(file), spec);
}

/* Recursive import graph from an entry file, counting occurrences. */
function buildGraph(entry, counts = new Map(), stack = []) {
  if (stack.includes(entry)) {
    throw new Error(`circular import: ${[...stack, entry].join(" -> ")}`);
  }
  counts.set(entry, (counts.get(entry) ?? 0) + 1);
  for (const spec of parseImports(entry)) {
    buildGraph(importTarget(entry, spec), counts, [...stack, entry]);
  }
  return counts;
}

/* Selector preludes only — rule bodies are skipped so property values like
 * #fff never look like selectors. */
function selectorPreludes(css) {
  const preludes = [];
  let start = 0;
  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    if (char === "{") {
      const prelude = css.slice(start, i).trim();
      if (prelude && !prelude.startsWith("@")) preludes.push(prelude);
      start = i + 1;
    } else if (char === "}") {
      start = i + 1;
    }
  }
  return preludes;
}

export function analyzeCss(root) {
  const issues = [];
  const files = walkCss(root);
  const relPath = (abs) => relative(root, abs).split(sep).join("/");
  const byRel = new Map(files.map((file) => [relPath(file), file]));

  const hasOptional = files.some((file) => relPath(file).split("/").includes("optional"));
  if (hasOptional) {
    issues.push("a file under optional/ exists — the optional family no longer exists");
  }
  const optionalDir = join(root, "optional");
  if (existsSync(optionalDir)) {
    issues.push("src/css/optional exists — the optional family no longer exists");
  }

  const actualCss = byRel.get("actual.css");
  const fullCss = byRel.get("actual.full.css");

  if (actualCss) {
    const imports = parseImports(actualCss);
    if (imports.length !== 1 || imports[0] !== "./core/index.css") {
      issues.push("actual.css must import only ./core/index.css");
    }
  } else {
    issues.push("actual.css is missing");
  }

  if (fullCss) {
    const imports = parseImports(fullCss);
    if (JSON.stringify(imports) !== JSON.stringify(FULL_ENTRYPOINTS)) {
      issues.push("actual.full.css must import exactly the ordered family entrypoints");
    }
  } else {
    issues.push("actual.full.css is missing");
  }

  const leaves = files.filter((file) => {
    const rel = relPath(file);
    return FAMILIES.includes(rel.split("/")[0]) && !isManifest(rel);
  });

  for (const leaf of leaves) {
    if (IMPORT_DETECT_RE.test(readFileSync(leaf, "utf8"))) {
      issues.push(`${relPath(leaf)}: leaf modules cannot import`);
    }
  }

  for (const file of files) {
    const rel = relPath(file);
    const family = rel.split("/")[0];
    if (!FAMILIES.includes(family) || !isManifest(rel)) continue;
    for (const spec of parseImports(file)) {
      const targetRel = relPath(importTarget(file, spec));
      const targetFamily = targetRel.split("/")[0];
      if (targetFamily !== family) {
        issues.push(`${rel}: imports outside its directory (${spec})`);
      }
    }
  }

  if (fullCss) {
    let counts;
    try {
      counts = buildGraph(fullCss);
    } catch (error) {
      issues.push(`actual.full.css graph: ${error.message}`);
      counts = new Map();
    }
    for (const leaf of leaves) {
      const count = counts.get(leaf) ?? 0;
      if (count === 0) {
        issues.push(`${relPath(leaf)}: missing from the actual.full.css bundle`);
      } else if (count > 1) {
        issues.push(`${relPath(leaf)}: appears ${count} times in the actual.full.css bundle`);
      }
    }
  }

  const printCss = byRel.get("core/print.css");
  if (printCss) {
    const preludes = selectorPreludes(readFileSync(printCss, "utf8"));
    if (preludes.some((prelude) => /[.#][A-Za-z_-]/.test(prelude))) {
      issues.push("core/print.css contains a class or id selector");
    }
  }

  return { issues, leafCount: leaves.length };
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "css");
  const { issues, leafCount } = analyzeCss(root);
  if (issues.length > 0) {
    console.error("check:architecture failed:");
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }
  console.log(`Architecture check passed (${leafCount} distributed leaves).`);
}

if (import.meta.main) main();