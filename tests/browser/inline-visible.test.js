/*
 * Strips that overflow start on their selected (tabs) or current (breadcrumb)
 * item: one placement at connect, inside the strip's own scrollport, clear of
 * its scroll-padding, never moving the page.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/inline-visible.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

// Exercise the source without depending on a rebuilt distribution bundle.
const bundle = await Bun.build({ entrypoints: ["src/js/full.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Runtime test bundle failed");
const source = await bundle.outputs[0].text();

// A strip's target against its client box (`inBox`) and against the box
// minus scroll-padding (`clear`), plus the scroll state. scroll-padding is a
// wish the scroll range can clamp: a last tab ends flush with the strip, as
// under native focus scrolling. A pixel absorbs sub-pixel layout.
const READ = `(() => {
  const read = (list, target) => {
    const style = getComputedStyle(list);
    const left = list.getBoundingClientRect().left + list.clientLeft;
    const right = left + list.clientWidth;
    const padLeft = parseFloat(style.scrollPaddingLeft) || 0;
    const padRight = parseFloat(style.scrollPaddingRight) || 0;
    const rect = target.getBoundingClientRect();
    return {
      overflows: list.scrollWidth > list.clientWidth,
      scrolled: list.scrollLeft !== 0,
      inBox: rect.left >= left - 1 && rect.right <= right + 1,
      clear: rect.left >= left + padLeft - 1 && rect.right <= right - padRight + 1,
    };
  };
  const strips = {};
  for (const list of document.querySelectorAll('[role="tablist"]')) {
    strips[list.id] = read(list, list.querySelector('[aria-selected="true"]'));
  }
  for (const list of document.querySelectorAll(".breadcrumb")) {
    strips[list.id] = read(list, list.querySelector('[aria-current="page"]'));
  }
  return { strips, pageY: window.scrollY };
})()`;

it("overflowing strips start on their selected or current item", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const before = await view.evaluate(READ);
      // The fixture must overflow with the target hidden, or the pass is vacuous.
      for (const id of ["tabs-end", "tabs-middle", "tabs-rtl", "tabs-below", "trail-long"]) {
        expect(before.strips[id], id).toMatchObject({ overflows: true, inBox: false });
      }

      await view.evaluate(`(() => { ${source} })()`);
      // A tablist has initialized once its unselected tabs left the roving
      // sequence; the breadcrumb has placed itself once it scrolled.
      await waitForBrowser(
        view,
        `[...document.querySelectorAll('[role="tablist"]')].every((list) => list.querySelector('[tabindex="-1"]')) &&
         document.getElementById("trail-long").scrollLeft !== 0`,
      );
      const { strips, pageY } = await view.evaluate(READ);

      for (const id of ["tabs-end", "tabs-rtl", "tabs-below"]) {
        expect(strips[id], id).toMatchObject({ scrolled: true, inBox: true });
      }
      // Mid-strip, the scroll-padding is honoured: room to spare at the edge.
      expect(strips["tabs-middle"]).toMatchObject({ scrolled: true, clear: true });
      // The trail's end padding equals its fade, so the current page clears it.
      expect(strips["trail-long"]).toMatchObject({ scrolled: true, clear: true });
      // Already visible: nothing moves.
      expect(strips["tabs-start"]).toMatchObject({ overflows: true, scrolled: false, inBox: true });
      expect(strips["trail-short"]).toMatchObject({ scrolled: false, inBox: true });
      // Hidden at connect: a no-op, not a guess from empty rects.
      expect(strips["tabs-hidden"].scrolled).toBe(false);
      // The strip below the fold scrolled itself, not the page.
      expect(pageY).toBe(0);
    },
    { width: 800, height: 600, artifactName: "inline-visible" },
  );
});
