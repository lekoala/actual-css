/*
 * Version-stamp the demo pages' local asset references.
 *
 * The demos are served from the committed tree (GitHub Pages), where a
 * stylesheet that imports a tree of files can mix assets from different
 * generations in the browser cache. This script rewrites every local
 * <link>/<script> reference to a single coherent bundle and appends a content
 * hash: the URL of an asset changes exactly when its bytes change.
 *
 *   src/css/actual.css            -> dist/actual.css            (core, inlined)
 *   src/css/themes/index.css      -> dist/actual-themes.min.css (themes, inlined)
 *   src/css/optional/(index|*)    -> dist/optional.css          (optional, inlined)
 *   local demo css / dist/actual.js -> unchanged path, hashed in place
 *
 * Idempotent: an existing ?v=<hash> is stripped before re-stamping, so a
 * rebuild with unchanged assets produces no diff. Duplicate references to the
 * same final URL are collapsed to one <link>/<script>.
 *
 * Run after build:dist/build:js (part of build:all). Uses readFileSync/
 * writeFileSync — never a shell pipeline.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEMO = join(ROOT, "demo");

const HASH_LENGTH = 8;

const TAG_RE = /<link\b[^>]*>|<script\b[^>]*>/gi;
const HREF_RE = /href\s*=\s*["']([^"']*)["']/i;
const SRC_RE = /src\s*=\s*["']([^"']*)["']/i;

const VERSION_RE = /[?&]v=[a-f0-9]+$/;

/* Single-bundle mappings for the source trees that used to be imported
   file-by-file. Anything else keeps its path and only gets the hash. */
function mapAsset(url) {
  if (url === "../../src/css/actual.css") return "../../dist/actual.css";
  if (url === "../../src/css/themes/index.css") {
    return "../../dist/actual-themes.min.css";
  }
  if (/^\.\.\/\.\.\/src\/css\/optional\/(?:index|[\w-]+)\.css$/.test(url)) {
    return "../../dist/optional.css";
  }
  return url;
}

function isLocal(url) {
  return !/^(?:[a-z]+:)?\/\//i.test(url) && !/^data:/i.test(url);
}

function contentHash(path) {
  return createHash("sha256")
    .update(readFileSync(path))
    .digest("hex")
    .slice(0, HASH_LENGTH);
}

function walkHtml(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(full));
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function rel(file) {
  return relative(ROOT, file).replaceAll(sep, "/");
}

function stampFile(file) {
  const source = readFileSync(file, "utf8");
  const seen = new Set();
  const missing = [];
  let out = "";
  let last = 0;

  for (const match of source.matchAll(TAG_RE)) {
    out += source.slice(last, match.index);
    last = match.index + match[0].length;

    const tag = match[0];
    const href = HREF_RE.exec(tag)?.[1];
    const src = SRC_RE.exec(tag)?.[1];
    const url = href ?? src;

    /* Only version stylesheet links and scripts; other links (canonical,
       icon, preload…) must keep their exact href. */
    if (!url || !isLocal(url) || (href && !/\brel\s*=\s*["']stylesheet["']/i.test(tag))) {
      out += tag;
      continue;
    }

    const attr = href ? "href" : "src";
    const clean = url.replace(VERSION_RE, "");
    const mapped = mapAsset(clean);
    const abs = resolve(dirname(file), mapped);

    if (!existsSync(abs)) {
      missing.push(`${rel(file)}: ${mapped} does not exist (run build:dist) — left unversioned`);
      out += tag;
      continue;
    }

    const final = `${mapped}?v=${contentHash(abs)}`;
    if (seen.has(final)) {
      continue; // collapse duplicate reference to the same bundle
    }
    seen.add(final);
    out += tag.replace(
      href ? HREF_RE : SRC_RE,
      `${attr}="${final}"`,
    );
  }

  out += source.slice(last);

  if (out !== source) {
    writeFileSync(file, out);
    console.log(`stamped ${rel(file)} (${seen.size} local assets)`);
  }
  return missing;
}

function main() {
  const missing = [];
  for (const file of walkHtml(DEMO)) missing.push(...stampFile(file));
  for (const line of missing) console.warn(`warning: ${line}`);
  console.log(`Stamp check done (${missing.length} missing assets).`);
}

main();