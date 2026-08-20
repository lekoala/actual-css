import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSS_FILE = join(ROOT, "dist", "actual.full.css");

const RESERVED = new Set(
  JSON.parse(readFileSync(join(__dirname, "reserved-classes.json"), "utf8")),
);

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function selectorPreludes(css) {
  const preludes = [];
  let start = 0;

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    if (char === "{") {
      const prelude = css.slice(start, i).trim();
      if (prelude && !prelude.startsWith("@")) {
        preludes.push(prelude);
      }
      start = i + 1;
    } else if (char === "}") {
      start = i + 1;
    }
  }

  return preludes;
}

function classesFromSelectors(css) {
  const classes = new Set();

  for (const prelude of selectorPreludes(stripComments(css))) {
    for (const match of prelude.matchAll(/\.([A-Za-z_-][A-Za-z0-9_-]*)/g)) {
      classes.add(match[1]);
    }
  }

  return classes;
}

async function main() {
  const css = await readFile(CSS_FILE, "utf8");
  const classes = classesFromSelectors(css);
  const unexpected = [...classes].filter((name) => !RESERVED.has(name)).sort();
  const stale = [...RESERVED].filter((name) => !classes.has(name)).sort();

  if (unexpected.length > 0) {
    console.error("Reserved class check failed.");
    console.error(`Unexpected classes: ${unexpected.join(", ")}`);
    process.exit(1);
  }

  console.log(`Reserved class check passed (${classes.size} classes).`);

  if (stale.length > 0) {
    console.log(`Reserved but not emitted: ${stale.join(", ")}`);
  }
}

main();
