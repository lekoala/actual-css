/* Documentation chrome width contract, driven over Bun.WebView.
 *
 * .center uses a content box so --center-size describes useful content width.
 * The docs shell is also a flex item forced to fill .app-shell; its declared
 * inline size must therefore subtract the two padding edges. */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

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

/* The compact header is a single row at every width: brand + controls, with
 * the theme select dropped to the drawer below 32rem. A wrapping cluster would
 * silently reintroduce the stacked logo / theme / Search+Menu header, so guard
 * the height instead of the markup. One row is the tallest control (select,
 * --control-size 38px) plus the header's two --space-30 edges (24px); a wrapped
 * header roughly doubles that. */
const ONE_ROW_HEIGHT = 64;

it("docs header stays a single row", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      for (const width of [320, 360, 512, 640, 896, 1200]) {
        await view.cdp("Emulation.setDeviceMetricsOverride", {
          width,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
        // Wait for the breakpoint decision rather than a fixed delay: reading
        // before the media query re-resolves was the CI flake (a stale row at
        // the previous width). The height is final once the theme field's
        // visibility matches this width.
        const themeVisible = width > 528;
        await waitForBrowser(
          view,
          `(() => {
            const field = document.querySelector(".docs-header-inner .docs-theme-field");
            return (getComputedStyle(field).display !== "none") === ${themeVisible};
          })()`,
        );

        const height = await view.evaluate(`(() => {
          const header = document.querySelector(".docs-header-inner");
          const theme = document.querySelector(".docs-header-inner .docs-theme-field");
          return {
            height: Math.round(header.getBoundingClientRect().height),
            themeVisible: getComputedStyle(theme).display !== "none",
          };
        })()`);

        expect(`${width}: ${height.height <= ONE_ROW_HEIGHT}`).toBe(`${width}: true`);
        expect(`${width}: ${height.themeVisible}`).toBe(`${width}: ${width > 528}`);
      }
    },
    { artifactName: "docs-header-row" },
  );
});
