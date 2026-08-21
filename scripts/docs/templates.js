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

export function renderNavGroups(navigation, current) {
  return navigation.groups
    .map((group) => {
      const links = group.pages
        .map((page) => {
          const entry = page.entry;
          const active = entry === current;
          const title = escapeHtml(entry.title ?? entry.slug);
          const href = current ? relHref(current.url, entry.url) : entry.url;
          return `        <li><a class="nav-link" href="${href}"${active ? ' aria-current="page"' : ""}>${title}</a></li>`;
        })
        .join("\n");
      return `      <p class="docs-nav-group">${escapeHtml(group.title)}</p>
      <ul class="nav-list">
${links}
      </ul>`;
    })
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

const COMPONENT_FEATURED = [
  "button",
  "card",
  "badge",
  "alert",
  "dialog",
  "drawer",
  "table",
  "navbar",
  "accordion",
  "breadcrumb",
  "meter",
  "pagination",
];

export function renderComponentsGrid(navigation) {
  return navigation.pages
    .filter((page) => page.groupSlug === "components" && COMPONENT_FEATURED.includes(page.slug))
    .sort((a, b) => COMPONENT_FEATURED.indexOf(a.slug) - COMPONENT_FEATURED.indexOf(b.slug))
    .map(
      (page) => `          <a class="card stack docs-component-card" href="${page.url}">
            <h3>${escapeHtml(page.title)}</h3>
            <p class="muted">${escapeHtml(page.description)}</p>
          </a>`,
    )
    .join("\n");
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
    .replace(/\{\{themeCards\}\}/g, renderThemeCards(themes))
    .replace(/\{\{componentsGrid\}\}/g, renderComponentsGrid(navigation))
    .replace(/\{\{navGroups\}\}/g, renderNavGroups(navigation, null));
}

function renderPrev(page) {
  return page.previous
    ? `          <a class="btn outline" href="${relHref(page.url, page.previous.url)}">&larr; ${escapeHtml(page.previous.title)}</a>`
    : "";
}

function renderNext(page) {
  return page.next
    ? `          <a class="btn outline" href="${relHref(page.url, page.next.url)}">${escapeHtml(page.next.title)} &rarr;</a>`
    : "";
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
    .replace(/\{\{themeOptions\}\}/g, renderThemeOptions(themes))
    .replace(/\{\{themeInit\}\}/g, renderThemeInit(themes))
    .replace(/\{\{content\}\}/g, wrapDocsContent(content))
    .replace(/\{\{toc\}\}/g, renderToc(toc))
    .replace(/\{\{prev\}\}/g, renderPrev(page))
    .replace(/\{\{next\}\}/g, renderNext(page))
    .replace(/\{\{editUrl\}\}/g, `${REPO}/edit/master/docs/pages/${sourceFile}`)
    .replace(/\{\{markdownUrl\}\}/g, `${REPO}/blob/master/docs/pages/${sourceFile}`);
}
