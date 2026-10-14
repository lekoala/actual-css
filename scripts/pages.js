/*
 * GitHub Pages publication. The published site is a slice of the repository
 * tree, so relative links between the docs site, the demos and the framework
 * files keep working unchanged. This module is the single list of that slice:
 * check:templates asks it whether a demo link will be published, and
 * build:pages stages it into out/pages/ for the CI deploy job.
 *
 *   bun run build:pages    stage, then verify every local link in the stage
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const ROOT = join(import.meta.dirname, "..");
export const STAGE = join(ROOT, "out", "pages");

/* What the site serves: tracked files under these paths... */
const PUBLISHED = ["index.html", "demo", "src/css", "scripts/docs/assets"];

/* ...plus these build outputs, which are git-ignored and exist only after
   build:all. A page may link them; Pages gets them from the CI build. */
const GENERATED = ["dist", "site", "demo/assets/actual-themes.min.css"];

const toPosix = (path) => path.replaceAll(sep, "/");

function walk(path) {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => walk(join(path, name)));
}

/* Repo-relative paths of every file Pages publishes from the current tree. */
export function publishedFiles() {
  const tracked = execFileSync("git", ["ls-files", "-z", "--", ...PUBLISHED], {
    cwd: ROOT,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
  const generated = GENERATED.flatMap((path) => walk(join(ROOT, path))).map((file) =>
    toPosix(relative(ROOT, file)),
  );
  return new Set([...tracked, ...generated]);
}

/* Local href/src targets of an HTML file, resolved against its directory. */
export function localLinks(file) {
  const html = readFileSync(file, "utf8");
  const links = [];
  for (const [, attr, url] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?|\/)/i.test(url)) continue;
    links.push({ attr, url, target: resolve(dirname(file), url.split(/[?#]/)[0]) });
  }
  return links;
}

function stage() {
  rmSync(STAGE, { recursive: true, force: true });
  for (const file of publishedFiles()) {
    cpSync(join(ROOT, file), join(STAGE, file));
  }

  const broken = [];
  const pages = walk(STAGE).filter((file) => file.endsWith(".html"));
  for (const page of pages) {
    for (const { attr, url, target } of localLinks(page)) {
      if (!existsSync(target)) broken.push(`${toPosix(relative(STAGE, page))}: ${attr}="${url}"`);
    }
  }

  if (broken.length > 0) {
    console.error(`Pages stage has broken local links:\n  ${broken.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`Pages staged in out/pages/ (${pages.length} pages, links verified).`);
}

if (import.meta.main) stage();
