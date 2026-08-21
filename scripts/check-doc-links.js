import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DOC_ROOTS = ["README.md", "llms.txt", "docs"];
const PAGES = join(ROOT, "docs", "pages");
const SITE = join(ROOT, "site");

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
      files.push(...(await markdownFiles(child)));
    } else if (entry.name.endsWith(".md")) {
      files.push(join(ROOT, child));
    }
  }
  return files;
}

function isExternal(href) {
  return /^(?:[a-z]+:)?\/\//iu.test(href) || /^(?:mailto|tel):/iu.test(href);
}

/*
 * The builder re-roots relative links into the generated site (site/), so links
 * in a docs page are consumed from its site output path, not its markdown
 * source path (docs/pages is one level deeper). Resolve relative links from the
 * site output to match what the built page actually points at; otherwise an
 * off-by-one in a relative link (e.g. after a site relocation) slips past.
 */
function isDocsPage(file) {
  return file.startsWith(PAGES + sep);
}

function siteOutputFor(file) {
  const rel = relative(PAGES, file).replace(/\.md$/, ".html");
  return join(SITE, rel);
}

function linkTarget(file, href) {
  const [rawTarget] = href.split("#");
  if (!rawTarget || isExternal(rawTarget)) return null;
  const target = decodeURI(rawTarget);

  if (!isDocsPage(file)) {
    return resolve(dirname(file), target);
  }

  const base = siteOutputFor(file);
  if (target.endsWith(".md")) {
    const mdTarget = resolve(dirname(file), target);
    if (mdTarget.startsWith(PAGES) && existsSync(mdTarget)) {
      return join(SITE, relative(PAGES, mdTarget).replace(/\.md$/, ".html"));
    }
  }
  return resolve(dirname(base), target);
}

function exportTarget(specifier, packageJson) {
  const subpath =
    specifier === packageJson.name ? "." : `.${specifier.slice(packageJson.name.length)}`;
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

/*
 * The 0.3 -> 0.4 modular-import guide documents the removed optional family by
 * design. A documented removal is not a broken link, so these historical
 * entrypoints are allowed to appear there — and only there, so a legacy path
 * in any other document still fails as unsupported.
 */
const MODULAR_IMPORT_GUIDE = join("docs", "pages", "guides", "modular-import.md");
const REMOVED_ENTRYPOINTS = new Set([
  "actual-css/css/optional",
  "actual-css/css/optional/otp",
  "actual-css/css/optional/floating-field",
  "actual-css/css/optional/chat",
  "actual-css/css/optional/fab",
  "actual-css/css/optional/aura",
  "actual-css/css/optional/scroller",
  "actual-css/css/optional/scroll-snap",
  "actual-css/css/optional/layout-extra",
  "actual-css/css/optional/typography-fluid",
  "actual-css/css/optional/utilities-extra",
  "actual-css/css/actual.full",
  "actual-css/css/grid",
  "actual-css/css/prose",
]);

async function main() {
  const files = (await Promise.all(DOC_ROOTS.map(markdownFiles))).flat();
  const packageJson = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
  const escapedPackageName = packageJson.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const packagePattern = new RegExp(
    `(?<![A-Za-z0-9_./-])${escapedPackageName}(?:/[A-Za-z0-9._-]+)*`,
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
      if (relative(ROOT, file) === MODULAR_IMPORT_GUIDE && REMOVED_ENTRYPOINTS.has(specifier))
        continue;
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
