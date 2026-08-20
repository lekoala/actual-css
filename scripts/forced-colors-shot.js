/*
 * Forced-colors screenshot — renders a page with forced colors emulated via
 * the DevTools protocol (same pipeline as the DevTools Rendering panel, which
 * a plain --forced-colors CLI flag does not trigger) and saves a full-page PNG.
 *
 * Usage:
 *   bun scripts/forced-colors-shot.js [page] [--scheme light|dark] [--out file.png]
 *
 *   page      path or URL to capture (default: demo/templates/kitchen-sink.html)
 *   --scheme  prefers-color-scheme to emulate alongside (default: light)
 *   --out     output file (default: tmp/forced-colors-<scheme>.png)
 */
import { join } from "node:path";
import { capture, fixtureUrl, readFlags } from "./utils/browser.js";

const ROOT = join(import.meta.dirname, "..");

const args = process.argv.slice(2);
const {
  "--scheme": scheme = "light",
  "--out": out = join(ROOT, "tmp", `forced-colors-${scheme}.png`),
} = readFlags(args, {
  "--scheme": { fallback: "light" },
  "--out": { fallback: "" },
});
const resolvedScheme = scheme === "dark" ? "dark" : "light";
const page = args[0] ?? join(ROOT, "demo", "templates", "kitchen-sink.html");
const pageUrl = fixtureUrl(page);

const saved = await capture(pageUrl, {
  out: out || join(ROOT, "tmp", `forced-colors-${resolvedScheme}.png`),
  mediaFeatures: [
    { name: "forced-colors", value: "active" },
    { name: "prefers-color-scheme", value: resolvedScheme },
  ],
});
console.log(`Saved ${saved} (${pageUrl}, forced-colors + ${resolvedScheme})`);