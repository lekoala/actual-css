/*
 * Strips that overflow start on their selected (tabs) or `aria-current`
 * (reveal-current: breadcrumb, steps, pagination) item: one placement at
 * connect, inside the strip's own scrollport, clear of its scroll-padding,
 * never moving the page.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  pressKey,
  tabUntil,
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
// under native focus scrolling. `ringClear` also fits the outside focus line
// the item would draw. A pixel absorbs sub-pixel layout.
const READ = `(() => {
  const read = (list, target) => {
    const style = getComputedStyle(list);
    const left = list.getBoundingClientRect().left + list.clientLeft;
    const right = left + list.clientWidth;
    const padLeft = parseFloat(style.scrollPaddingLeft) || 0;
    const padRight = parseFloat(style.scrollPaddingRight) || 0;
    const rect = target.getBoundingClientRect();
    const own = getComputedStyle(target);
    const ring =
      parseFloat(own.getPropertyValue("--focus-outline-offset")) +
      parseFloat(own.getPropertyValue("--focus-ring-width"));
    return {
      overflows: list.scrollWidth > list.clientWidth,
      scrolled: list.scrollLeft !== 0,
      inBox: rect.left >= left - 1 && rect.right <= right + 1,
      clear: rect.left >= left + padLeft - 1 && rect.right <= right - padRight + 1,
      ringClear: rect.left - ring >= left - 1 && rect.right + ring <= right + 1,
    };
  };
  // The rendered current item, or the first one when none has a box.
  const current = (list) => {
    const items = [...list.querySelectorAll("[aria-current]")];
    return items.find((item) => item.getClientRects().length) ?? items[0];
  };
  const strips = {};
  for (const list of document.querySelectorAll('[role="tablist"]')) {
    strips[list.id] = read(list, list.querySelector('[aria-selected="true"]'));
  }
  for (const list of document.querySelectorAll(".breadcrumb, .steps, .pagination")) {
    strips[list.id] = read(list, current(list));
  }
  return { strips, pageY: window.scrollY };
})()`;

it("overflowing strips start on their selected or current item", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const before = await view.evaluate(READ);
      // The fixture must overflow with the target hidden, or the pass is vacuous.
      const hidden = [
        "tabs-end",
        "tabs-middle",
        "tabs-rtl",
        "tabs-below",
        "trail-long",
        "trail-mid",
        "trail-duplicate-current",
      ];
      for (const id of [...hidden, "steps-row", "pager"]) {
        expect(before.strips[id], id).toMatchObject({ overflows: true, inBox: false });
      }
      expect(before.strips["trail-hidden-current"].overflows).toBe(true);

      await view.evaluate(`(() => { ${source} })()`);
      // A tablist has initialized once its unselected tabs left the roving
      // sequence; a reveal-current strip has placed itself once it scrolled.
      await waitForBrowser(
        view,
        `[...document.querySelectorAll('[role="tablist"]')].every((list) => list.querySelector('[tabindex="-1"]')) &&
         ["trail-long", "trail-mid", "trail-duplicate-current", "steps-row", "pager"].every((id) => document.getElementById(id).scrollLeft !== 0)`,
      );
      const { strips, pageY } = await view.evaluate(READ);

      for (const id of ["tabs-end", "tabs-rtl", "tabs-below"]) {
        expect(strips[id], id).toMatchObject({ scrolled: true, inBox: true });
      }
      // Mid-strip, the scroll-padding is honoured: room to spare at the edge.
      expect(strips["tabs-middle"]).toMatchObject({ scrolled: true, clear: true });
      // The current page lands fully inside the trail.
      expect(strips["trail-long"]).toMatchObject({ scrolled: true, clear: true });
      // The same token serves any strip with an aria-current item.
      expect(strips["steps-row"]).toMatchObject({ scrolled: true, inBox: true });
      expect(strips.pager).toMatchObject({ scrolled: true, inBox: true, ringClear: true });
      // Mid-strip the end padding is scrolled away: the strip's scroll-padding
      // is what keeps the item's focus line inside the clip.
      expect(strips["trail-mid"]).toMatchObject({ scrolled: true, ringClear: true });
      // A boxless current item before the rendered one is skipped.
      expect(strips["trail-duplicate-current"]).toMatchObject({ scrolled: true, clear: true });
      // A current item without a box (inside a hidden item) moves nothing.
      expect(strips["trail-hidden-current"].scrolled).toBe(false);
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

// Trap: arrow keys left the scroll to native focus scrolling, which Chrome
// skips for an element already partly inside the scrollport, so a tab showing
// a sliver at the edge took focus and stayed clipped.
it("arrow keys reveal a tab that only shows a sliver", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // Sized from the tabs, not a fixed length: the second tab shows a
      // sliver wider than the scroll-padding, whatever the font.
      const sliver = await view.evaluate(`(() => {
        const list = document.getElementById("tabs-sliver");
        const next = document.getElementById("tabs-sliver-1");
        const pad = parseFloat(getComputedStyle(list).scrollPaddingRight) || 0;
        const visible = pad + 8;
        list.parentElement.style.inlineSize =
          next.getBoundingClientRect().left - list.getBoundingClientRect().left + visible + "px";
        return visible;
      })()`);
      expect(sliver).toBeGreaterThan(0);

      await view.evaluate(`(() => { ${source} })()`);
      await waitForBrowser(view, `document.querySelector('#tabs-sliver [tabindex="-1"]')`);
      expect(await tabUntil(view, `document.activeElement?.id === "tabs-sliver-0"`)).toBe(true);
      await pressKey(view, "ArrowRight", { code: "ArrowRight", windowsVirtualKeyCode: 39 });
      await waitForBrowser(view, `document.activeElement?.id === "tabs-sliver-1"`);

      const { strips } = await view.evaluate(READ);
      expect(strips["tabs-sliver"]).toMatchObject({ scrolled: true, inBox: true });
    },
    { width: 800, height: 600, artifactName: "inline-visible-sliver" },
  );
});
