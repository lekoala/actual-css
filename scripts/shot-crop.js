/*
 * Cropped screenshot — renders a page in headless Chrome and saves a PNG of
 * the element matching a selector, plus padding. The single-crop counterpart
 * to shot:page: one crop per invocation (a page with N targets is N calls).
 *
 * Usage:
 *   bun scripts/shot-crop.js [page] --selector <css> [--padding 40]
 *       [--scale 1.5] [--width 1280] [--scheme light|dark]
 *       [--force ".f:focus+focus-visible; .h:hover"] [--eval file.js]
 *       [--wait "expr"] [--top-layer] [--out file.png]
 *
 *   page        path or URL to capture (default: demo/templates/kitchen-sink.html)
 *   --selector  CSS selector of the element to crop (required)
 *   --padding   pixels around the element rect (default: 40)
 *   --scale     clip scale factor (default: 1.5)
 *   --width     exact layout viewport width, forced with device metrics
 *               (default: 1280)
 *   --scheme    prefers-color-scheme to emulate (default: browser default)
 *   --force     forced pseudo-states, `sel:pseudo+pseudo; sel2:hover`
 *               (selectors with `:has()` use the `sel=pseudos` form)
 *   --eval      JS file evaluated in the page before capture (e.g. theme
 *               switch, frozen animations)
 *   --wait      browser state to wait for (default: the selector exists)
 *   --top-layer capture with captureBeyondViewport off, for open popovers or
 *               modal dialogs (the flag on mis-composites top-layer content)
 *   --out       output file (default: tmp/crop-<page basename>.png)
 */
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import {
  elementRect,
  fixtureUrl,
  forceStates,
  parseForceFlag,
  readFlags,
  setViewport,
  waitForBrowser,
  withBrowserPage,
} from "./utils/browser.js";

const ROOT = join(import.meta.dirname, "..");

let args = process.argv.slice(2);
const topLayer = args.includes("--top-layer");
args = args.filter((arg) => arg !== "--top-layer");
const {
  "--selector": selector = "",
  "--padding": paddingArg = "40",
  "--scale": scaleArg = "1.5",
  "--width": widthArg = "1280",
  "--scheme": scheme = "",
  "--force": forceArg = "",
  "--eval": evalFile = "",
  "--wait": waitArg = "",
  "--out": outArg = "",
} = readFlags(args, {
  "--selector": { fallback: "" },
  "--padding": { fallback: "40" },
  "--scale": { fallback: "1.5" },
  "--width": { fallback: "1280" },
  "--scheme": { fallback: "" },
  "--force": { fallback: "" },
  "--eval": { fallback: "" },
  "--wait": { fallback: "" },
  "--out": { fallback: "" },
});

if (!selector) {
  console.error("shot:crop: --selector is required.");
  process.exit(1);
}
const padding = Number(paddingArg);
const scale = Number(scaleArg);
const width = Number(widthArg);
if (!Number.isFinite(padding) || !Number.isFinite(scale) || !Number.isFinite(width)) {
  console.error(
    `shot:crop: --padding, --scale and --width expect numbers, received "${paddingArg}", "${scaleArg}", "${widthArg}".`,
  );
  process.exit(1);
}
let forceEntries = {};
try {
  forceEntries = parseForceFlag(forceArg);
} catch (error) {
  console.error(`shot:crop: ${error.message}`);
  process.exit(1);
}
const program = evalFile ? await readFile(evalFile, "utf8") : "";

const page = args[0] ?? join(ROOT, "demo", "templates", "kitchen-sink.html");
const pageUrl = fixtureUrl(page);
const stem = basename(page).replace(/\.[^.]+$/, "");
const out = outArg || join(ROOT, "tmp", `crop-${stem}.png`);
const mediaFeatures =
  scheme === "light" || scheme === "dark" ? [{ name: "prefers-color-scheme", value: scheme }] : [];

await withBrowserPage(
  pageUrl,
  async (view) => {
    await setViewport(view, { width, height: 900 });
    await waitForBrowser(view, waitArg || `document.querySelector(${JSON.stringify(selector)})`, {
      timeoutMs: 15000,
    });
    if (program) await view.evaluate(`(() => { ${program} })()`);
    if (Object.keys(forceEntries).length > 0) await forceStates(view, forceEntries);
    // Size the viewport to the full height so the clip rect is in range.
    const { height } = await view.evaluate(`({ height: document.documentElement.scrollHeight })`);
    await setViewport(view, { width, height: Math.ceil(height) });
    const rect = await elementRect(view, selector, { padding });
    const { data } = await view.cdp("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: !topLayer,
      clip: { ...rect, scale },
    });
    await Bun.write(out, Buffer.from(data, "base64"));
  },
  { mediaFeatures },
);
console.log(`Saved ${out} (${pageUrl}, ${selector})`);
