import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DOC_ROOTS = ["README.md", "llms.txt", "docs"];

async function markdownFiles(path) {
  const fullPath = join(ROOT, path);
  const statEntries = await readdir(fullPath, { withFileTypes: true }).catch(() => null);

  if (!statEntries) {
    return extname(fullPath) === ".md" || fullPath.endsWith("llms.txt") ? [fullPath] : [];
  }

  const files = [];
  for (const entry of statEntries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...await markdownFiles(child));
    } else if (entry.name.endsWith(".md")) {
      files.push(join(ROOT, child));
    }
  }
  return files;
}

function isExternal(href) {
  return /^(?:[a-z]+:)?\/\//iu.test(href) || /^(?:mailto|tel):/iu.test(href);
}

function linkTarget(file, href) {
  const [target] = href.split("#");
  if (!target || isExternal(target)) return null;
  return resolve(dirname(file), decodeURI(target));
}

async function main() {
  const files = (await Promise.all(DOC_ROOTS.map(markdownFiles))).flat();
  const failures = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = match[1];
      const target = linkTarget(file, href);
      if (!target) continue;
      if (!target.startsWith(ROOT) || !existsSync(target)) {
        failures.push(`${normalize(file).replace(normalize(ROOT), ".")}: ${href}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("Documentation link check failed.");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`Documentation link check passed (${files.length} files).`);
}

main();
