/*
 * Real-browser specificity contract for .prose, driven over Bun.WebView.
 *
 * .prose is an authored rich-text scope, not a component container. Its
 * element recipes stay low-specificity and its colors respect the contextual
 * aliases owned by the prose surface.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/prose.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("prose owns rich text flow and respects contextual colors", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const color = (sel) => getComputedStyle(document.querySelector(sel)).color;
        const marginBottom = (sel) => getComputedStyle(document.querySelector(sel)).marginBottom;
        const marginTop = (sel) => getComputedStyle(document.querySelector(sel)).marginTop;
        return {
          proseLink: color("#prose-link"),
          p1: marginTop("#flow-p1"),
          p2: marginTop("#flow-p2"),
          h2: marginTop("#flow-h2"),
          directEnds: ["#flow-p1", "#flow-p2", "#flow-h2"].map(marginBottom),
          invertedProse: color("#inverted-prose"),
          invertedProseHeading: color("#inverted-prose-heading"),
          invertedProseCopy: color("#inverted-prose-copy"),
        };
      })()`);

      expect(result.proseLink).not.toBe("");

      // Direct children receive flow, and headings keep their wider rhythm.
      expect(result.p2).not.toBe("0px");
      expect(parseFloat(result.h2)).toBeGreaterThan(parseFloat(result.p2));
      expect(result.p1).toBe("0px");
      expect(result.directEnds).toEqual(["0px", "0px", "0px"]);

      // Both inherited copy and headings follow the contextual surface.
      expect(result.invertedProseCopy).toBe(result.invertedProse);
      expect(result.invertedProseHeading).toBe(result.invertedProse);
    },
    { artifactName: "prose" },
  );
});
