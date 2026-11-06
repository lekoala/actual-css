/*
 * Real-browser accordion panel contract, driven over Bun.WebView.
 *
 * .flush zeroes the panel's inline padding at a higher specificity than the
 * list gutter, so a list panel lost its gutter and its markers hung outside
 * the panel. Only computed padding in a real cascade shows the clash.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/accordion.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("a list panel keeps its marker gutter in default, flush and RTL flush", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const gutter = (selector) =>
          [...document.querySelectorAll(selector + " details > :is(ul, ol)")].map((list) => {
            const style = getComputedStyle(list);
            return {
              tag: list.localName,
              start: parseFloat(style.paddingInlineStart) / rem,
              left: parseFloat(style.paddingLeft) / rem,
              right: parseFloat(style.paddingRight) / rem,
            };
          });
        return { default: gutter("#default"), flush: gutter("#flush"), rtl: gutter("#flush-rtl") };
      })()`);

      for (const list of [...result.default, ...result.flush, ...result.rtl]) {
        expect(list.start).toBe(2);
      }
      expect(result.default.map((list) => list.tag)).toEqual(["ul", "ol"]);
      // Flush keeps no end inset; the gutter lands on the start side of the
      // writing direction.
      for (const list of result.flush) {
        expect([list.left, list.right]).toEqual([2, 0]);
      }
      for (const list of result.rtl) {
        expect([list.left, list.right]).toEqual([0, 2]);
      }
    },
    { artifactName: "accordion-list-gutter" },
  );
});
