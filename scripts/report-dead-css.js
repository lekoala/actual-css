/*
 * Survey of the demo stylesheets: which of their class rules nothing uses, and
 * which of them shadow a framework class.
 *
 * Analysis only — it gates nothing and exits 0 whatever it finds. Demo CSS
 * accumulates: a page gets rewritten, a gallery is replaced by the generated
 * site, and the rules that dressed the old markup stay behind, styling nothing.
 * A class can also be applied by a script rather than by an attribute, so the
 * unused list is a review queue, not a delete list.
 *
 * For every stylesheet under demo/ (excluding the generated theme bundle) it
 * finds the pages that actually <link> it, then reports:
 *
 *   shadows      a class the framework already defines (reserved-classes.json).
 *                The demo sheet loads after the framework, so its rule wins.
 *                Often deliberate — a demo site restyling .btn or .card is
 *                exactly the app-level override the contract allows. Sometimes
 *                accidental, and then it is expensive: demo/styles/demo.css
 *                once redefined .center, which silenced the layout primitive's
 *                --center-size hook on every page that linked the sheet, with
 *                nothing to see until someone set the hook and it did nothing.
 *                Read each one; the tool cannot tell the two apart.
 *   unused       the name appears nowhere in any consumer, in any form.
 *                Safe to delete unless a consumer builds the name dynamically.
 *   markup-only  the name appears in a consumer but never in a class attribute
 *                — a script that adds it, a code sample that only shows it, or
 *                a comment. Read before deleting.
 *
 * A stylesheet with no consumer at all is reported on its own: nothing links
 * it, so every rule in it is dead.
 *
 * Usage: bun run report:dead-css
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { loadReservedClasses } from "./utils/load-reserved-classes.js";

const ROOT = join(import.meta.dirname, "..");
const DEMO = join(ROOT, "demo");

/* Generated bundle, not authored CSS. */
const SKIP_DIRS = new Set(["assets"]);

function collect(dir, extension, skipTop = false) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipTop && SKIP_DIRS.has(entry.name)) continue;
      files.push(...collect(join(dir, entry.name), extension));
    } else if (entry.name.endsWith(extension)) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

const rel = (path) => relative(ROOT, path).split(sep).join("/");

/* Class names in selector position. Comments and quoted strings are stripped
   first so a url() or a content: "…" cannot contribute a false name. */
function declaredClasses(css) {
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"[^"]*"|'[^']*'/g, '""');
  const names = new Set();
  for (const block of cleaned.matchAll(/([^{}]+)\{/g)) {
    for (const match of block[1].matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) names.add(match[1]);
  }
  return names;
}

function markupClasses(html) {
  const names = new Set();
  for (const attribute of html.matchAll(/\bclass\s*=\s*"([^"]*)"|\bclass\s*=\s*'([^']*)'/g)) {
    for (const name of (attribute[1] ?? attribute[2]).split(/\s+/).filter(Boolean)) names.add(name);
  }
  return names;
}

/* Whole-word match that treats "-" as part of the word, so "demo-section"
   does not match inside "demo-section-title". */
const mentions = (text, name) =>
  new RegExp(`(?<![\\w-])${name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(?![\\w-])`).test(text);

const reserved = new Set(loadReservedClasses(join(ROOT, "reserved-classes.json")));
const sheets = collect(DEMO, ".css", true);
const pages = [
  ...collect(DEMO, ".html"),
  ...collect(join(ROOT, "site"), ".html"),
  ...collect(join(ROOT, "docs"), ".html"),
];

/* Resolve every <link rel=stylesheet> once, so each sheet knows its consumers. */
const consumers = new Map(sheets.map((sheet) => [sheet, []]));
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  for (const link of html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/g)) {
    if (!/stylesheet/i.test(link[0])) continue;
    const target = resolve(dirname(page), link[1].split(/[?#]/)[0]);
    if (consumers.has(target)) consumers.get(target).push({ page, html });
  }
}

let flagged = 0;

for (const sheet of sheets) {
  const used = consumers.get(sheet);
  const declared = [...declaredClasses(readFileSync(sheet, "utf8"))].sort();

  if (used.length === 0) {
    console.log(`\n${rel(sheet)} — no page links this stylesheet (${declared.length} classes)`);
    flagged += declared.length;
    continue;
  }

  const inMarkup = new Set();
  for (const { html } of used) for (const name of markupClasses(html)) inMarkup.add(name);

  const shadows = declared.filter((name) => reserved.has(name));
  const unused = declared.filter(
    (name) => !inMarkup.has(name) && !used.some(({ html }) => mentions(html, name)),
  );
  const markupOnly = declared.filter(
    (name) => !inMarkup.has(name) && used.some(({ html }) => mentions(html, name)),
  );

  console.log(
    `\n${rel(sheet)} — ${declared.length} classes, ${used.length} consumer${used.length === 1 ? "" : "s"}`,
  );
  if (shadows.length > 0) console.log(`  shadows framework: ${shadows.join(", ")}`);
  if (unused.length > 0) console.log(`  unused:            ${unused.join(", ")}`);
  if (markupOnly.length > 0) console.log(`  markup-only:       ${markupOnly.join(", ")}`);
  if (shadows.length + unused.length + markupOnly.length === 0) console.log("  clean");

  flagged += shadows.length + unused.length + markupOnly.length;
}

console.log(`\n${sheets.length} demo stylesheets surveyed, ${flagged} classes to review.`);
console.log("Report only — a class may be applied by a script rather than by an attribute.");
