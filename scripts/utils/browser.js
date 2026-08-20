/*
 * Actual CSS browser-test ergonomics on top of Bun.WebView.
 *
 * Bun owns the Chrome lifecycle (one headless Chrome per Bun process, one tab
 * per view, temp profile, cleanup at exit). This helper only encodes the
 * project's conventions: fixture URLs, availability gating, reduced-motion
 * emulation, and failure artifacts (screenshot + page console).
 *
 * Contrast with scripts/utils/chrome.js: that module is the hand-rolled CDP
 * browser runtime; this one assumes Bun.WebView is the runtime.
 */

import { mkdir } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function fixtureUrl(page, cwd = process.cwd()) {
  if (/^https?:/.test(page)) return page;
  return pathToFileURL(isAbsolute(page) ? page : join(cwd, page)).href;
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