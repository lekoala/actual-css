/*
 * Generates components.json — the machine-readable component index, derived
 * entirely from existing sources: src/css/components/*.css, the shared
 * intent/variant catalogue (core/intents.css + core/variants.css),
 * package.json#exports, reserved-classes.json, and src/js/*.js. It is an
 * analysis artifact, not a second source of truth: nothing here is authored or
 * annotated, and check:catalog fails if the committed file drifts from what
 * this script derives.
 *
 * Derivation rules
 *
 *   name            file basename under src/css/components. Bundle files that
 *                   only @import (index.css, forms/base.css) are skipped.
 *   source          repository path of the component CSS file.
 *   cssImport       `actual-css/css/components/<name>`, from the
 *                   `./css/components/*` export — the modular import path.
 *   classes         classes a rule in the file *styles*: the leftmost compound
 *                   of each selector (`subjectClasses`), minus the shared
 *                   intent/variant vocabulary (see below) and minus another
 *                   component's name — `bleed` styles `.card > *` but does not
 *                   provide `.card`. Sub-element classes that never lead a
 *                   compound are not listed.
 *   publicHooks / plumbingHooks / internalHooks — the "Public hooks:" /
 *                   "Framework plumbing:" / "Internal:" header sections,
 *                   parsed with the same contract check:css-api enforces. No
 *                   new annotation; the section list is the contract.
 *   states          state attributes and pseudo-classes the CSS selects on:
 *                   aria-* plus {hidden, open}, and the curated state
 *                   pseudo-classes {checked, disabled, indeterminate,
 *                   popover-open, target}. data-* attributes are excluded —
 *                   they are the behavior layer (see check:enhance), not
 *                   visual states — and interaction pseudo-classes (:hover,
 *                   :focus-visible, :active) are not "states".
 *   pseudoElements  the ::before / ::after the file generates, keyed by the
 *                   element that owns them (`.nav-link`, `.accordion summary`):
 *                   those slots are taken, so an author decorating that
 *                   element must use another one. Any state counts — a
 *                   pseudo-element generated only when current still collides.
 *   jsImport        `actual-css/js/<name>` only when src/js/<name>.js exists
 *                   (existence, never a guessed name). A component without a
 *                   same-named module has no jsImport.
 *   enhancements    the tokens a same-named module registers via
 *                   registerEnhancement("token", …) — public API. The token may
 *                   differ from the module name (tab → "tabs") because it is
 *                   read from the file, not derived.
 *   docs            the published page named by the file's "Docs:" header
 *                   (docs/pages/<path>.md → <homepage><path>.html). Every
 *                   component file must carry one that resolves to an existing
 *                   page: a consumer linking to the docs cannot guess that tab
 *                   lives under enhancements/ or join under forms/.
 *
 * forms.json — the same rows, derived the same way from src/css/forms. A
 * family gets its own file instead of joining components.json: a forms file
 * holds several classes (form.css: .field, .field-label, .field-group…), so
 * `name` is a file, not a component, and mixing them would give the field
 * two meanings. A future family (layout, effects) follows the same shape.
 *
 * tokens.json — the public global tokens, written by the same command:
 *
 *   global          custom properties declared in core/tokens.css and
 *                   core/theme.css, plus the "Public hooks:" of any core file
 *                   (fallback-only hooks such as --soft-border-mix), minus the
 *                   "Internal:" sections of those files and the shared relay
 *                   families (--ui-*, --intent*, --density-*). Component hooks
 *                   stay in components.json.
 *
 * Shared vocabulary
 *
 *   The universal modifiers a component composes but does not own — intents
 *   (core/intents.css) and variants / density / sizes (core/variants.css) —
 *   are extracted from those files with `depthZeroOnly`, so a rule like
 *   `:where(.btn, .input, …).sm` contributes only `.sm`, never the participant
 *   names. What is not in these two files stays a component class even when it
 *   is broadly shared (e.g. `.circle` on `.join.circle`).
 *
 * Documented limitations (deliberate)
 *
 *   - Sub-parts that always follow a parent in markup (`.step-label`,
 *     `.step-complete`, `.list-item`, …) never lead a compound, so they are
 *     absent even when they are part of the component API. The docs name them;
 *     the catalog lists what a rule styles directly.
 *   - JS-written runtime markers styled in a compound (`.is-open`,
 *     `.has-modal-open`, …) do appear in `classes` of the component that
 *     styles them.
 *   - `busy` styles no class of its own (pure `[aria-busy]` state selectors),
 *     so its `classes` is empty.
 *   - `status-bar` has no `jsImport`: its module is status.js, which is not
 *     same-named, and the catalog never guesses.
 *   - There is no anatomy, canonical element, or semantics here — only what a
 *     selector or a header comment asserts. Read docs/pages/components/*.md
 *     for the rest.
 *
 * These are judgments about *what to derive*, not stored data. Adjust them
 * here, regenerate, and review the diff — the catalog never edits itself.
 */

import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generatedPseudoElements,
  preludeClasses,
  selectorPreludes,
  stripComments,
} from "./utils/css-classes.js";
import { loadReservedClasses } from "./utils/load-reserved-classes.js";
import { parseHookSections } from "./utils/parse-hook-sections.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TOKENS_FILE = join(ROOT, "tokens.json");

/* The published CSS families with an index of their own, each written to
   <family>.json, and how a class shared between two files finds its owner.
   Always: a class named after a file is that file's (bleed styles .card,
   card owns it; control.css styles .select, select owns it). "cascade" adds:
   a forms file holds several classes, so the first file in import order that
   styles a class owns it and later ones only restyle it (validation.css
   paints .input invalid). Cascade order cannot serve components: unrelated
   components share runtime markers (.is-open, .scrollable), and each must
   keep listing them. */
const FAMILIES = { components: "name", forms: "cascade" };
export const CATALOG_FAMILIES = Object.keys(FAMILIES);

/* A bundle file (index.css, forms/base.css) only imports its family: it
   styles nothing and is not an entry. */
const isBundle = (css) =>
  stripComments(css)
    .replace(/@import[^;]*;/g, "")
    .trim() === "";

/* The family's files in cascade order, flattened from index.css through any
   nested bundle (forms/base.css). */
async function importOrder(dir, file = "index.css", order = []) {
  const css = stripComments(await readFile(join(dir, file), "utf8"));
  for (const match of css.matchAll(/@import\s+["']\.\/([^"']+)["']/g)) {
    const child = match[1];
    const source = await readFile(join(dir, child), "utf8");
    if (isBundle(source)) await importOrder(dir, child, order);
    else if (!order.includes(child)) order.push(child);
  }
  return order;
}

/* The universal modifier catalogue — the classes a component composes without
   owning them. */
const SHARED_SOURCES = ["src/css/core/intents.css", "src/css/core/variants.css"];

/* Where global tokens are declared. Other core files only contribute their
   "Public hooks:" / "Internal:" headers. */
const TOKEN_SOURCES = ["src/css/core/tokens.css", "src/css/core/theme.css"];

/* Shared relays, never author tokens (same families as check:css-api). */
const RELAY_PREFIXES = [/^--ui-/, /^--density-/, /^--intent(?:-|$)/];

const ENHANCEMENT_RE = /registerEnhancement\(\s*["']([a-z][a-z0-9-]*)["']/g;
const DOCS_RE = /^\s*\*\s*Docs:\s*docs\/pages\/(\S+)\.md\s*$/m;

/* The published docs root. package.json#homepage points at the generated
   site, so a page path maps onto it without a second hard-coded URL. */
async function docsBase(root) {
  const { homepage } = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  if (!homepage?.endsWith("/site/")) {
    throw new Error(
      `package.json#homepage must be the docs site root ending in /site/ (got ${homepage}).`,
    );
  }
  return homepage;
}

function docsUrl(root, base, file, css) {
  const path = css.match(DOCS_RE)?.[1];
  if (!path) throw new Error(`${file}: missing a "Docs: docs/pages/<path>.md" header line.`);
  if (!existsSync(join(root, "docs", "pages", `${path}.md`))) {
    throw new Error(`${file}: Docs header points at docs/pages/${path}.md, which does not exist.`);
  }
  return `${base}${path}.html`;
}

function stateNames(css) {
  const states = new Set();
  for (const prelude of selectorPreludes(stripComments(css))) {
    for (const match of prelude.matchAll(/\[([a-z][a-z0-9-]*)/g)) {
      if (match[1].startsWith("aria-") || match[1] === "hidden" || match[1] === "open") {
        states.add(match[1]);
      }
    }
    for (const match of prelude.matchAll(
      /:(checked|disabled|indeterminate|open|popover-open|target)\b/g,
    )) {
      states.add(match[1]);
    }
  }
  return [...states].sort();
}

function pseudoElements(css) {
  const owners = {};
  for (const prelude of selectorPreludes(stripComments(css))) {
    for (const { owner, pseudo } of generatedPseudoElements(prelude)) {
      owners[owner] ??= new Set();
      owners[owner].add(pseudo);
    }
  }
  return Object.fromEntries(
    Object.keys(owners)
      .sort()
      .map((owner) => [owner, [...owners[owner]].sort()]),
  );
}

async function sharedVocabulary(root) {
  const classes = new Set();
  for (const name of SHARED_SOURCES) {
    const css = await readFile(join(root, name), "utf8");
    for (const prelude of selectorPreludes(stripComments(css))) {
      for (const cls of preludeClasses(prelude, { depthZeroOnly: true })) {
        classes.add(cls);
      }
    }
  }
  return classes;
}

async function jsModules(root) {
  const modules = new Set();
  for (const entry of await readdir(join(root, "src/js"))) {
    if (entry.endsWith(".js")) modules.add(entry.slice(0, -3));
  }
  return modules;
}

export async function buildCatalog(root, family = "components") {
  const reserved = new Set(loadReservedClasses(join(root, "reserved-classes.json")));
  const shared = await sharedVocabulary(root);
  const modules = await jsModules(root);
  const base = await docsBase(root);
  const familyDir = join(root, "src", "css", family);
  const sources = new Map();
  for (const file of await readdir(familyDir)) {
    if (!file.endsWith(".css")) continue;
    const css = await readFile(join(familyDir, file), "utf8");
    if (!isBundle(css)) sources.set(file, css);
  }
  const files = [...sources.keys()];

  const styled = new Map();
  for (const [file, css] of sources) {
    const classes = new Set();
    for (const prelude of selectorPreludes(stripComments(css))) {
      for (const cls of preludeClasses(prelude)) {
        if (reserved.has(cls) && !shared.has(cls)) classes.add(cls);
      }
    }
    styled.set(file, classes);
  }

  const owner = new Map(files.map((file) => [file.slice(0, -4), file]));
  if (FAMILIES[family] === "cascade") {
    for (const file of await importOrder(familyDir)) {
      for (const cls of styled.get(file) ?? []) if (!owner.has(cls)) owner.set(cls, file);
    }
  }

  const catalog = await Promise.all(
    files.map(async (file) => {
      const name = file.slice(0, -4);
      const css = sources.get(file);

      const classes = new Set();
      for (const cls of styled.get(file)) {
        if ((owner.get(cls) ?? file) === file) classes.add(cls);
      }

      const hooks = parseHookSections(css);
      const entry = {
        name,
        source: `src/css/${family}/${file}`,
        cssImport: `actual-css/css/${family}/${name}`,
        docs: docsUrl(root, base, file, css),
      };
      if (classes.size) entry.classes = [...classes].sort();
      if (hooks.public.length) entry.publicHooks = hooks.public;
      if (hooks.plumbing.length) entry.plumbingHooks = hooks.plumbing;
      if (hooks.internal.length) entry.internalHooks = hooks.internal;
      const states = stateNames(css);
      if (states.length) entry.states = states;
      const pseudos = pseudoElements(css);
      if (Object.keys(pseudos).length) entry.pseudoElements = pseudos;
      if (modules.has(name)) {
        entry.jsImport = `actual-css/js/${name}`;
        const source = await readFile(join(root, "src", "js", `${name}.js`), "utf8");
        const enhancements = [];
        for (const match of source.matchAll(ENHANCEMENT_RE)) {
          if (!enhancements.includes(match[1])) enhancements.push(match[1]);
        }
        if (enhancements.length) entry.enhancements = enhancements;
      }

      return entry;
    }),
  );

  catalog.sort((a, b) => a.name.localeCompare(b.name));
  return catalog;
}

export async function buildTokens(root) {
  const coreDir = join(root, "src", "css", "core");
  const declared = new Set();
  const publicHooks = new Set();
  const internal = new Set();

  for (const file of (await readdir(coreDir)).filter((entry) => entry.endsWith(".css"))) {
    const path = `src/css/core/${file}`;
    const css = await readFile(join(coreDir, file), "utf8");
    const hooks = parseHookSections(css);
    for (const hook of hooks.public) publicHooks.add(hook);
    for (const hook of hooks.internal) internal.add(hook);
    if (TOKEN_SOURCES.includes(path)) {
      for (const match of stripComments(css).matchAll(/(?<![-\w])(--[a-z0-9-]+)\s*:/g)) {
        declared.add(match[1]);
      }
    }
  }

  const global = [...new Set([...declared, ...publicHooks])]
    .filter((name) => !internal.has(name) && !RELAY_PREFIXES.some((re) => re.test(name)))
    .sort();

  /* A file outside core may list a global token under "Internal:" only for
     the local value it writes (navbar's --gap). If it means the token itself,
     core must say so too: --surface-link was internal in card.css and public
     here. Either annotation settles which one, so a disagreement fails. */
  for (const path of await cssFilesOutsideCore(root)) {
    const css = await readFile(join(root, path), "utf8");
    const localValues = new Set([...css.matchAll(LOCAL_VALUE_RE)].map((match) => match[1]));
    for (const name of parseHookSections(css).internal) {
      if (global.includes(name) && !localValues.has(name)) {
        throw new Error(
          `${path} lists ${name} under "Internal:", but core publishes it as a global token. ` +
            `Mark it Internal in core, or annotate the entry "${name} (local value …)".`,
        );
      }
    }
  }

  return { global };
}

/* "--gap (local value …)": an Internal entry that classifies the value a file
   writes, not the global token it shadows. */
const LOCAL_VALUE_RE = /(--[a-z0-9-]+)\s*\(local value\b/g;

async function cssFilesOutsideCore(root) {
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        // Themes are repository demos, not the published contract.
        if (path !== "src/css/core" && path !== "src/css/themes") await walk(path);
      } else if (entry.name.endsWith(".css")) {
        files.push(path);
      }
    }
  };
  await walk("src/css");
  return files.sort();
}

async function main() {
  for (const family of CATALOG_FAMILIES) {
    const catalog = await buildCatalog(ROOT, family);
    const file = join(ROOT, `${family}.json`);
    await writeFile(file, `${JSON.stringify(catalog, null, 2)}\n`);
    console.log(`Wrote ${catalog.length} ${family} entries to ${file}`);
  }
  const tokens = await buildTokens(ROOT);
  await writeFile(TOKENS_FILE, `${JSON.stringify(tokens, null, 2)}\n`);
  console.log(`Wrote ${tokens.global.length} global tokens to ${TOKENS_FILE}`);
}

if (import.meta.main) main();
