/*
 * Page screenshot — renders a page in headless Chrome and saves a full-page
 * PNG. Use it to eyeball a demo page or doc example after a change without
 * opening a browser.
 *
 * Usage:
 *   bun scripts/page-shot.js [page] [--width 1280] [--scheme light|dark]
 *       [--out file.png]
 *
 *   page      path or URL to capture (default: demo/templates/kitchen-sink.html)
 *   --width   exact layout viewport width, forced with device metrics (as in
 *             shot:multi and probe). Headless Chrome clamps --window-size to a
 *             platform minimum, so the flag is the only reliable way to pin a
 *             width; without it the capture uses the default window size.
 *   --scheme  prefers-color-scheme to emulate (default: browser default)
 *   --out     output file (default: tmp/page-shot.png)
 */
import { join } from "node:path";
import { capture, fixtureUrl, readFlags } from "./utils/browser.js";

const ROOT = join(import.meta.dirname, "..");

const args = process.argv.slice(2);
const {
  "--scheme": scheme = "",
  "--out": out = join(ROOT, "tmp", "page-shot.png"),
  "--width": widthArg = "",
} = readFlags(args, {
  "--scheme": { fallback: "" },
  "--out": { fallback: join(ROOT, "tmp", "page-shot.png") },
  "--width": { fallback: "" },
});
const width = widthArg ? Number(widthArg) : undefined;
if (widthArg && !Number.isFinite(width)) {
  console.error(`page-shot: --width expects a number, received "${widthArg}".`);
  process.exit(1);
}
const page = args[0] ?? join(ROOT, "demo", "templates", "kitchen-sink.html");
const pageUrl = fixtureUrl(page);

const mediaFeatures =
  scheme === "light" || scheme === "dark" ? [{ name: "prefers-color-scheme", value: scheme }] : [];

const saved = await capture(pageUrl, { out, mediaFeatures, width });
console.log(
  `Saved ${saved} (${pageUrl}${width ? `, ${width}px` : ""}${scheme ? `, ${scheme}` : ""})`,
);
