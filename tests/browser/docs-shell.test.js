/* Documentation chrome width contract, driven over Bun.WebView.
 *
 * .center uses a content box so --center-size describes useful content width.
 * The docs shell is also a flex item forced to fill .app-shell; its declared
 * inline size must therefore subtract the two padding edges. */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/docs-shell.html";
const TIMEOUT = 60_000;
const VIEWPORTS = [320, 640, 896, 1200, 1600];

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

it("docs shell never widens the document beyond the viewport", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      for (const width of VIEWPORTS) {
        await view.cdp("Emulation.setDeviceMetricsOverride", {
          width,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await sleep(100);

        const sizes = await view.evaluate(`(() => {
          const root = document.documentElement;
          const shell = document.querySelector(".docs-shell").getBoundingClientRect();
          return {
            client: root.clientWidth,
            scroll: root.scrollWidth,
            shellStart: shell.left,
            shellEnd: shell.right,
          };
        })()`);

        expect(`${width}: ${sizes.scroll}`).toBe(`${width}: ${sizes.client}`);
        expect(sizes.shellStart).toBeGreaterThanOrEqual(-1);
        expect(sizes.shellEnd).toBeLessThanOrEqual(sizes.client + 1);
      }
    },
    { artifactName: "docs-shell-width" },
  );
});
