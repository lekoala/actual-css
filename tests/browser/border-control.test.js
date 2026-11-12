/*
 * --border-control is the resting edge of neutral controls, apart from the
 * --border that separates surfaces: setting it alone moves every control and
 * no separator. Switch tracks keep a uniform fill instead of a control edge.
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
        // Block-start: the edge every control and the hr divider draw, read on
        // the pseudo-element when the control draws it there.
        const edge = (el) => {
          const name = el.className.split(" ")[0];
          return name + " " + getComputedStyle(el, el.dataset.pseudo ?? null).borderBlockStartColor;
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
        "switch rgb(200, 200, 200)",
        "color-swatch rgb(255, 0, 0)",
        "join-addon rgb(255, 0, 0)",
        "choice-card rgb(255, 0, 0)",
        "btn rgb(255, 0, 0)",
      ]);
      expect(edges.separators).toEqual(["card rgb(200, 200, 200)", "divider rgb(200, 200, 200)"]);
    },
    { artifactName: "border-control" },
  );
});

// A neutral outline joins the control role: a local --border-control moves its
// edge and leaves the label on --text.
it("a neutral outline takes --border-control without recoloring its text", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const state = await view.evaluate(`(() => {
        const button = getComputedStyle(document.querySelector("#custom-outline"));
        return {
          border: button.borderBlockStartColor,
          color: button.color,
          text: getComputedStyle(document.querySelector("#ref-text")).color,
        };
      })()`);
      expect(state.border).toBe("rgb(102, 51, 153)");
      expect(state.color).toBe(state.text);
    },
    { artifactName: "border-control-custom" },
  );
});

// Themes tune the edge through the mix, never by redeclaring the color-mix():
// an unguarded redeclaration erased every control outline without color-mix.
it("--border-control-mix sets the ink share of the derived edge", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const [edge, expected] = await view.evaluate(`[
      getComputedStyle(document.querySelector("[data-mix]")).borderBlockStartColor,
      getComputedStyle(document.querySelector("[data-mix-expected]")).color,
    ]`);
    expect(edge).toBe(expected);
  });
});
