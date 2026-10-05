/*
 * One-row strips keep their contract inside flex rows and at the page edge:
 * the <nav> landmark around a strip shrinks, so the strip scrolls (or the
 * breadcrumb truncates) instead of the page, and the first item aligns with
 * the content around it in both directions.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  setViewport,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/strip-in-row.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const READ = `(() => {
  const rect = (id) => document.getElementById(id).getBoundingClientRect();
  const first = (id) => document.getElementById(id).querySelector("li").getBoundingClientRect();
  const rtl = document.documentElement.dir === "rtl";
  const edge = (r) => Math.round(rtl ? r.right : r.left);
  const strip = (id) => {
    const el = document.getElementById(id);
    return el.scrollWidth > el.clientWidth;
  };
  return {
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    scrolls: { pager: strip("pager"), trail: strip("trail"), tabs: strip("link-tabs") },
    // Labels cut by their own ellipsis, ancestors before the current page.
    truncated: [...document.querySelectorAll("#trail a")].map((a) => a.scrollWidth > a.clientWidth),
    heading: edge(rect("heading")),
    trailFirst: edge(first("aligned-trail")),
    pagerFirst: edge(first("aligned-pager")),
    // Each tab's share of its strip, for --tab-flex: 1 1 0.
    equal: ["equal-buttons", "equal-links"].map((id) => {
      const strip = document.getElementById(id);
      return [...strip.querySelectorAll(".tab")].map((tab) =>
        Math.round((tab.getBoundingClientRect().width / strip.clientWidth) * 100),
      );
    }),
  };
})()`;

for (const dir of ["ltr", "rtl"]) {
  it(`strips scroll inside flex rows and align at rest (${dir}, 390px)`, async () => {
    await withBrowserPage(
      fixtureUrl(FIXTURE),
      async (view) => {
        await setViewport(view, { width: 390, height: 800 });
        await view.evaluate(`document.documentElement.dir = ${JSON.stringify(dir)}`);
        const state = await view.evaluate(READ);

        // The strips absorb the overflow; the page never scrolls sideways.
        expect(state.pageOverflow).toBe(0);
        expect(state.scrolls).toEqual({ pager: true, trail: false, tabs: true });
        expect(state.truncated.slice(0, -1)).toContain(true);
        expect(state.truncated.at(-1)).toBe(false);
        // The first item sits on the same inline-start edge as the heading.
        expect(Math.abs(state.trailFirst - state.heading)).toBeLessThanOrEqual(1);
        expect(Math.abs(state.pagerFirst - state.heading)).toBeLessThanOrEqual(1);
        // --tab-flex: 1 1 0 splits the strip evenly, whatever the label lengths,
        // with each link tab filling its <li>.
        for (const [a, b] of state.equal) {
          expect(a).toBe(b);
          // The strip's gap takes the rest.
          expect(a + b).toBeGreaterThanOrEqual(97);
        }
      },
      { width: 390, height: 800, artifactName: `strip-in-row-${dir}` },
    );
  });
}
