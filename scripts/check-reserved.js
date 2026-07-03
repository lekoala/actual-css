import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSS_FILE = join(ROOT, "dist", "actual.css");

const RESERVED = new Set([
  "accordion",
  "actions",
  "alert",
  "app-shell",
  "avatar",
  "badge",
  "breadcrumb",
  "btn",
  "card",
  "center",
  "check",
  "choice",
  "circle",
  "cluster",
  "compact",
  "danger",
  "drawer",
  "end",
  "field",
  "field-error",
  "field-group",
  "field-help",
  "field-label",
  "file",
  "fit",
  "flyout",
  "form",
  "form-actions",
  "frame",
  "gap-lg",
  "gap-none",
  "gap-sm",
  "ghost",
  "grid",
  "grid-2",
  "grid-3",
  "grid-4",
  "grid-responsive",
  "grow",
  "input",
  "inverted",
  "is-sheet",
  "is-static",
  "items-center",
  "items-start",
  "key",
  "lead",
  "lg",
  "link",
  "link-muted",
  "link-plain",
  "list-group",
  "list-reset",
  "mbe",
  "mbe-lg",
  "mbe-sm",
  "mbs",
  "mbs-lg",
  "mbs-sm",
  "measure",
  "media",
  "media-middle",
  "meter",
  "modal",
  "muted",
  "native",
  "nav-link",
  "nav-list",
  "navbar",
  "navbar-brand",
  "navbar-nav",
  "neutral",
  "nowrap",
  "outline",
  "overflow-auto",
  "overline",
  "pagination",
  "pill",
  "primary",
  "progress",
  "prose",
  "px",
  "px-lg",
  "px-sm",
  "py",
  "py-lg",
  "py-sm",
  "radio",
  "raised",
  "range",
  "required-mark",
  "scrollable",
  "secondary",
  "select",
  "sidebar-layout",
  "skeleton",
  "sm",
  "soft",
  "solid",
  "spinner",
  "sr-only",
  "stack",
  "sticky",
  "subtle",
  "success",
  "surface-backdrop",
  "switch",
  "switcher",
  "tab",
  "table",
  "table-wrap",
  "tabs",
  "text-balance",
  "text-center",
  "text-end",
  "text-pretty",
  "text-start",
  "textarea",
  "tooltip",
  "truncate",
  "warning",
  "with-sidebar",
]);

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function selectorPreludes(css) {
  const preludes = [];
  let start = 0;

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    if (char === "{") {
      const prelude = css.slice(start, i).trim();
      if (prelude && !prelude.startsWith("@")) {
        preludes.push(prelude);
      }
      start = i + 1;
    } else if (char === "}") {
      start = i + 1;
    }
  }

  return preludes;
}

function classesFromSelectors(css) {
  const classes = new Set();

  for (const prelude of selectorPreludes(stripComments(css))) {
    for (const match of prelude.matchAll(/\.([A-Za-z_-][A-Za-z0-9_-]*)/g)) {
      classes.add(match[1]);
    }
  }

  return classes;
}

async function main() {
  const css = await readFile(CSS_FILE, "utf8");
  const classes = classesFromSelectors(css);
  const unexpected = [...classes].filter((name) => !RESERVED.has(name)).sort();
  const stale = [...RESERVED].filter((name) => !classes.has(name)).sort();

  if (unexpected.length > 0) {
    console.error("Reserved class check failed.");
    console.error(`Unexpected classes: ${unexpected.join(", ")}`);
    process.exit(1);
  }

  console.log(`Reserved class check passed (${classes.size} classes).`);

  if (stale.length > 0) {
    console.log(`Reserved but not emitted: ${stale.join(", ")}`);
  }
}

main();
