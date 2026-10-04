/*
 * One-row strips keep their contract inside flex rows and at the page edge:
 * the <nav> landmark around a strip shrinks, so the strip scrolls instead of
 * the page, and the focus bleed is given back at the inline start, so the
 * first item aligns with the content around it in both directions.
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
    heading: edge(rect("heading")),
    trailFirst: edge(first("aligned-trail")),
    pagerFirst: edge(first("aligned-pager")),
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
        expect(state.scrolls).toEqual({ pager: true, trail: true, tabs: true });
        // The first item sits on the same inline-start edge as the heading.
        expect(Math.abs(state.trailFirst - state.heading)).toBeLessThanOrEqual(1);
        expect(Math.abs(state.pagerFirst - state.heading)).toBeLessThanOrEqual(1);
      },
      { width: 390, height: 800, artifactName: `strip-in-row-${dir}` },
    );
  });
}
