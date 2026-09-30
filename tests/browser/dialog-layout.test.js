/* Confirmation-dialog geometry, driven over Bun.WebView. */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/dialog-layout.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("confirmation copy shares one column and its title centers on the icon", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
        const icon = rect(".dialog-icon");
        const title = rect("h3");
        const copy = rect("header p");
        return {
          centerDrift: Math.abs((icon.top + icon.bottom) / 2 - (title.top + title.bottom) / 2),
          columnDrift: Math.abs(title.left - copy.left),
        };
      })()`);

      expect(result.centerDrift).toBeLessThanOrEqual(0.5);
      expect(result.columnDrift).toBeLessThanOrEqual(0.5);
    },
    { artifactName: "dialog-layout" },
  );
});

it("a direct header aligns its title, icon, close, and additional controls", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const root = document.getElementById("header-dialog");
        const rect = (selector) => root.querySelector(selector).getBoundingClientRect();
        const center = (box) => (box.top + box.bottom) / 2;
        const title = rect("h2");
        const icon = rect(".dialog-icon");
        const close = rect("#header-close");
        const extra = rect("#header-extra");
        return {
          iconDrift: Math.abs(center(title) - center(icon)),
          closeDrift: Math.abs(center(title) - center(close)),
          extraDrift: Math.abs(center(title) - center(extra)),
          closePosition: getComputedStyle(root.querySelector("#header-close")).position,
        };
      })()`);

      expect(result.iconDrift).toBeLessThanOrEqual(0.5);
      expect(result.closeDrift).toBeLessThanOrEqual(0.5);
      expect(result.extraDrift).toBeLessThanOrEqual(0.5);
      expect(result.closePosition).toBe("static");
    },
    { artifactName: "dialog-header-layout" },
  );
});
