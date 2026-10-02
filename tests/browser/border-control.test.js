/*
 * --border-control is the resting edge of neutral controls, apart from the
 * --border that separates surfaces: setting it alone moves every control and
 * no separator.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/border-control.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("controls take --border-control and separators keep --border", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const edges = await view.evaluate(`(() => {
        // Block-start: the edge every control and the hr divider draw.
        const edge = (el) => {
          const name = el.className.split(" ")[0];
          return name + " " + getComputedStyle(el).borderBlockStartColor;
        };
        return {
          controls: [...document.querySelectorAll("[data-control]")].map(edge),
          separators: [...document.querySelectorAll("[data-separator]")].map(edge),
        };
      })()`);

      expect(edges.controls).toEqual([
        "input rgb(255, 0, 0)",
        "textarea rgb(255, 0, 0)",
        "select rgb(255, 0, 0)",
        "check rgb(255, 0, 0)",
        "radio rgb(255, 0, 0)",
        "switch rgb(255, 0, 0)",
        "color rgb(255, 0, 0)",
        "join-addon rgb(255, 0, 0)",
        "choice-card rgb(255, 0, 0)",
      ]);
      expect(edges.separators).toEqual(["card rgb(200, 200, 200)", "divider rgb(200, 200, 200)"]);
    },
    { artifactName: "border-control" },
  );
});
