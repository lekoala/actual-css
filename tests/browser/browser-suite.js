import { afterAll, beforeAll, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  setViewport,
  tabUntil,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

// Opt in from suites that exercise the same contract in every engine.
export async function browserSuite() {
  const engine = process.env.ACTUAL_TEST_BROWSER;
  const baseTest = engine || (await browserAvailable()) ? test : test.skip;
  const it = (name, run) => baseTest(name, run, 60_000);

  if (!engine) return { it, clickSelector, setViewport, tabUntil, withBrowserPage };

  let browser;
  beforeAll(async () => {
    const { [engine]: browserType } = await import("playwright");
    browser = await browserType.launch();
  }, 60_000);
  // Same budget as the launch: under load Firefox can take over the default
  // 5s to close, which failed the file as an "(unnamed)" hook timeout.
  afterAll(() => browser?.close(), 60_000);

  return {
    it,
    clickSelector: (page, selector) => page.locator(selector).click(),
    // Real Tab presses, like the CDP helper: focus assertions need dispatched input.
    // Trap: WebKit on macOS follows the system setting, where Tab only reaches
    // text fields and lists; buttons and links need Option+Tab. CI runs WebKit
    // on macOS, so a test that tabbed to a button passed on Windows and failed there.
    async tabUntil(page, expression, { max = 12 } = {}) {
      const key = engine === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";
      for (let i = 0; i < max; i++) {
        if (await page.evaluate(`!!(${expression})`)) return true;
        await page.keyboard.press(key);
      }
      return await page.evaluate(`!!(${expression})`);
    },
    setViewport: (page, { width, height = 900 }) => page.setViewportSize({ width, height }),
    async withBrowserPage(url, run, { width = 1100, height = 900 } = {}) {
      const page = await browser.newPage({ viewport: { width, height } });
      try {
        await page.goto(url);
        return await run(page);
      } finally {
        await page.close();
      }
    },
  };
}
