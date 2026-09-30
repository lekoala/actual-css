/*
 * Real-browser .bleed contract on the surfaces that are not a plain card,
 * driven over Bun.WebView.
 *
 * The accordion pads its panel, not the item, so two things cannot be read
 * from bleed.css alone: a first .bleed child must not lift into the summary,
 * and a last one must take the corners of the rounded box the panel closes.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/bleed.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("accordion panel bleeds reach the item sides and corners, never the summary", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const radius = (selector) =>
          [...document.querySelectorAll(selector)].map((el) => getComputedStyle(el).borderEndEndRadius);
        const first = document.querySelector("#separated .first");
        const summary = document.querySelector("#separated summary");
        const item = document.querySelector("#separated details");
        return {
          firstBelowSummary: first.getBoundingClientRect().top >= summary.getBoundingClientRect().bottom,
          firstSpansItem:
            Math.round(first.getBoundingClientRect().width) === Math.round(item.clientWidth),
          firstTopRadius: getComputedStyle(first).borderStartStartRadius,
          separated: radius("#separated .last"),
          default: radius("#default .last"),
          flush: radius("#flush .last"),
        };
      })()`);

      expect(result.firstBelowSummary).toBe(true);
      expect(result.firstSpansItem).toBe(true);
      expect(result.firstTopRadius).toBe("0px");
      expect(result.separated).toEqual(["12px", "12px"]);
      expect(result.default).toEqual(["0px", "12px"]);
      expect(result.flush).toEqual(["0px"]);
    },
    { artifactName: "bleed-accordion" },
  );
});

it("a band outside the padded element list pads itself from --bleed-pad", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const pad = await view.evaluate(
        `getComputedStyle(document.querySelector("#card .status-row")).paddingInlineStart`,
      );
      expect(pad).toBe("24px");
    },
    { artifactName: "bleed-band" },
  );
});

it("a modal header band reaches the surface edges and keeps the modal inset", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const dialog = document.getElementById("modal");
        const wrapper = dialog.querySelector(".stack");
        const header = dialog.querySelector("header");
        const wrapperRect = wrapper.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        const style = getComputedStyle(header);
        return {
          sameStart: Math.round(headerRect.left) === Math.round(wrapperRect.left),
          sameEnd: Math.round(headerRect.right) === Math.round(wrapperRect.right),
          padding: style.paddingInlineStart,
          radius: style.borderStartStartRadius,
          dialogRadius: getComputedStyle(dialog).borderStartStartRadius,
        };
      })()`);

      expect(result.sameStart).toBe(true);
      expect(result.sameEnd).toBe(true);
      expect(result.padding).toBe("24px");
      expect(result.radius).toBe(result.dialogRadius);
    },
    { artifactName: "bleed-modal" },
  );
});
