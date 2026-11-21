/*
 * .nav-list.rail — one band, three independent states. The rail, the current
 * band and the focus line share --focus-ring-width, and every row link starts
 * at the rail's outer edge, so an inset focus outline lands on the band.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  tabUntil,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/nav-rail.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const GEOMETRY = `(() => {
  const read = (listId, linkId, rtl) => {
    const list = document.getElementById(listId);
    const link = document.getElementById(linkId);
    const l = list.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    const ls = getComputedStyle(list);
    const band = getComputedStyle(link, "::before");
    return {
      rail: parseFloat(rtl ? ls.borderRightWidth : ls.borderLeftWidth),
      band: parseFloat(band.borderInlineStartWidth),
      // Gap between the link's leading edge and the rail's outer edge.
      offset: rtl ? l.right - r.right : r.left - l.left,
      bandLeft: band.insetInlineStart,
      bandBlock: band.top + " " + band.bottom,
    };
  };
  return {
    ltr: read("rail", "current", false),
    nested: read("rail", "nested", false),
    rtl: read("rail-rtl", "current-rtl", true),
    thick: read("rail-thick", "current-thick", false),
    focusWidth: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--focus-ring-width")),
  };
})()`;

it("rail, band and row edge coincide, nested and RTL included", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const g = await view.evaluate(GEOMETRY);
      for (const row of [g.ltr, g.rtl]) {
        expect(row.rail).toBe(g.focusWidth);
        expect(row.band).toBe(g.focusWidth);
        expect(row.offset).toBe(0);
        expect(row.bandLeft).toBe("0px");
        expect(row.bandBlock).toBe("0px 0px");
      }
      // A nested link reaches the outer rail too, so its focus lands on the band.
      expect(g.nested.offset).toBe(0);
      // The width follows --focus-ring-width, so the joint survives a thicker ring.
      expect(g.thick.rail).toBe(4);
      expect(g.thick.band).toBe(4);
      expect(g.thick.offset).toBe(0);
    },
    { artifactName: "nav-rail-geometry" },
  );
});

it("focus is an inset outline on the band, independent of the current link", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await tabUntil(view, `document.activeElement?.id === "other"`);
      const state = await view.evaluate(`(() => {
        const other = getComputedStyle(document.getElementById("other"));
        const current = getComputedStyle(document.getElementById("current"));
        return {
          outlineWidth: parseFloat(other.outlineWidth),
          outlineOffset: parseFloat(other.outlineOffset),
          currentBand: getComputedStyle(document.getElementById("current"), "::before").content,
          currentBg: current.backgroundColor,
          weights: [current.fontWeight, other.fontWeight],
        };
      })()`);
      expect(state.outlineOffset).toBe(-state.outlineWidth);
      // Selection stays put while focus is elsewhere, and is a band, not a fill.
      expect(state.currentBand).not.toBe("none");
      expect(state.currentBg).toBe("rgba(0, 0, 0, 0)");
      // Constant weight: becoming current never changes text metrics.
      expect(state.weights[0]).toBe(state.weights[1]);
    },
    { artifactName: "nav-rail-focus" },
  );
});

// Forced colors paint the rail and the band in the same CanvasText; the band
// is told apart by shape (CONTRIBUTING.md, forced colors invariant): it grows
// past the rail. Asserted on computed styles: the headless screenshot does not
// paint the forced palette (scripts/forced-colors-shot.js).
it("forced colors keep the band apart from the rail by shape", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const [rail, band] = await view.evaluate(`[
        parseFloat(getComputedStyle(document.getElementById("rail")).borderInlineStartWidth),
        parseFloat(getComputedStyle(document.getElementById("current"), "::before").borderInlineStartWidth),
      ]`);
      expect(band).toBeGreaterThan(rail * 2);
    },
    {
      artifactName: "nav-rail-forced",
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
    },
  );
});
