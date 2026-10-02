/*
 * Actual CSS browser ergonomics on top of Bun.WebView.
 *
 * Bun owns the Chrome lifecycle (one headless Chrome per Bun process, one tab
 * per view, temp profile, cleanup at exit). This module only encodes the
 * project's conventions on top of it: fixture URLs, availability gating,
 * reduced-motion/color-scheme emulation, failure artifacts (screenshot + page
 * console), and the full-page `capture` used by the shot: scripts.
 *
 * Interaction helpers encode the tmp/0.11 conventions: exact viewports with
 * `setViewport`, forced pseudo-states with `forceStates`, real dispatched
 * input with `clickAt`/`clickSelector`/`pressKey`/`tabUntil` (never `.click()`
 * for focus paths), and measured crops with `elementRect`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Wait for an observable browser state rather than guessing how many
 * animation frames or positioning ticks a machine will need. */
export function waitForBrowser(view, expression, { timeoutMs = 5000 } = {}) {
  return view.evaluate(`new Promise((resolve, reject) => {
    const deadline = performance.now() + ${timeoutMs};
    const check = () => {
      if (${expression}) return resolve(true);
      if (performance.now() >= deadline) {
        return reject(new Error("Timed out waiting for: " + ${JSON.stringify(expression)}));
      }
      requestAnimationFrame(check);
    };
    check();
  })`);
}

export function fixtureUrl(page, cwd = process.cwd()) {
  if (/^https?:/.test(page)) return page;
  return pathToFileURL(isAbsolute(page) ? page : join(cwd, page)).href;
}

/*
 * Consumes flags out of `args` (in place) and returns them keyed by flag.
 * A `--flag value` pair falls back to `fallback` when absent; a
 * `{ boolean: true }` flag takes no value and reads as true or false.
 */
export function readFlags(args, spec) {
  const values = {};
  for (const [flag, { fallback, boolean = false }] of Object.entries(spec)) {
    const index = args.indexOf(flag);
    if (boolean) {
      values[flag] = index !== -1;
      if (index !== -1) args.splice(index, 1);
      continue;
    }
    values[flag] = index === -1 ? fallback : args[index + 1];
    if (index !== -1) args.splice(index, 2);
  }
  return values;
}

/*
 * Built stylesheets and their sources. Demo pages link dist/ and the demo
 * themes bundle, which agents do not rebuild, so a probe or shot of a demo
 * silently measured stale CSS. CSS only: dist/actual.full.js maps to an ES
 * module entry, a different load model and execution timing.
 */
const SOURCE_CSS = [
  [/\/dist\/actual\.full(?:\.min)?\.css$/, "/src/css/actual.full.css"],
  [/\/(?:demo|site)\/assets\/actual-themes\.min\.css$/, "/src/css/themes/index.css"],
];

/*
 * Points every built stylesheet link of the loaded page at its source and
 * resolves once each replacement (imports included) has loaded, so the caller
 * never reads a style computed between the two sheets. Returns the swaps.
 * Page scripts have already run against the built CSS; measure after them.
 */
export async function useSourceCss(view) {
  const map = SOURCE_CSS.map(([pattern, source]) => [pattern.source, source]);
  return view.evaluate(`(async () => {
    const map = ${JSON.stringify(map)};
    const swaps = [];
    const loads = [];
    for (const link of document.querySelectorAll('link[rel~="stylesheet"][href]')) {
      const built = new URL(link.href);
      const entry = map.find(([pattern]) => new RegExp(pattern).test(built.pathname));
      if (!entry) continue;
      const source = new URL(built.pathname.replace(new RegExp(entry[0]), entry[1]), built);
      loads.push(new Promise((resolve, reject) => {
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", () => reject(new Error("--src-css could not load " + source.href)), { once: true });
      }));
      link.href = source.href;
      swaps.push(decodeURI(built.pathname) + " -> " + decodeURI(source.pathname));
    }
    await Promise.all(loads);
    return swaps;
  })()`);
}

let available;
export async function browserAvailable(createView = () => new Bun.WebView({ backend: "chrome" })) {
  if (available !== undefined) return available;
  try {
    const view = createView();
    view.close();
    available = true;
  } catch (error) {
    if (process.env.CI) throw error;
    available = false;
  }
  return available;
}

/*
 * Opens a headless-Chrome tab, navigates to `url`, and runs `run(view)`.
 * Resolves to the value returned by `run`. The tab is closed on the way out.
 *
 * `mediaFeatures` (e.g. prefers-reduced-motion) are emulated before fixture
 * navigation so the page sees them from the first render. `sourceCss` swaps
 * built stylesheets for their sources before `run` (see useSourceCss) and
 * reports the swaps on stderr. Page `console.*`
 * calls are captured; on failure they are appended to the error and, when
 * `artifactName` is set, a screenshot is written under `artifactsDir`.
 */
export async function withBrowserPage(
  url,
  run,
  {
    width = 1100,
    height = 900,
    mediaFeatures = [],
    settleMs = 0,
    sourceCss = false,
    artifactName,
    artifactsDir = "tmp/0.4/screenshots",
  } = {},
) {
  const consoleLines = [];
  await using view = new Bun.WebView({
    backend: "chrome",
    width,
    height,
    console: (type, ...args) => consoleLines.push([type, ...args.map(String)]),
  });

  if (mediaFeatures.length > 0) {
    // Bun.WebView creates its CDP session on first navigation. Use a blank
    // document so the fixture itself still loads only once under emulation.
    await view.navigate("about:blank");
    await view.cdp("Emulation.setEmulatedMedia", { features: mediaFeatures });
  }
  await view.navigate(url);
  if (sourceCss) {
    const swaps = await useSourceCss(view);
    console.error(
      swaps.length > 0
        ? `--src-css:\n  ${swaps.join("\n  ")}`
        : "--src-css: no built stylesheet on this page; it already renders its sources",
    );
  }
  if (settleMs > 0) await wait(settleMs);

  try {
    return await run(view);
  } catch (error) {
    if (artifactName) {
      const png = await view.screenshot().catch(() => null);
      if (png) {
        await mkdir(artifactsDir, { recursive: true });
        await Bun.write(join(artifactsDir, `${artifactName}.png`), png);
      }
    }
    if (consoleLines.length > 0) {
      const dump = consoleLines.map(([type, ...args]) => `${type}: ${args.join(" ")}`).join("\n");
      error.message = `${error.message}\n[browser console]\n${dump}`;
    }
    throw error;
  }
}

/*
 * Opens a headless-Chrome tab, navigates to `pageUrl`, applies the given media
 * emulation, and saves a full-page screenshot to `out`. Returns `out`.
 *
 * `width` forces the exact layout viewport with device metrics — more reliable
 * than the view size alone, because headless Chrome clamps window dimensions
 * to a platform minimum. `beforeShot(view)` runs after load/settle and before
 * the capture — use it to set state a screenshot needs (e.g. a theme).
 */
export async function capture(
  pageUrl,
  { out, mediaFeatures = [], settleMs = 400, width, beforeShot, sourceCss = false } = {},
) {
  await withBrowserPage(
    pageUrl,
    async (view) => {
      if (width) {
        await setViewport(view, { width });
      }
      if (beforeShot) await beforeShot(view);
      const shot = await view.cdp("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
      });
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, Buffer.from(shot.data, "base64"));
    },
    { mediaFeatures, settleMs, sourceCss },
  );
  return out;
}

/*
 * Exact layout viewport with device metrics — more reliable than the view
 * size alone, because headless Chrome clamps window dimensions to a platform
 * minimum (e.g. ~512px on Windows makes a "360px" probe silently render wide).
 */
export async function setViewport(view, { width, height = 900, scale = 1 } = {}) {
  await view.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: false,
  });
}

/*
 * Force pseudo-states (focus, hover, focus-visible…) on every node matching
 * each selector. Compact form of the DOM.getDocument + querySelectorAll +
 * CSS.forcePseudoState block copied across the tmp/0.11 focus shots.
 */
export async function forceStates(view, entries) {
  const selectors = Object.keys(entries);
  if (selectors.length === 0) return 0;
  await view.cdp("DOM.enable");
  await view.cdp("CSS.enable");
  const { root } = await view.cdp("DOM.getDocument", { depth: -1 });
  let forced = 0;
  for (const [selector, pseudos] of Object.entries(entries)) {
    const { nodeIds } = await view.cdp("DOM.querySelectorAll", { nodeId: root.nodeId, selector });
    for (const nodeId of nodeIds ?? []) {
      await view.cdp("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: pseudos });
      forced += 1;
    }
  }
  return forced;
}

/*
 * Parses `--force "sel1:pseudo+pseudo; sel2:hover"`. Entries split on `;`
 * (selectors may contain commas); selector and pseudos split on the last
 * `=` or `:` so selectors with `:has()` use the `sel=pseudos` form.
 */
export function parseForceFlag(spec) {
  const entries = {};
  if (!spec) return entries;
  for (const chunk of spec.split(";")) {
    const entry = chunk.trim();
    if (!entry) continue;
    const cut = Math.max(entry.lastIndexOf("="), entry.lastIndexOf(":"));
    if (cut === -1)
      throw new Error(`--force expects "selector:pseudo+pseudo", received "${entry}".`);
    const selector = entry.slice(0, cut).trim();
    const pseudos = entry
      .slice(cut + 1)
      .split("+")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!selector || pseudos.length === 0) {
      throw new Error(`--force expects "selector:pseudo+pseudo", received "${entry}".`);
    }
    entries[selector] = pseudos;
  }
  return entries;
}

/*
 * Real dispatched click. `.click()` runs the handler without focusing the
 * element, so any focus assertion written against it describes a path no
 * user takes — always dispatch through CDP once focus is involved.
 */
export async function clickAt(view, x, y) {
  for (const type of ["mousePressed", "mouseReleased"]) {
    await view.cdp("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
  }
}

export async function clickSelector(view, selector) {
  const point = await view.evaluate(`(() => {
    const rect = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  })()`);
  await clickAt(view, point.x, point.y);
  return point;
}

/* `rawKeyDown` + `keyUp` is the CDP pair the tmp/0.11 Tab walkers converge on. */
export async function pressKey(view, key = "Tab", { code, windowsVirtualKeyCode, modifiers } = {}) {
  const defaults = { Tab: 9, Enter: 13, Escape: 27, " ": 32 };
  const virtual = windowsVirtualKeyCode ?? defaults[key];
  const event = { key, code: code ?? (key === " " ? "Space" : key) };
  if (virtual !== undefined) event.windowsVirtualKeyCode = virtual;
  if (modifiers !== undefined) event.modifiers = modifiers;
  await view.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", ...event });
  await view.cdp("Input.dispatchKeyEvent", { type: "keyUp", ...event });
}

/* Tab until `expression` holds (e.g. the right input is focused). */
export async function tabUntil(view, expression, { max = 12 } = {}) {
  for (let i = 0; i < max; i++) {
    if (await view.evaluate(`!!(${expression})`)) return true;
    await pressKey(view, "Tab");
  }
  return await view.evaluate(`!!(${expression})`);
}

/*
 * Measured rect of `selector` in page coordinates, expanded by `padding`.
 * Throws when nothing matches so a crop never silently captures 0x0.
 */
export async function elementRect(view, selector, { padding = 0 } = {}) {
  const rect = await view.evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
  })()`);
  if (!rect) throw new Error(`No match for selector ${JSON.stringify(selector)}.`);
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

/* Media presets shared by shot:states (and ad-hoc tmp/ captures). */
export const MEDIA_STATES = {
  motion: [],
  reduced: [{ name: "prefers-reduced-motion", value: "reduce" }],
  forced: [{ name: "forced-colors", value: "active" }],
  contrast: [{ name: "prefers-contrast", value: "more" }],
};
