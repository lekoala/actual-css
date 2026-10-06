/*
 * Pagination on a narrow viewport wraps: every page stays visible and
 * clickable, nothing scrolls. A scrolling row hid pages behind a scrollbar a
 * click cannot move, since clicking a page navigates.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  setViewport,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/pagination.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("a narrow pagination wraps instead of scrolling", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // The window width does not go this narrow; emulate the phone instead.
      await setViewport(view, { width: 320 });
      const layout = await view.evaluate(`(() => {
        const list = document.getElementById("pagination");
        const box = list.getBoundingClientRect();
        // Centers, not tops: the ellipsis items are shorter and centered.
        const mids = [...list.children].map((li) => {
          const r = li.getBoundingClientRect();
          return Math.round(r.top + r.height / 2);
        });
        return {
          rows: new Set(mids).size,
          inside: [...list.children].every((li) => {
            const r = li.getBoundingClientRect();
            return r.left >= box.left - 1 && r.right <= box.right + 1;
          }),
          listScrolls: list.scrollWidth > list.clientWidth,
          pageScrolls: document.documentElement.scrollWidth > innerWidth,
        };
      })()`);
      // More than one row proves the fixture does not fit, or the pass is vacuous.
      expect(layout.rows).toBeGreaterThan(1);
      expect(layout.inside).toBe(true);
      expect(layout.listScrolls).toBe(false);
      expect(layout.pageScrolls).toBe(false);
    },
    { artifactName: "pagination-narrow" },
  );
});
