import { afterAll, beforeAll, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  setViewport,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

// Opt in from suites that exercise the same contract in every engine.
export async function browserSuite() {
  const engine = process.env.ACTUAL_TEST_BROWSER;
  const baseTest = engine || (await browserAvailable()) ? test : test.skip;
  const it = (name, run) => baseTest(name, run, 60_000);

  if (!engine) return { it, clickSelector, setViewport, withBrowserPage };

  let browser;
  beforeAll(async () => {
    const { [engine]: browserType } = await import("playwright");
    browser = await browserType.launch();
  }, 60_000);
  afterAll(() => browser?.close());

  return {
    it,
    clickSelector: (page, selector) => page.locator(selector).click(),
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
