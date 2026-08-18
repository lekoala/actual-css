/*
 * Docs site builder. Reads docs/navigation.json + docs/pages markdown files,
 * renders pages with Bun's Markdown API, and writes a static site to docs/site/.
 *
 *   bun run build:docs         build once
 *   bun run watch:docs         rebuild on source changes
 */
import {
  copyFileSync,
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
const SITE = join(ROOT, "docs", "site");
const ASSETS = join(SITE, "assets");
const DIST = join(ROOT, "dist");

const ASSET_SOURCES = {
  "actual.css": join(DIST, "actual.css"),
  "actual.js": join(DIST, "actual.js"),
  "actual-themes.min.css": join(DIST, "actual-themes.min.css"),
  "docs.css": join(ROOT, "docs", "styles", "docs.css"),
  "docs.js": join(ROOT, "docs", "scripts", "docs.js"),
};

// Optional layers are documented on this site, so previews must load them too.
// The whole optional/ directory is copied so index.css @imports resolve.
const OPTIONAL_DIR = join(ROOT, "src", "css", "optional");
const OPTIONAL_DEST = join(ASSETS, "optional");

function copyDir(source, dest) {
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}

function copyAssets() {
  if (!existsSync(DIST)) {
    throw new Error(
      `dist/ not found — run "bun run build:dist && bun run build:js" first; the docs site is built from the shipped bundles`,
    );
  }
  mkdirSync(ASSETS, { recursive: true });
  for (const [name, source] of Object.entries(ASSET_SOURCES)) {
    if (!existsSync(source)) {
      throw new Error(`Missing site asset: ${source}`);
    }
    copyFileSync(source, join(ASSETS, name));
  }
  mkdirSync(OPTIONAL_DEST, { recursive: true });
  copyDir(OPTIONAL_DIR, OPTIONAL_DEST);
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

    const html = renderPage({
      title: page.title,
      description: page.description,
      content: result.html,
      toc: result.toc,
      navGroups: renderNavGroups(navigation, page),
      assets: "../assets",
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
  writeFileSync(
    join(SITE, "index.html"),
    renderHome({ navigation, themes }),
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
    `# Generated docs site

This directory is generated by \`bun run build:docs\`.

Do not edit files here directly. Edit \`docs/pages/**/*.md\`,
\`docs/navigation.json\`, \`scripts/docs/**\`, \`scripts/templates/docs-page.html\`,
\`docs/styles/docs.css\`, or \`docs/scripts/docs.js\`, then regenerate.
`,
  );
}

export function buildDocs() {
  const navigation = loadNavigation(ROOT);
  const themes = loadThemes(ROOT);
  const rendered = renderAllPages(navigation);
  mkdirSync(SITE, { recursive: true });
  copyAssets();
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
    `window.__SEARCH_INDEX__ = ${JSON.stringify(buildSearchIndex(navigation, rendered))};\n`,
  );
}

function watchMode() {
  const targets = [PAGES, join(ROOT, "docs", "navigation.json"), join(__dirname, "templates")];
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