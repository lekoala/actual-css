/*
 * Page assembly: builds the site chrome fragments (nav, TOC, prev/next,
 * source links) and fills the docs-page.html template.
 */
import { readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { DOCS_PROSE_END, DOCS_PROSE_START } from "./markdown.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = "https://github.com/lekoala/actual-css";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let templateCache;
let homeTemplateCache;

export function loadTemplate() {
  if (!templateCache) {
    templateCache = readFileSync(join(__dirname, "..", "templates", "docs-page.html"), "utf8");
  }
  return templateCache;
}

export function loadHomeTemplate() {
  if (!homeTemplateCache) {
    homeTemplateCache = readFileSync(join(__dirname, "..", "templates", "docs-home.html"), "utf8");
  }
  return homeTemplateCache;
}

/* Relative href between two site-relative URLs ("components/button.html" -> "../layout/stack.html"). */
export function relHref(fromUrl, toUrl) {
  const fromDir = fromUrl === "index.html" ? "." : dirname(fromUrl);
  return relative(fromDir, toUrl).replaceAll(sep, "/");
}

/*
 * The current destination's groups only; the header and the drawer grid reach
 * the others. A group is a static section: its heading names it and the links
 * sit flush below, so a page never changes alignment with its depth and the
 * reader never has to open a tree to find a page. One group is a plain list:
 * the destination already names it.
 *
 * The wrapper is one block per set of groups so the drawer's .stack spaces
 * groups apart instead of spacing a heading from its own list.
 */
export function renderNavGroups(current) {
  if (!current) return "";
  const link = (entry, indent) => {
    const active = entry === current;
    const title = escapeHtml(entry.title ?? entry.slug);
    return `${indent}<li><a class="nav-link" href="${relHref(current.url, entry.url)}"${active ? ' aria-current="page"' : ""}>${title}</a></li>`;
  };
  const { groups } = current.destination;

  if (groups.length === 1) {
    return `      <ul class="nav-list">
${groups[0].pages.map((page) => link(page.entry, "        ")).join("\n")}
      </ul>`;
  }

  const sections = groups
    .map(
      (group) => `        <p class="docs-nav-group">${escapeHtml(group.title)}</p>
        <ul class="nav-list">
${group.pages.map((page) => link(page.entry, "          ")).join("\n")}
        </ul>`,
    )
    .join("\n");
  return `      <div>
${sections}
      </div>`;
}

/*
 * Destination links. The one holding the current page takes
 * aria-current="true", or "page" on its own first page. `icons` adds the
 * leading glyph the drawer grid shows.
 */
export function renderDestinations(navigation, current, { icons = false } = {}) {
  const from = current?.url ?? "index.html";
  return navigation.destinations
    .map((destination) => {
      const state =
        current === destination.home
          ? ' aria-current="page"'
          : current?.destination === destination
            ? ' aria-current="true"'
            : "";
      const icon = icons ? `<i class="ti ti-${destination.icon}" aria-hidden="true"></i>` : "";
      return `          <li><a class="nav-link" href="${relHref(from, destination.home.url)}"${state}>${icon}${escapeHtml(destination.title)}</a></li>`;
    })
    .join("\n");
}

/*
 * The search panel's empty state. It mirrors the destinations, which already
 * name the site's top-level sections and carry an icon each, so this never
 * drifts into a second hand-maintained list. Fixed ids keep the panel's
 * aria-activedescendant contract identical whether it shows links or results.
 */
export function renderSearchLinks(navigation, current) {
  const from = current?.url ?? "index.html";
  return navigation.destinations
    .map(
      (destination, i) =>
        `        <li id="docs-search-opt-${i}" role="option" aria-selected="false" data-index="${i}"><a class="docs-search-link" href="${relHref(from, destination.home.url)}" tabindex="-1"><i class="ti ti-${destination.icon}" aria-hidden="true"></i>${escapeHtml(destination.title)}</a></li>`,
    )
    .join("\n");
}

export function renderToc(toc) {
  return toc
    .map(
      (item) =>
        `        <li><a class="nav-link" href="#${item.id}" data-docs-toc-item data-level="${item.level}">${escapeHtml(item.label)}</a></li>`,
    )
    .join("\n");
}

const SCHEME_VALUES = ["system", "light", "dark"];

export function renderThemeOptions(themes) {
  const scheme = SCHEME_VALUES.map(
    (name) =>
      `            <option value="${name}">${escapeHtml(name.charAt(0).toUpperCase() + name.slice(1))}</option>`,
  ).join("\n");
  const named = themes
    .map((theme) => `            <option value="${theme.name}">${escapeHtml(theme.label)}</option>`)
    .join("\n");
  return `${scheme}
            <optgroup label="Themes">
${named}
            </optgroup>`;
}

export function renderThemeInit(themes) {
  const valid = JSON.stringify([...SCHEME_VALUES, ...themes.map((theme) => theme.name)]);
  return `<script>
  (function () {
    var valid = ${valid};
    var saved = null;
    try { saved = localStorage.getItem("actual-docs-theme"); } catch (e) {}
    if (saved === "system" || !valid.includes(saved)) {
      try { localStorage.removeItem("actual-docs-theme"); } catch (e) {}
    } else if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    }
  })();
</script>`;
}

/*
 * Home stat strip, read from size-report.json so the figures on the landing
 * page are the ones build:size measured, not prose that drifts. A missing or
 * unreadable report yields an empty strip rather than a stale or invented
 * number, and says why: the report is git-ignored, so a fresh clone that runs
 * build:docs without build:size would otherwise publish the gap silently.
 *
 * This is the only consumer of that report, and it is why build:all measures
 * before it builds docs. Reading a report written later in the same pipeline
 * publishes the previous run's numbers.
 */
function readCatalog() {
  return JSON.parse(readFileSync(join(__dirname, "..", "..", "components.json"), "utf8"));
}

export function renderHomeStats() {
  let report;
  try {
    report = JSON.parse(readFileSync(join(__dirname, "..", "..", "size-report.json"), "utf8"));
  } catch (error) {
    console.warn(
      error.code === "ENOENT"
        ? "Missing size-report.json; run `bun run build:size` to generate homepage size statistics."
        : "Invalid size-report.json; run `bun run build:size` to regenerate it.",
    );
    return "";
  }

  const kb = (bytes) => `${(bytes / 1024).toFixed(1)}kb`;
  const stats = [
    // @lekoala/floating is a first-party package factored out of this repo.
    ["0", "Third-party dependencies"],
    [kb(report.full.brotli), "Full build, brotli"],
    [kb(report.core.brotli), "Core, brotli"],
    // Counted from the derived catalog, which covers shipped components only.
    // Not a theme count: the named themes are demos and do not ship.
    [String(readCatalog().length), "Components"],
  ];

  return stats
    .map(
      ([value, label]) => `          <div class="docs-stat">
            <strong>${escapeHtml(value)}</strong>
            <span class="muted">${escapeHtml(label)}</span>
          </div>`,
    )
    .join("\n");
}

export function renderThemeCards(themes) {
  return themes
    .map(
      (
        theme,
      ) => `          <article class="card compact stack docs-theme-card" data-theme="${theme.name}">
            <div class="docs-theme-preview" aria-hidden="true">
              <span class="docs-theme-line"></span>
              <span class="docs-theme-line docs-theme-line-primary"></span>
              <span class="docs-theme-line docs-theme-line-secondary"></span>
            </div>
            <h3>${escapeHtml(theme.label)}</h3>
          </article>`,
    )
    .join("\n");
}

// A small spread of palettes and surface treatments; the header exposes all.
const HOME_THEME_PREVIEWS = ["forest", "lavender", "neo-brutalist", "cyberpunk", "neon", "glass"];

function renderPageCard(page, href) {
  return `          <a class="card stack docs-component-card docs-card-link" href="${href}">
            <h3>${escapeHtml(page.title)}</h3>
            <p class="muted">${escapeHtml(page.description)}</p>
          </a>`;
}

const PAGE_INDEX = /<!--docs-index:([a-z-]+)-->/g;

/*
 * Expands `<!--docs-index:<group slug>-->` in a rendered page into a card per
 * page of that group, from navigation.json order and each page's own lead, so
 * an overview never restates what the pages say. Overview pages are skipped:
 * the authored section links its group's overview. Runs after every page is
 * rendered, since it reads the other pages' titles and descriptions.
 */
export function expandPageIndexes(html, navigation, current) {
  return html.replace(PAGE_INDEX, (_marker, slug) => {
    const group = navigation.groups.find((candidate) => candidate.slug === slug);
    if (!group) throw new Error(`${current.file}: docs-index names unknown group "${slug}"`);
    const cards = group.pages
      .map((page) => page.entry)
      .filter((entry) => entry.slug !== "overview")
      .map((entry) => renderPageCard(entry, relHref(current.url, entry.url)))
      .join("\n");
    return `${DOCS_PROSE_END}
<div class="grid docs-components-grid">
${cards}
</div>
${DOCS_PROSE_START}`;
  });
}

export function renderHome({
  navigation,
  themes,
  actualCss,
  themesCss,
  docsCss,
  actualJs,
  docsJs,
  siteRoot,
}) {
  return loadHomeTemplate()
    .replace(/\{\{actualCss\}\}/g, actualCss)
    .replace(/\{\{themesCss\}\}/g, themesCss)
    .replace(/\{\{docsCss\}\}/g, docsCss)
    .replace(/\{\{actualJs\}\}/g, actualJs)
    .replace(/\{\{docsJs\}\}/g, docsJs)
    .replace(/\{\{siteRoot\}\}/g, siteRoot)
    .replace(/\{\{themeOptions\}\}/g, renderThemeOptions(themes))
    .replace(/\{\{themeInit\}\}/g, renderThemeInit(themes))
    .replace(/\{\{themeCount\}\}/g, String(themes.length))
    .replace(/\{\{homeStats\}\}/g, renderHomeStats())
    .replace(
      /\{\{themeCards\}\}/g,
      renderThemeCards(themes.filter((theme) => HOME_THEME_PREVIEWS.includes(theme.name))),
    )
    .replace(/\{\{destinations\}\}/g, renderDestinations(navigation, null))
    .replace(/\{\{drawerDestinations\}\}/g, renderDestinations(navigation, null, { icons: true }))
    .replace(/\{\{searchLinks\}\}/g, renderSearchLinks(navigation, null));
}

/*
 * End-of-page navigation: two surfaces, not two secondary buttons. The whole
 * card is the target; the label names the direction, the page title carries the
 * weight. The stylesheet places card one and two, so a page with a single
 * neighbour keeps it on the side its direction implies.
 */
function renderPageLink(url, entry, direction) {
  const label = direction === "previous" ? "Previous" : "Next";
  return `          <a class="card stack docs-page-link docs-card-link docs-page-link-${direction}" href="${relHref(url, entry.url)}">
            <span class="docs-page-label">${label}</span>
            <span class="docs-page-title">${escapeHtml(entry.title)}</span>
          </a>`;
}

/** Compose narrative Markdown sections with component demos at page level. */
export function wrapDocsContent(content) {
  const ends = content.split(DOCS_PROSE_END).length - 1;
  const starts = content.split(DOCS_PROSE_START).length - 1;
  if (ends !== starts) {
    throw new Error("Unbalanced documentation prose boundaries");
  }

  const open = '<div class="prose docs-prose">';
  const sections = content.replaceAll(DOCS_PROSE_END, "</div>").replaceAll(DOCS_PROSE_START, open);
  return `${open}\n${sections}\n</div>`.replace(/<div class="prose docs-prose">\s*<\/div>\s*/g, "");
}

export function renderPage({
  title,
  description,
  content,
  toc,
  navGroups,
  destinations,
  drawerDestinations,
  searchLinks,
  actualCss,
  themesCss,
  docsCss,
  actualJs,
  docsJs,
  siteRoot,
  url,
  previous,
  next,
  file,
  themes,
}) {
  const tpl = loadTemplate();
  const page = { url, previous, next };
  const home = relHref(url, "index.html");
  // Callers normally provide a POSIX repository path, but normalize again at
  // the URL boundary so an OS-native path can never leak into generated hrefs.
  const sourceFile = file.replaceAll("\\", "/");

  return tpl
    .replace(/\{\{title\}\}/g, escapeHtml(title))
    .replace(/\{\{description\}\}/g, escapeHtml(description))
    .replace(/\{\{actualCss\}\}/g, actualCss)
    .replace(/\{\{themesCss\}\}/g, themesCss)
    .replace(/\{\{docsCss\}\}/g, docsCss)
    .replace(/\{\{actualJs\}\}/g, actualJs)
    .replace(/\{\{docsJs\}\}/g, docsJs)
    .replace(/\{\{siteRoot\}\}/g, siteRoot)
    .replace(/\{\{home\}\}/g, home)
    .replace(/\{\{navGroups\}\}/g, navGroups)
    .replace(/\{\{destinations\}\}/g, destinations)
    .replace(/\{\{drawerDestinations\}\}/g, drawerDestinations)
    .replace(/\{\{searchLinks\}\}/g, searchLinks)
    .replace(/\{\{themeOptions\}\}/g, renderThemeOptions(themes))
    .replace(/\{\{themeInit\}\}/g, renderThemeInit(themes))
    .replace(/\{\{content\}\}/g, wrapDocsContent(content))
    .replace(/\{\{toc\}\}/g, renderToc(toc))
    .replace(/\{\{prev\}\}/g, page.previous ? renderPageLink(url, page.previous, "previous") : "")
    .replace(/\{\{next\}\}/g, page.next ? renderPageLink(url, page.next, "next") : "")
    .replace(/\{\{editUrl\}\}/g, `${REPO}/edit/master/docs/pages/${sourceFile}`)
    .replace(/\{\{markdownUrl\}\}/g, `${REPO}/blob/master/docs/pages/${sourceFile}`);
}
