import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadThemes } from "./docs/themes.js";
import { localLinks, publishedFiles } from "./pages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TEMPLATES_DIR = join(ROOT, "demo", "templates");
const SITES_DIR = join(ROOT, "demo", "sites");
const THEME_PICKER = join(ROOT, "demo", "scripts", "theme-picker.js");

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
 * A demo page must load every local href/src from a file GitHub Pages
 * publishes. A file that only exists after some local step 404s on the site —
 * the demo/assets/ theme bundle used to be exactly that. Directory links
 * (a site index) only need to exist.
 */
function checkAssets(file, published) {
  const issues = [];
  for (const { attr, url, target } of localLinks(file)) {
    if (!existsSync(target)) {
      issues.push(`${attr}="${url}" does not exist`);
      continue;
    }
    const path = relative(ROOT, target).replaceAll(sep, "/");
    if (!statSync(target).isDirectory() && !published.has(path)) {
      issues.push(`${attr}="${url}" (${path}) is not published to Pages — see scripts/pages.js`);
    }
  }
  return issues;
}

/*
 * Demo pages used to hand-copy the theme list, and a new theme reached the
 * docs site (derived from the catalogue) while most pages silently lacked it.
 * The list now lives once, in <theme-picker>; a hand-written "Themes" optgroup
 * is a copy creeping back.
 */
function checkThemeCopy(source) {
  return source.includes('<optgroup label="Themes">')
    ? ["hand-copied theme list: use <theme-picker> (demo/scripts/theme-picker.js)"]
    : [];
}

function checkThemePickerList(themeNames) {
  const source = readFileSync(THEME_PICKER, "utf8");
  const list = source.match(/const THEMES = \[([\s\S]*?)\]/)?.[1] ?? "";
  const names = [...list.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  if (names.join() === themeNames.join()) return [];
  return [`THEMES does not match src/css/themes/index.css: expected ${themeNames.join(", ")}`];
}

function checkFile(file, published) {
  const source = readFileSync(file, "utf8");
  const issues = [];

  for (const [, block] of source.matchAll(/<style>([\s\S]*?)<\/style>/g)) {
    const { open, close } = countBraces(block);
    if (open !== close) {
      issues.push(`unbalanced braces in <style> (open: ${open}, close: ${close})`);
    }
  }
  issues.push(...checkAssets(file, published));
  issues.push(...checkThemeCopy(source));

  return issues;
}

function main() {
  const files = [...collectHtml(TEMPLATES_DIR), ...collectHtml(SITES_DIR)];
  const published = publishedFiles();
  const themeNames = loadThemes(ROOT).map((theme) => theme.name);
  const reports = [
    ...files.map((file) => [file, checkFile(file, published)]),
    [THEME_PICKER, checkThemePickerList(themeNames)],
  ];
  let failed = false;

  for (const [file, issues] of reports) {
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
