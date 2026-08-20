/*
 * Actual CSS browser ergonomics on top of Bun.WebView.
 *
 * Bun owns the Chrome lifecycle (one headless Chrome per Bun process, one tab
 * per view, temp profile, cleanup at exit). This module only encodes the
 * project's conventions on top of it: fixture URLs, availability gating,
 * reduced-motion/color-scheme emulation, failure artifacts (screenshot + page
 * console), and the full-page `capture` used by the shot: scripts.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function fixtureUrl(page, cwd = process.cwd()) {
  if (/^https?:/.test(page)) return page;
  return pathToFileURL(isAbsolute(page) ? page : join(cwd, page)).href;
}

/*
 * Consumes `--flag value` pairs out of `args` (in place) and returns them keyed
 * by flag, falling back to `fallback` when the flag is absent.
 */
export function readFlags(args, spec) {
  const values = {};
  for (const [flag, { fallback }] of Object.entries(spec)) {
    const index = args.indexOf(flag);
    values[flag] = index === -1 ? fallback : args[index + 1];
    if (index !== -1) args.splice(index, 2);
  }
  return values;
}

let available;
export async function browserAvailable() {
  if (available !== undefined) return available;
  try {
    const view = new Bun.WebView({ backend: "chrome" });
    view.close();
    available = true;
  } catch {
    available = false;
  }
  return available;
}

/*
 * Opens a headless-Chrome tab, navigates to `url`, and runs `run(view)`.
 * Resolves to the value returned by `run`. The tab is closed on the way out.
 *
 * `mediaFeatures` (e.g. prefers-reduced-motion) are emulated before the final
 * load so the page sees them from the first real render. Page `console.*`
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
    settleMs = 400,
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

  await view.navigate(url);
  if (mediaFeatures.length > 0) {
    await view.cdp("Emulation.setEmulatedMedia", { features: mediaFeatures });
    await view.navigate(url);
  }
  await wait(settleMs);

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
  { out, mediaFeatures = [], settleMs = 400, width, beforeShot } = {},
) {
  await withBrowserPage(
    pageUrl,
    async (view) => {
      if (width) {
        await view.cdp("Emulation.setDeviceMetricsOverride", {
          width,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
      }
      if (beforeShot) await beforeShot(view);
      const shot = await view.cdp("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
      });
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, Buffer.from(shot.data, "base64"));
    },
    { mediaFeatures, settleMs },
  );
  return out;
}