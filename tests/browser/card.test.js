/*
 * Real-browser .card footer contract, driven over Bun.WebView.
 *
 * A direct card footer is anchored to the card's bottom edge when extra block
 * space is available, so price/action rows align across equal-height cards in
 * a grid. This holds for bare .card, for .card.stack (specificity over
 * .stack > * { margin-block: 0 }), and for footer.bleed.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/card.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

it("bare cards anchor their footers to one bottom line across an equal-height grid", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.cdp("Emulation.setDeviceMetricsOverride", {
        width: 1200,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await sleep(150);

      const rows = await view.evaluate(`(() =>
        [...document.querySelectorAll("#equal > .card")].map((el) =>
          Math.round(el.getBoundingClientRect().top),
        ))()`);
      // All three cards share one grid row.
      expect(new Set(rows).size).toBe(1);

      const footers = await view.evaluate(`(() =>
        [...document.querySelectorAll("#equal > .card > footer")].map((el) =>
          Math.round(el.getBoundingClientRect().bottom),
        ))()`);
      // Footers land on the same bottom line despite different body lengths.
      expect(new Set(footers).size).toBe(1);
    },
    { artifactName: "card-equal" },
  );
});

it("card.stack and footer.bleed keep the anchored footer", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.cdp("Emulation.setDeviceMetricsOverride", {
        width: 900,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await sleep(150);

      const anchored = (selector, bleed = false) =>
        view.evaluate(`(() => {
          const card = document.querySelector(${JSON.stringify(`${selector} > .card`)});
          const footer = card.querySelector("footer");
          const cs = getComputedStyle(card);
          const pad = parseFloat(cs.paddingBottom);
          // A normal footer sits on the content box bottom; a .bleed footer
          // escapes the padding and lands on the card's bottom edge.
          const ref = card.getBoundingClientRect().bottom - (${bleed} ? 0 : pad);
          const gap = ref - footer.getBoundingClientRect().bottom;
          return Math.abs(gap) <= 1;
        })()`);

      expect(await anchored("#stack")).toBe(true);
      expect(await anchored("#bleed", true)).toBe(true);
    },
    { artifactName: "card-bleed" },
  );
});
