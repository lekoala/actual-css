/*
 * Docs site builder. Reads docs/navigation.json + docs/pages markdown files,
 * renders pages with Bun's Markdown API, and writes a static site to site/.
 *
 *   bun run build:docs         build once
 *   bun run watch:docs         rebuild on source changes
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  watch,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { render } from "./docs/markdown.js";
import { loadNavigation } from "./docs/navigation.js";
import { buildSearchIndex } from "./docs/search.js";
import { renderHome, renderNavGroups, renderPage } from "./docs/templates.js";
import { loadThemes } from "./docs/themes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAGES = join(ROOT, "docs", "pages");
const SITE = join(ROOT, "site");
const ASSETS = join(SITE, "assets");
const CHROME = join(__dirname, "docs", "assets");
const DIST = join(ROOT, "dist");
const THEMES_SOURCE = join(ROOT, "demo", "assets", "actual-themes.min.css");
const THEMES_BUNDLE = join(ASSETS, "actual-themes.min.css");

// The docs site previews the framework from its source locations: pages link
// src/css/*.css (so CSS edits are visible without a compile step) and the dist
// bundles the site depends on — both committed, so they resolve when the repo
// is served as-is. assets/ holds the generated files the site must carry
// itself: search-index.js and the theme palettes bundle. The site chrome
// (docs.css, docs.js) is edited in scripts/docs/assets/ and referenced in
// place, so site/ never stores a copy.
//
// build-themes.js writes the palettes bundle to demo/assets/, which is
// gitignored as demo build output. A page in site/ must never depend on an
// ignored artifact: served from a fresh clone the link 404s, the theme
// selector still sets data-theme, and no palette answers it. So the bundle is
// copied into site/assets/ and linked from there.
const REQUIRED_ASSETS = [
  { path: join(DIST, "actual.full.js"), command: "bun run build:js" },
  { path: THEMES_SOURCE, command: "bun run build:themes" },
];

function requireAssets() {
  for (const asset of REQUIRED_ASSETS) {
    if (!existsSync(asset.path)) {
      throw new Error(`Missing ${relative(ROOT, asset.path)}. Run ${asset.command} first.`);
    }
  }
}

/* Relative URL from a generated page to any repo path, e.g. "../../../src". */
function repoAsset(fromOutput, target) {
  return relative(dirname(fromOutput), target).replaceAll(sep, "/");
}

/* Site root seen from a page: "../" on a subpage, "" on the homepage. */
function siteRoot(fromOutput) {
  const value = relative(dirname(fromOutput), SITE).replaceAll(sep, "/");
  return value ? `${value}/` : "";
}

function resolveSiteLink(fromFile, href) {
  if (!href.endsWith(".md")) return null;
  const target = resolve(dirname(fromFile), href);
  if (!target.startsWith(PAGES) || !existsSync(target)) return null;

  const from = join(SITE, relative(PAGES, fromFile).replace(/\.md$/, ".html"));
  const to = join(SITE, relative(PAGES, target).replace(/\.md$/, ".html"));
  return relative(dirname(from), to).replaceAll(sep, "/");
}

function renderAllPages(navigation) {
  const rendered = new Map();
  for (const page of navigation.pages) {
    const file = join(PAGES, page.file);
    const markdown = readFileSync(file, "utf8");
    const result = render(markdown, {
      resolveLink: (href) => resolveSiteLink(file, href),
    });
    page.title = result.title;
    page.description = result.description;
    page.toc = result.toc;
    rendered.set(page.file, result);
  }
  return rendered;
}

function writePages(navigation, rendered, themes) {
  for (const page of navigation.pages) {
    const result = rendered.get(page.file);
    const dir = join(SITE, page.groupSlug);
    mkdirSync(dir, { recursive: true });

    const from = join(SITE, page.url);

    const html = renderPage({
      title: page.title,
      description: page.description,
      content: result.html,
      toc: result.toc,
      navGroups: renderNavGroups(navigation, page),
      actualCss: repoAsset(from, join(ROOT, "src", "css", "actual.full.css")),
      themesCss: repoAsset(from, THEMES_BUNDLE),
      docsCss: repoAsset(from, join(CHROME, "docs.css")),
      actualJs: repoAsset(from, join(DIST, "actual.full.js")),
      docsJs: repoAsset(from, join(CHROME, "docs.js")),
      siteRoot: siteRoot(from),
      url: page.url,
      previous: page.previous,
      next: page.next,
      file: page.file,
      themes,
    });

    writeFileSync(join(dir, `${page.slug}.html`), html);
  }
}

function writeHome(navigation, themes) {
  const from = join(SITE, "index.html");
  writeFileSync(
    join(SITE, "index.html"),
    renderHome({
      navigation,
      themes,
      actualCss: repoAsset(from, join(ROOT, "src", "css", "actual.full.css")),
      themesCss: repoAsset(from, THEMES_BUNDLE),
      docsCss: repoAsset(from, join(CHROME, "docs.css")),
      actualJs: repoAsset(from, join(DIST, "actual.full.js")),
      docsJs: repoAsset(from, join(CHROME, "docs.js")),
      siteRoot: siteRoot(from),
    }),
  );
}

function pruneStale(navigation) {
  const groupSlugs = new Set(navigation.groups.map((group) => group.slug));
  const expected = new Set(
    navigation.pages.map((page) => join(page.groupSlug, `${page.slug}.html`)),
  );

  for (const entry of readdirSync(SITE, { withFileTypes: true })) {
    if (entry.name === "assets") continue;

    if (entry.isDirectory()) {
      if (!groupSlugs.has(entry.name)) {
        rmSync(join(SITE, entry.name), { recursive: true, force: true });
        continue;
      }
      for (const file of readdirSync(join(SITE, entry.name))) {
        const path = join(entry.name, file);
        if (file.endsWith(".html") && !expected.has(path)) {
          rmSync(join(SITE, entry.name, file), { force: true });
        }
      }
    } else if (entry.name.endsWith(".html") && entry.name !== "index.html") {
      rmSync(join(SITE, entry.name), { force: true });
    }
  }
}

function writeReadme() {
  writeFileSync(
    join(SITE, "README.md"),
    `# Docs site

This directory is generated by \`bun run build:docs\` — do not edit any file
here directly.

Sources: pages under \`docs/pages/**/*.md\` driven by \`docs/navigation.json\`,
HTML chrome in \`scripts/templates/\`, and the site chrome
\`scripts/docs/assets/docs.css\` + \`scripts/docs/assets/docs.js\`.

The pages reference the framework from the repo (\`src/\`, \`dist/\`) and the
chrome from \`scripts/docs/assets/\`, so the site opens from the checkout, not
from a standalone copy.
`,
  );
}

export function buildDocs() {
  const navigation = loadNavigation(ROOT);
  const themes = loadThemes(ROOT);
  const rendered = renderAllPages(navigation);
  mkdirSync(SITE, { recursive: true });
  requireAssets();
  mkdirSync(ASSETS, { recursive: true });
  copyFileSync(THEMES_SOURCE, THEMES_BUNDLE);
  writePages(navigation, rendered, themes);
  writeSearchIndex(navigation, rendered);
  writeHome(navigation, themes);
  pruneStale(navigation);
  writeReadme();
  checkGeneratedAssets(navigation);

  console.log(`Docs site generated (${navigation.pages.length} pages, ${themes.length} themes).`);
  for (const page of navigation.pages) {
    console.log(`  ${page.url}`);
  }
}

/*
 * Every local href/src a generated page emits must resolve to a file that
 * exists. Pages link out of site/ into src/ and dist/, so a missing target is
 * invisible locally the moment any build step has produced it once — and 404s
 * for everyone served from a clean checkout. Absolute URLs, protocol-relative
 * URLs, in-page fragments and mailto: are not ours to resolve.
 */
function checkGeneratedAssets(navigation) {
  const outputs = [
    join(SITE, "index.html"),
    ...navigation.pages.map((page) => join(SITE, page.url)),
  ];
  const missing = [];

  for (const output of outputs) {
    if (!existsSync(output)) continue;
    const html = readFileSync(output, "utf8");
    for (const [, attr, url] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(url)) continue;
      const target = resolve(dirname(output), url.split(/[?#]/)[0]);
      if (!existsSync(target)) missing.push(`${relative(ROOT, output)} -> ${attr}="${url}"`);
    }
  }

  if (missing.length > 0) {
    const list = [...new Set(missing)].slice(0, 20).join("\n  ");
    throw new Error(`Generated pages reference files that do not exist:\n  ${list}`);
  }
}

function writeSearchIndex(navigation, rendered) {
  writeFileSync(
    join(ASSETS, "search-index.js"),
    `/* Generated by build-docs.js — do not edit. */\nwindow.__SEARCH_INDEX__ = ${JSON.stringify(buildSearchIndex(navigation, rendered))};\n`,
  );
}

function watchMode() {
  const targets = [
    PAGES,
    join(ROOT, "docs", "navigation.json"),
    join(__dirname, "templates"),
    join(__dirname, "docs", "assets"),
    join(ROOT, "src", "css"),
  ];
  const recursiveSupported = process.platform === "win32" || process.platform === "darwin";

  let timer = null;
  const scheduleBuild = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      console.log("\nRebuilding docs...");
      try {
        buildDocs();
      } catch (error) {
        console.error("Docs build failed:");
        console.error(error);
      }
    }, 100);
  };

  for (const target of targets) {
    if (!existsSync(target)) continue;
    watch(target, { recursive: recursiveSupported }, (_eventType, filename) => {
      const changed = filename ? String(filename) : "unknown file";
      console.log(`Change detected in ${changed}`);
      scheduleBuild();
    });
  }

  console.log("Watching docs sources for changes...");
  console.log("Press Ctrl+C to stop.");
}

const directRun =
  process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (directRun) {
  try {
    buildDocs();
    if (process.argv.includes("--watch")) {
      watchMode();
    }
  } catch (error) {
    console.error("Docs build failed:");
    console.error(error);
    process.exitCode = 1;
  }
}
