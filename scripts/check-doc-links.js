import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DOC_ROOTS = ["README.md", "llms.txt", "docs"];

function relativePath(file) {
  return normalize(file).replace(normalize(ROOT), ".");
}

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

function exportTarget(specifier, packageJson) {
  const subpath = specifier === packageJson.name
    ? "."
    : `.${specifier.slice(packageJson.name.length)}`;
  const entries = Object.entries(packageJson.exports);
  const exact = entries.find(([key]) => key === subpath);
  if (exact) return exact[1];

  const patterns = entries
    .filter(([key]) => key.includes("*"))
    .sort(([a], [b]) => b.replace("*", "").length - a.replace("*", "").length);

  for (const [key, target] of patterns) {
    const [prefix, suffix] = key.split("*");
    if (!subpath.startsWith(prefix) || !subpath.endsWith(suffix)) continue;
    if (target == null) return null;

    const wildcard = subpath.slice(prefix.length, subpath.length - suffix.length);
    return target.replace("*", wildcard);
  }

  return null;
}

async function main() {
  const files = (await Promise.all(DOC_ROOTS.map(markdownFiles))).flat();
  const packageJson = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
  const packagePattern = new RegExp(
    `${packageJson.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:/[A-Za-z0-9._-]+)*`,
    "g",
  );
  const failures = [];
  const entrypoints = new Set();

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = match[1];
      const target = linkTarget(file, href);
      if (!target) continue;
      if (!target.startsWith(ROOT) || !existsSync(target)) {
        failures.push(`${relativePath(file)}: ${href}`);
      }
    }

    for (const match of source.matchAll(packagePattern)) {
      const specifier = match[0];
      entrypoints.add(specifier);
      const target = exportTarget(specifier, packageJson);
      if (typeof target !== "string" || !existsSync(resolve(ROOT, target))) {
        failures.push(`${relativePath(file)}: unsupported package entrypoint ${specifier}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("Documentation link check failed.");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(
    `Documentation link check passed (${files.length} files, ${entrypoints.size} package entrypoints).`,
  );
}

main();
