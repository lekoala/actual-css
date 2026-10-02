/*
 * Tab strips on a narrow viewport: a horizontal strip is one row that scrolls
 * on its own, never a wrapped second line, a wrapped label or a scrolled page;
 * keyboard focus brings an off-screen tab fully into view. A navigation flyout
 * trigger lines up with its sibling tabs, and a vertical rail keeps wrapping.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  pressKey,
  setViewport,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/tabs.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const ARROW_RIGHT = { code: "ArrowRight", windowsVirtualKeyCode: 39 };

// Lines of a label: its text height over the line height, not the tab box,
// which min-block-size keeps taller than one line.
const LINES = `(tab) => {
  const range = document.createRange();
  range.selectNodeContents(tab);
  return Math.round(range.getBoundingClientRect().height / parseFloat(getComputedStyle(tab).lineHeight));
}`;

const strip = (id) => `(() => {
  const list = document.getElementById(${JSON.stringify(id)});
  const tabs = [...list.querySelectorAll(".tab")];
  const lines = ${LINES};
  return {
    rows: new Set(tabs.map((tab) => Math.round(tab.getBoundingClientRect().top))).size,
    tallestLabel: Math.max(...tabs.map(lines)),
    inlineScroll: list.scrollWidth > list.clientWidth,
    blockScroll: list.scrollHeight > list.clientHeight,
    pageScrolls: document.documentElement.scrollWidth > innerWidth,
  };
})()`;

it("a narrow tablist scrolls as one row and focus reveals the next tab", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // The window width does not go this narrow; emulate the phone instead.
      await setViewport(view, { width: 320 });
      const layout = await view.evaluate(strip("widget"));
      expect(layout.rows).toBe(1);
      expect(layout.tallestLabel).toBe(1);
      expect(layout.inlineScroll).toBe(true);
      expect(layout.blockScroll).toBe(false);
      expect(layout.pageScrolls).toBe(false);

      const offscreen = await view.evaluate(`(() => {
        const list = document.getElementById("widget").getBoundingClientRect();
        return document.getElementById("t4").getBoundingClientRect().right > list.right;
      })()`);
      expect(offscreen).toBe(true);

      // Real keys: the strip scrolls because the tab takes focus, so the
      // path under test is the one a keyboard user takes.
      expect(await tabUntil(view, `document.activeElement?.id === "t1"`)).toBe(true);
      for (let i = 0; i < 3; i++) await pressKey(view, "ArrowRight", ARROW_RIGHT);
      expect(await waitForBrowser(view, `document.activeElement?.id === "t4"`)).toBe(true);

      const reveal = await view.evaluate(`(() => {
        const list = document.getElementById("widget");
        const box = list.getBoundingClientRect();
        const tab = document.getElementById("t4").getBoundingClientRect();
        return {
          start: tab.left - box.left,
          end: box.right - tab.right,
          padding: parseFloat(getComputedStyle(list).scrollPaddingInlineEnd),
        };
      })()`);
      expect(reveal.padding).toBeGreaterThan(0);
      expect(reveal.start).toBeGreaterThanOrEqual(0);
      // scroll-padding leaves air on the side the tab scrolled in from.
      expect(reveal.end).toBeGreaterThanOrEqual(reveal.padding - 1);
    },
    { artifactName: "tabs-narrow" },
  );
});

it("a navigation flyout trigger lines up with its sibling tabs", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: 320 });
      const layout = await view.evaluate(strip("nav"));
      expect(layout.rows).toBe(1);
      expect(layout.blockScroll).toBe(false);

      const geometry = await view.evaluate(`(() => {
        const rect = (id) => document.getElementById(id).getBoundingClientRect();
        const plain = rect("nav-plain");
        const trigger = rect("nav-trigger");
        const item = document.getElementById("nav-trigger").parentElement.getBoundingClientRect();
        const indicator = (id) => getComputedStyle(document.getElementById(id), "::after").borderBottomWidth;
        return {
          top: trigger.top - plain.top,
          bottom: trigger.bottom - plain.bottom,
          itemBottom: item.bottom - trigger.bottom,
          section: indicator("nav-trigger"),
          plain: indicator("nav-plain"),
        };
      })()`);
      expect(Math.abs(geometry.top)).toBeLessThan(1);
      expect(Math.abs(geometry.bottom)).toBeLessThan(1);
      // No line-box gap under the trigger inside its wrapper.
      expect(Math.abs(geometry.itemBottom)).toBeLessThan(1);
      // aria-current="true" marks the section that holds the current page.
      expect(geometry.section).toBe("2px");
      expect(geometry.plain).toBe("0px");
    },
    { artifactName: "tabs-nav-flyout" },
  );
});

it("a vertical rail wraps long labels instead of scrolling", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const rail = await view.evaluate(`(() => {
        const list = document.getElementById("rail");
        const tab = document.getElementById("rail-long");
        return {
          overflow: getComputedStyle(list).overflowX,
          fits: tab.getBoundingClientRect().right <= list.getBoundingClientRect().right + 0.5,
          lines: (${LINES})(tab),
        };
      })()`);
      expect(rail.overflow).toBe("visible");
      expect(rail.fits).toBe(true);
      expect(rail.lines).toBeGreaterThan(1);
    },
    { artifactName: "tabs-vertical" },
  );
});
