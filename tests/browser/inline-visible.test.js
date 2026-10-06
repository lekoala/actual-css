/*
 * Strips that overflow start on their selected or current item, inside the
 * strip's own scrollport, never moving the page: a tablist through the tabs
 * runtime (one placement at connect, clear of its scroll-padding), link tabs
 * and steps through CSS scroll-initial-target, with no runtime at all.
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
  for (const list of document.querySelectorAll(".steps, ul.tabs")) {
    strips[list.id] = read(list, current(list));
  }
  return { strips, pageY: window.scrollY };
})()`;

it("overflowing tablists start on their selected tab", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const before = await view.evaluate(READ);
      // The fixture must overflow with the target hidden, or the pass is vacuous.
      for (const id of ["tabs-end", "tabs-middle", "tabs-rtl", "tabs-below"]) {
        expect(before.strips[id], id).toMatchObject({ overflows: true, inBox: false });
      }

      await view.evaluate(`(() => { ${source} })()`);
      // A tablist has initialized once its unselected tabs left the roving sequence.
      await waitForBrowser(
        view,
        `[...document.querySelectorAll('[role="tablist"]')].every((list) => list.querySelector('[tabindex="-1"]'))`,
      );
      const { strips, pageY } = await view.evaluate(READ);

      for (const id of ["tabs-end", "tabs-rtl", "tabs-below"]) {
        expect(strips[id], id).toMatchObject({ scrolled: true, inBox: true });
      }
      // Mid-strip, the scroll-padding is honoured: room to spare at the edge.
      expect(strips["tabs-middle"]).toMatchObject({ scrolled: true, clear: true });
      // Already visible: nothing moves.
      expect(strips["tabs-start"]).toMatchObject({ overflows: true, scrolled: false, inBox: true });
      // Hidden at connect: a no-op, not a guess from empty rects.
      expect(strips["tabs-hidden"].scrolled).toBe(false);
      // The strip below the fold scrolled itself, not the page.
      expect(pageY).toBe(0);
    },
    { width: 800, height: 600, artifactName: "inline-visible" },
  );
});

it("link tabs and steps start on their current item without a runtime", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // No runtime is injected: scroll-initial-target places them at load.
      const { strips, pageY } = await view.evaluate(READ);
      for (const id of ["links-mid", "links-below", "steps-row"]) {
        expect(strips[id], id).toMatchObject({ overflows: true, scrolled: true, inBox: true });
      }
      // Mid-strip, the scroll-padding (the fade inset) keeps the tab clear of the fade.
      expect(strips["links-mid"].clear).toBe(true);
      expect(strips["steps-fit"]).toMatchObject({ overflows: false, scrolled: false, inBox: true });
      // Neither the strip below the fold nor the vertical rail moved the page.
      expect(pageY).toBe(0);
    },
    { width: 800, height: 600, artifactName: "inline-visible-initial" },
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

// A page that loads the runtime as a classic script in <head>, so enhancers
// connect while the parser is still inserting their children. Boxes, not
// text, so every width is the fixture's own.
const PARSED_PAGE = "tmp/browser-runtime/inline-visible-parse.html";
await Bun.write("tmp/browser-runtime/full.js", source);
await Bun.write(
  PARSED_PAGE,
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="../../src/css/actual.full.css">
  <style>
    .strip { display: flex; inline-size: 200px; overflow: auto hidden; }
    .strip > * { flex: none; block-size: 1rem; }
  </style>
  <script src="./full.js"></script>
</head>
<body>
  <div class="strip" data-enhance="tabs" role="tablist" aria-label="Streamed" id="streamed">
    <button type="button" role="tab" aria-selected="false" aria-controls="sp1" id="st1" style="inline-size: 250px"></button>
    <script>window.parserCheckpoint = true;</script>
    <button type="button" role="tab" aria-selected="true" aria-controls="sp2" id="st2" style="inline-size: 50px"></button>
    <button type="button" role="tab" aria-selected="false" aria-controls="sp3" style="inline-size: 250px"></button>
  </div>
  <div class="strip" data-enhance="tabs" role="tablist" aria-label="Percent" id="percent" style="scroll-padding-inline: 20%">
    <button type="button" role="tab" aria-selected="false" aria-controls="pp1" style="inline-size: 250px"></button><button type="button" role="tab" aria-selected="true" aria-controls="pp2" style="inline-size: 50px"></button><button type="button" role="tab" aria-selected="false" aria-controls="pp3" style="inline-size: 250px"></button>
  </div>
  <div style="transform: scale(0.5); transform-origin: 0 0">
    <div class="strip" data-enhance="tabs" role="tablist" aria-label="Scaled" id="scaled">
      <button type="button" role="tab" aria-selected="false" aria-controls="cp1" style="inline-size: 250px"></button><button type="button" role="tab" aria-selected="true" aria-controls="cp2" style="inline-size: 50px"></button><button type="button" role="tab" aria-selected="false" aria-controls="cp3" style="inline-size: 250px"></button>
    </div>
  </div>
  <div role="tabpanel" id="sp1"></div><div role="tabpanel" id="sp2"></div><div role="tabpanel" id="sp3"></div>
  <div role="tabpanel" id="pp1"></div><div role="tabpanel" id="pp2"></div><div role="tabpanel" id="pp3"></div>
  <div role="tabpanel" id="cp1"></div><div role="tabpanel" id="cp2"></div><div role="tabpanel" id="cp3"></div>
</body>
</html>
`,
);

it("placement waits for parsing, reads percentages and follows a scale", async () => {
  await withBrowserPage(
    fixtureUrl(PARSED_PAGE),
    async (view) => {
      await waitForBrowser(view, `document.readyState !== "loading"`);
      const state = await view.evaluate(`(() => {
        // Layout-pixel offsets of the current item inside its strip.
        const place = (id) => {
          const strip = document.getElementById(id);
          const box = strip.getBoundingClientRect();
          const scale = box.width / strip.offsetWidth;
          const rect = strip.querySelector('[aria-selected="true"]').getBoundingClientRect();
          return {
            scrolled: strip.scrollLeft !== 0,
            end: (rect.right - box.left) / scale,
            width: strip.clientWidth,
          };
        };
        const tab = (id) => document.getElementById(id).getAttribute("tabindex");
        return {
          streamed: place("streamed"),
          percent: place("percent"),
          scaled: place("scaled"),
          tabs: [tab("st1"), tab("st2")],
        };
      })()`);

      // Trap: the selected tab was not parsed yet when the strip connected.
      expect(state.streamed.scrolled).toBe(true);
      expect(state.streamed.end).toBeLessThanOrEqual(state.streamed.width + 1);
      // Trap: the tablist connected with one tab and never set its roving tabindex.
      expect(state.tabs).toEqual(["-1", "0"]);
      // Trap: 20% read as 20px; it is 20% of the scrollport.
      expect(state.percent.scrolled).toBe(true);
      expect(state.percent.end).toBeLessThanOrEqual(state.percent.width * 0.8 + 1);
      // Trap: transformed rects against layout widths saw the item as visible.
      expect(state.scaled.scrolled).toBe(true);
      expect(state.scaled.end).toBeLessThanOrEqual(state.scaled.width + 1);
    },
    { width: 800, height: 600, artifactName: "inline-visible-parse" },
  );
});
