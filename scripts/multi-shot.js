/*
 * Multi-width screenshots — renders a page in headless Chrome at several
 * viewport widths and saves one full-page PNG per width. Use it to eyeball
 * responsive behaviour of a demo page or template across the meaningful
 * widths without opening a browser.
 *
 * Usage:
 *   bun scripts/multi-shot.js [page] [--widths 360,640,900,1280]
 *       [--scheme light|dark] [--out dir]
 *
 *   page       path or URL to capture (default: demo/templates/kitchen-sink.html)
 *   --widths   comma-separated viewport widths (default: 360,640,900,1280)
 *   --scheme   prefers-color-scheme to emulate (default: browser default)
 *   --out      output directory (default: tmp/multi-shot); each width writes
 *              <page basename>-<width>.png
 *
 * The exact layout viewport is forced with Emulation.setDeviceMetricsOverride:
 * headless Chrome clamps --window-size to a platform minimum (e.g. ~512px on
 * Windows), so the window flag alone cannot reach mobile widths reliably.
 */
import { basename, join } from "node:path";
import { capture, fixtureUrl, readFlags } from "./utils/browser.js";

const ROOT = join(import.meta.dirname, "..");

const args = process.argv.slice(2);
const {
  "--widths": widthsArg = "360,640,900,1280",
  "--scheme": scheme = "",
  "--out": outDir = join(ROOT, "tmp", "multi-shot"),
} = readFlags(args, {
  "--widths": { fallback: "360,640,900,1280" },
  "--scheme": { fallback: "" },
  "--out": { fallback: join(ROOT, "tmp", "multi-shot") },
});

const page = args[0] ?? join(ROOT, "demo", "templates", "kitchen-sink.html");
const pageUrl = fixtureUrl(page);
const widths = widthsArg.split(",").map((w) => Number(w.trim()));

const mediaFeatures =
  scheme === "light" || scheme === "dark"
    ? [{ name: "prefers-color-scheme", value: scheme }]
    : [];

const stem = basename(page).replace(/\.[^.]+$/, "");
const saved = [];
for (const width of widths) {
  const out = join(outDir, `${stem}-${width}.png`);
  await capture(pageUrl, { out, mediaFeatures, width });
  saved.push(out);
}

console.log(`Saved ${saved.length} screenshots:`);
for (const path of saved) console.log(`  ${path}`);