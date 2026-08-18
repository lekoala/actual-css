/*
 * Page screenshot — renders a page in headless Chrome and saves a full-page
 * PNG. Use it to eyeball a demo page or doc example after a change without
 * opening a browser.
 *
 * Usage:
 *   bun scripts/page-shot.js [page] [--scheme light|dark] [--out file.png]
 *
 *   page      path or URL to capture (default: demo/templates/kitchen-sink.html)
 *   --scheme  prefers-color-scheme to emulate (default: browser default)
 *   --out     output file (default: tmp/page-shot.png)
 */
import { join } from "node:path";
import { capture, readFlags, toFileUrl } from "./utils/chrome-shot.js";

const ROOT = join(import.meta.dirname, "..");

const args = process.argv.slice(2);
const { "--scheme": scheme = "", "--out": out = join(ROOT, "tmp", "page-shot.png") } =
  readFlags(args, {
    "--scheme": { fallback: "" },
    "--out": { fallback: join(ROOT, "tmp", "page-shot.png") },
  });
const page = args[0] ?? join(ROOT, "demo", "templates", "kitchen-sink.html");
const pageUrl = toFileUrl(page);

const mediaFeatures =
  scheme === "light" || scheme === "dark"
    ? [{ name: "prefers-color-scheme", value: scheme }]
    : [];

const saved = await capture(pageUrl, { out, mediaFeatures });
console.log(`Saved ${saved} (${pageUrl}${scheme ? `, ${scheme}` : ""})`);