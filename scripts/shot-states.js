/*
 * Media-state screenshots — renders a page under each named media emulation
 * and saves one full-page PNG per state. Use it to eyeball reduced-motion,
 * forced-colors and contrast variants without a tmp/ script per state.
 *
 * Usage:
 *   bun scripts/shot-states.js [page] [--states motion,reduced,forced,contrast]
 *       [--width 700] [--scheme light|dark]
 *       [--force ".f:focus+focus-visible"] [--eval file.js] [--out dir]
 *
 *   page       path or URL to capture (default: demo/templates/kitchen-sink.html)
 *   --states   comma-separated states (default: motion,reduced,forced)
 *   --width    exact layout viewport width, forced with device metrics
 *              (default: browser default window)
 *   --scheme   prefers-color-scheme to emulate alongside each state
 *              (default: browser default)
 *   --force    forced pseudo-states, `sel:pseudo+pseudo; sel2:hover`
 *              (selectors with `:has()` use the `sel=pseudos` form)
 *   --eval     JS file evaluated in the page before each capture (e.g. theme
 *              switch, frozen animations)
 *   --out      output directory (default: tmp/shot-states); each state writes
 *              <page basename>-<state>.png
 */
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import {
  capture,
  fixtureUrl,
  forceStates,
  MEDIA_STATES,
  parseForceFlag,
  readFlags,
} from "./utils/browser.js";

const ROOT = join(import.meta.dirname, "..");

const args = process.argv.slice(2);
const {
  "--states": statesArg = "motion,reduced,forced",
  "--width": widthArg = "",
  "--scheme": scheme = "",
  "--force": forceArg = "",
  "--eval": evalFile = "",
  "--out": outDir = join(ROOT, "tmp", "shot-states"),
} = readFlags(args, {
  "--states": { fallback: "motion,reduced,forced" },
  "--width": { fallback: "" },
  "--scheme": { fallback: "" },
  "--force": { fallback: "" },
  "--eval": { fallback: "" },
  "--out": { fallback: join(ROOT, "tmp", "shot-states") },
});

const states = statesArg
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const unknown = states.filter((s) => !(s in MEDIA_STATES));
if (states.length === 0 || unknown.length > 0) {
  console.error(
    `shot:states: --states expects any of ${Object.keys(MEDIA_STATES).join(",")}, received "${statesArg}".`,
  );
  process.exit(1);
}
const width = widthArg ? Number(widthArg) : undefined;
if (widthArg && !Number.isFinite(width)) {
  console.error(`shot:states: --width expects a number, received "${widthArg}".`);
  process.exit(1);
}
if (scheme && scheme !== "light" && scheme !== "dark") {
  console.error(`shot:states: --scheme expects light|dark, received "${scheme}".`);
  process.exit(1);
}
let forceEntries = {};
try {
  forceEntries = parseForceFlag(forceArg);
} catch (error) {
  console.error(`shot:states: ${error.message}`);
  process.exit(1);
}
const program = evalFile ? await readFile(evalFile, "utf8") : "";

const page = args[0] ?? join(ROOT, "demo", "templates", "kitchen-sink.html");
const pageUrl = fixtureUrl(page);
const stem = basename(page).replace(/\.[^.]+$/, "");
const schemeFeatures =
  scheme === "light" || scheme === "dark" ? [{ name: "prefers-color-scheme", value: scheme }] : [];

const saved = [];
for (const state of states) {
  const out = join(outDir, `${stem}-${state}.png`);
  await capture(pageUrl, {
    out,
    width,
    mediaFeatures: [...MEDIA_STATES[state], ...schemeFeatures],
    beforeShot:
      program || Object.keys(forceEntries).length > 0
        ? async (view) => {
            if (program) await view.evaluate(`(() => { ${program} })()`);
            if (Object.keys(forceEntries).length > 0) await forceStates(view, forceEntries);
          }
        : undefined,
  });
  saved.push(out);
}

console.log(`Saved ${saved.length} screenshots:`);
for (const path of saved) console.log(`  ${path}`);
