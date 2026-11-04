/*
 * The card rail recipe (demo/templates/card-rail.html) in Chromium: one list,
 * a 3-column grid in a wide container, a .scroll-snap rail with CSS scroll
 * markers in a narrow one. The recipe is application CSS, so this guards the
 * documented example against .scroll-snap changes and pins what the markers
 * expose to assistive technology.
 *
 * Markers are pseudo-elements: document.activeElement reports the scroller
 * while one has focus, so focus and names are read from the accessibility
 * tree. Safari and Firefox have no scroll markers; the recipe there is the
 * peek alone and is checked by hand in those browsers.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  pressKey,
  setViewport,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const TEMPLATE = "demo/templates/card-rail.html";
const LABELS = ["Getting started", "Layouts", "Forms", "Theming", "Accessibility", "Enhancements"];
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

/* Non-ignored links: role, name and whether the node holds focus. */
const axLinks = async (view) => {
  const { nodes } = await view.cdp("Accessibility.getFullAXTree");
  return nodes
    .filter((node) => !node.ignored && node.role?.value === "link")
    .map((node) => ({
      name: node.name?.value,
      focused: node.properties?.some((p) => p.name === "focused" && p.value.value) ?? false,
    }));
};

const markersSupported = (view) => view.evaluate(`CSS.supports("scroll-marker-group: after")`);

it("names one marker link per card from data-marker-label", async () => {
  await withBrowserPage(
    fixtureUrl(TEMPLATE),
    async (view) => {
      await setViewport(view, { width: 375 });
      if (!(await markersSupported(view))) return;
      const names = (await axLinks(view)).map((link) => link.name);
      for (const label of LABELS) expect(names, label).toContain(label);
    },
    { sourceCss: true },
  );
});

it("scrolls the rail to a card when its marker is activated from the keyboard", async () => {
  await withBrowserPage(
    fixtureUrl(TEMPLATE),
    async (view) => {
      await setViewport(view, { width: 375 });
      if (!(await markersSupported(view))) return;

      let reached = false;
      for (let i = 0; i < 20 && !reached; i++) {
        await pressKey(view, "Tab");
        reached = (await axLinks(view)).some((link) => link.focused && link.name === "Forms");
      }
      expect(reached).toBe(true);

      await pressKey(view, "Enter");
      // Activation may scroll smoothly: wait until the third card is the one
      // nearest the rail's start edge.
      await waitForBrowser(
        view,
        `(() => {
          const rail = document.querySelector(".card-rail");
          const start = rail.getBoundingClientRect().left;
          const gaps = [...rail.children].map((li) => Math.abs(li.getBoundingClientRect().left - start));
          return gaps.indexOf(Math.min(...gaps)) === 2;
        })()`,
      );
    },
    { sourceCss: true },
  );
});

it("lays the same list out as a 3-column grid without markers in a wide container", async () => {
  await withBrowserPage(
    fixtureUrl(TEMPLATE),
    async (view) => {
      await setViewport(view, { width: 1100 });
      const layout = await view.evaluate(`(() => {
        const rail = document.querySelector(".card-rail");
        const style = getComputedStyle(rail);
        return {
          display: style.display,
          columns: style.gridTemplateColumns.split(" ").length,
          scrolls: rail.scrollWidth > rail.clientWidth,
        };
      })()`);
      expect(layout).toEqual({ display: "grid", columns: 3, scrolls: false });

      const names = (await axLinks(view)).map((link) => link.name);
      for (const label of LABELS) expect(names, label).not.toContain(label);
    },
    { sourceCss: true },
  );
});
