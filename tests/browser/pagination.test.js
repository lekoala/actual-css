/*
 * Pagination on a narrow viewport: one row that scrolls on its own, never a
 * wrapped second line and never a scrolled page, with the focus line of an
 * item kept inside the scrollport that clips it.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  setViewport,
  tabUntil,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/pagination.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("a narrow pagination scrolls as one row and keeps focus paint inside", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // The window width does not go this narrow; emulate the phone instead.
      await setViewport(view, { width: 320 });
      const layout = await view.evaluate(`(() => {
        const list = document.getElementById("pagination");
        // Centers, not tops: the ellipsis items are shorter and centered.
        const mids = [...list.children].map((li) => {
          const r = li.getBoundingClientRect();
          return Math.round(r.top + r.height / 2);
        });
        return {
          rows: new Set(mids).size,
          listScrolls: list.scrollWidth > list.clientWidth,
          pageScrolls: document.documentElement.scrollWidth > innerWidth,
        };
      })()`);
      expect(layout.rows).toBe(1);
      expect(layout.listScrolls).toBe(true);
      expect(layout.pageScrolls).toBe(false);

      // Real Tab: the outline is drawn for keyboard focus only.
      expect(await tabUntil(view, `document.activeElement?.id === "first"`)).toBe(true);
      const paint = await view.evaluate(`(() => {
        const list = document.getElementById("pagination").getBoundingClientRect();
        const item = document.getElementById("first");
        const cs = getComputedStyle(item);
        const reach = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth);
        const r = item.getBoundingClientRect();
        return {
          reach,
          top: r.top - reach - list.top,
          bottom: list.bottom - (r.bottom + reach),
          start: r.left - reach - list.left,
        };
      })()`);
      expect(paint.reach).toBeGreaterThan(0);
      expect(paint.top).toBeGreaterThanOrEqual(0);
      expect(paint.bottom).toBeGreaterThanOrEqual(0);
      expect(paint.start).toBeGreaterThanOrEqual(0);
    },
    { artifactName: "pagination-narrow" },
  );
});
