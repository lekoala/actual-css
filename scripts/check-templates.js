import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TEMPLATES_DIR = join(ROOT, "demo", "templates");
const SITES_DIR = join(ROOT, "demo", "sites");

function countBraces(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const open = (stripped.match(/{/g) ?? []).length;
  const close = (stripped.match(/}/g) ?? []).length;
  return { open, close };
}

function collectHtml(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtml(path));
    } else if (entry.name.endsWith(".html")) {
      files.push(path);
    }
  }
  return files;
}

/*
 * A committed demo page must load every local href/src from a git-tracked
 * file. An untracked asset exists after a local build but 404s from a fresh
 * checkout and from GitHub Pages — the demo/assets/ theme bundle used to be
 * exactly that.
 */
function trackedFiles() {
  const output = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
  return new Set(output.split(/\r?\n/).filter(Boolean));
}

function checkAssets(source, file, tracked) {
  const issues = [];
  for (const [, attr, url] of source.matchAll(/\b(href|src)="([^"]+)"/g)) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?|\/)/i.test(url)) continue;
    const target = resolve(dirname(file), url.split(/[?#]/)[0]);
    if (!existsSync(target)) {
      issues.push(`${attr}="${url}" does not exist`);
      continue;
    }
    const trackedPath = relative(ROOT, target).replaceAll(sep, "/");
    if (!tracked.has(trackedPath)) {
      issues.push(
        `${attr}="${url}" (${trackedPath}) is not tracked by git — 404 from a clean checkout`,
      );
    }
  }
  return issues;
}

function checkFile(file, tracked) {
  const source = readFileSync(file, "utf8");
  const issues = [];

  for (const [, block] of source.matchAll(/<style>([\s\S]*?)<\/style>/g)) {
    const { open, close } = countBraces(block);
    if (open !== close) {
      issues.push(`unbalanced braces in <style> (open: ${open}, close: ${close})`);
    }
  }
  issues.push(...checkAssets(source, file, tracked));

  return issues;
}

function main() {
  const files = [...collectHtml(TEMPLATES_DIR), ...collectHtml(SITES_DIR)];
  const tracked = trackedFiles();
  let failed = false;

  for (const file of files) {
    const issues = checkFile(file, tracked);
    if (issues.length > 0) {
      failed = true;
      console.error(`${relative(ROOT, file).replaceAll(sep, "/")}:`);
      for (const issue of issues) {
        console.error(`  ${issue}`);
      }
    }
  }

  if (failed) {
    console.error("Demo integrity check failed.");
    process.exit(1);
  }

  console.log(`Demo integrity check passed (${files.length} files).`);
}

main();
