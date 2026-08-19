/*
 * Docs site builder. Reads docs/navigation.json + docs/pages markdown files,
 * renders pages with Bun's Markdown API, and writes a static site to site/.
 *
 *   bun run build:docs         build once
 *   bun run watch:docs         rebuild on source changes
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  watch,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadNavigation } from "./docs/navigation.js";
import { render } from "./docs/markdown.js";
import { buildSearchIndex } from "./docs/search.js";
import { loadThemes } from "./docs/themes.js";
import { renderNavGroups, renderPage, renderHome } from "./docs/templates.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAGES = join(ROOT, "docs", "pages");
const SITE = join(ROOT, "site");
const ASSETS = join(SITE, "assets");
const CHROME = join(__dirname, "docs", "assets");
const DIST = join(ROOT, "dist");

// The docs site previews the framework from its source locations: pages link
// src/css/*.css (so CSS edits are visible without a compile step) and the dist
// bundles the site depends on. assets/ holds only search-index.js, regenerated
// on each build; the site chrome (docs.css, docs.js) is edited in
// scripts/docs/assets/ and referenced in place, so site/ never stores a copy.
const REQUIRED_DIST = [
  join(DIST, "actual.js"),
  join(DIST, "actual-themes.min.css"),
];

function requireDist() {
  for (const file of REQUIRED_DIST) {
    if (!existsSync(file)) {
      throw new Error(
        `Missing ${relative(ROOT, file)}. Run the distribution build first.`,
      );
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
      actualCss: repoAsset(from, join(ROOT, "src", "css", "actual.css")),
      optionalCss: repoAsset(from, join(ROOT, "src", "css", "optional", "index.css")),
      themesCss: repoAsset(from, join(DIST, "actual-themes.min.css")),
      docsCss: repoAsset(from, join(CHROME, "docs.css")),
      actualJs: repoAsset(from, join(DIST, "actual.js")),
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
      actualCss: repoAsset(from, join(ROOT, "src", "css", "actual.css")),
      optionalCss: repoAsset(from, join(ROOT, "src", "css", "optional", "index.css")),
      themesCss: repoAsset(from, join(DIST, "actual-themes.min.css")),
      docsCss: repoAsset(from, join(CHROME, "docs.css")),
      actualJs: repoAsset(from, join(DIST, "actual.js")),
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
  requireDist();
  mkdirSync(ASSETS, { recursive: true });
  writePages(navigation, rendered, themes);
  writeSearchIndex(navigation, rendered);
  writeHome(navigation, themes);
  pruneStale(navigation);
  writeReadme();

  console.log(`Docs site generated (${navigation.pages.length} pages, ${themes.length} themes).`);
  for (const page of navigation.pages) {
    console.log(`  ${page.url}`);
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
  } catch (error) {
    console.error("Docs build failed:");
    console.error(error);
  }

  if (process.argv.includes("--watch")) {
    watchMode();
  }
}