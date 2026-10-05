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
      expect(before.strips["steps-fit"]).toMatchObject({ overflows: false, inBox: true });

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
      expect(strips["steps-fit"]).toMatchObject({ overflows: false, scrolled: false, inBox: true });
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
  <ol class="breadcrumb" data-enhance="reveal-current" id="streamed" style="inline-size: 12rem">
    <li><a href="#a">Home</a></li>
    <script>window.parserCheckpoint = true;</script>
    <li><a href="#b">Projects</a></li>
    <li><a href="#c">Documentation</a></li>
    <li><a href="#d" aria-current="page">Components</a></li>
  </ol>
  <div class="tabs" data-enhance="tabs" role="tablist" aria-label="Streamed" id="streamed-tabs">
    <button class="tab" type="button" role="tab" aria-selected="false" aria-controls="p1" id="st1">One</button>
    <script>window.parserCheckpoint = true;</script>
    <button class="tab" type="button" role="tab" aria-selected="true" aria-controls="p2" id="st2">Two</button>
  </div>
  <div role="tabpanel" id="p1" hidden></div>
  <div role="tabpanel" id="p2"></div>
  <div class="strip" data-enhance="reveal-current" id="percent" style="scroll-padding-inline: 20%">
    <div style="inline-size: 250px"></div><div aria-current="true" style="inline-size: 50px"></div><div style="inline-size: 250px"></div>
  </div>
  <div style="transform: scale(0.5); transform-origin: 0 0">
    <div class="strip" data-enhance="reveal-current" id="scaled">
      <div style="inline-size: 250px"></div><div aria-current="true" style="inline-size: 50px"></div><div style="inline-size: 250px"></div>
    </div>
  </div>
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
          const rect = strip.querySelector("[aria-current]").getBoundingClientRect();
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

      // Trap: the current item was not parsed yet when the trail connected.
      expect(state.streamed.scrolled).toBe(true);
      expect(state.streamed.end).toBeLessThanOrEqual(state.streamed.width + 1);
      // Trap: the tablist connected with no tabs and never set its roving tabindex.
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
