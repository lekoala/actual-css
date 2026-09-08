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
 *   name            file basename under src/css/components (index.css skipped).
 *   source          repository path of the component CSS file.
 *   cssImport       `actual-css/css/components/<name>`, from the
 *                   `./css/components/*` export — the modular import path.
 *   classes         classes a rule in the file *styles*: the leftmost compound
 *                   of each selector (`subjectClasses`), minus the shared
 *                   intent/variant vocabulary (see below). Sub-element classes
 *                   that never lead a compound are not listed.
 *   publicHooks / internalHooks — the "Public hooks:" / "Internal:" header
 *                   sections, parsed with the same contract check:css-api
 *                   enforces. No new annotation; the section list is the
 *                   contract.
 *   states          state attributes and pseudo-classes the CSS selects on:
 *                   aria-* plus {hidden, open}, and the curated state
 *                   pseudo-classes {checked, disabled, indeterminate,
 *                   popover-open, target}. data-* attributes are excluded —
 *                   they are the behavior layer (see check:enhance), not
 *                   visual states — and interaction pseudo-classes (:hover,
 *                   :focus-visible, :active) are not "states".
 *   jsImport        `actual-css/js/<name>` only when src/js/<name>.js exists
 *                   (existence, never a guessed name). A component without a
 *                   same-named module has no jsImport.
 *   enhancements    the tokens a same-named module registers via
 *                   registerEnhancement("token", …) — public API. The token may
 *                   differ from the module name (tab → "tabs") because it is
 *                   read from the file, not derived.
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
 *   - JS-written runtime markers styled in a compound (`.is-open`, `.is-sheet`,
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

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { preludeClasses, selectorPreludes, stripComments } from "./utils/css-classes.js";
import { loadReservedClasses } from "./utils/load-reserved-classes.js";
import { parseHookSections } from "./utils/parse-hook-sections.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_FILE = join(ROOT, "components.json");

/* The universal modifier catalogue — the classes a component composes without
   owning them. */
const SHARED_SOURCES = ["src/css/core/intents.css", "src/css/core/variants.css"];

const ENHANCEMENT_RE = /registerEnhancement\(\s*["']([a-z][a-z0-9-]*)["']/g;

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

export async function buildCatalog(root) {
  const reserved = new Set(loadReservedClasses(join(root, "reserved-classes.json")));
  const shared = await sharedVocabulary(root);
  const modules = await jsModules(root);
  const componentsDir = join(root, "src", "css", "components");
  const files = (await readdir(componentsDir)).filter(
    (file) => file.endsWith(".css") && file !== "index.css",
  );

  const catalog = await Promise.all(
    files.map(async (file) => {
      const name = file.slice(0, -4);
      const css = await readFile(join(componentsDir, file), "utf8");

      const classes = new Set();
      for (const prelude of selectorPreludes(stripComments(css))) {
        for (const cls of preludeClasses(prelude)) {
          if (reserved.has(cls) && !shared.has(cls)) classes.add(cls);
        }
      }

      const hooks = parseHookSections(css);
      const entry = {
        name,
        source: `src/css/components/${file}`,
        cssImport: `actual-css/css/components/${name}`,
      };
      if (classes.size) entry.classes = [...classes].sort();
      if (hooks.public.length) entry.publicHooks = hooks.public;
      if (hooks.internal.length) entry.internalHooks = hooks.internal;
      const states = stateNames(css);
      if (states.length) entry.states = states;
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

async function main() {
  const catalog = await buildCatalog(ROOT);
  await writeFile(OUT_FILE, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Wrote ${catalog.length} components to ${OUT_FILE}`);
}

if (import.meta.main) main();
