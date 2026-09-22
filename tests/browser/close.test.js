/*
 * Real-browser .close contract, driven over Bun.WebView.
 *
 * One control, placed by its container: the dialog surfaces pin it to their
 * corner only at the documented positions, so a .close inside content (an
 * alert in a modal body) keeps its container's geometry; alert and badge size
 * it through the hooks they declare, and the badge never drops the target
 * below 24px.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/close.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("dialog corners pin the close, content keeps its own, containers size it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const style = (selector) => getComputedStyle(document.querySelector(selector));
        const box = (selector) => Math.round(document.querySelector(selector).getBoundingClientRect().width);
        return {
          modalCorner: style("#modal > .close").position,
          drawerCorner: style("#drawer .close").position,
          nested: style("#modal .alert .close").position,
          nestedSize: style("#modal .alert .close").inlineSize,
          badgeTarget: box("#badge .close"),
        };
      })()`);

      expect(result.modalCorner).toBe("absolute");
      expect(result.drawerCorner).toBe("absolute");
      expect(result.nested).toBe("static");
      expect(result.nestedSize).toBe("28px");
      expect(result.badgeTarget).toBeGreaterThanOrEqual(24);
    },
    { artifactName: "close" },
  );
});
