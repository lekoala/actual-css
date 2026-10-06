/*
 * Tab strips on a narrow viewport: a horizontal strip is one row that scrolls
 * on its own, never a wrapped second line, a wrapped label or a scrolled page;
 * keyboard focus brings an off-screen tab fully into view. With no scrollbar,
 * the strip fades the edges it can still scroll toward. A navigation flyout
 * trigger lines up with its sibling tabs, and a vertical rail keeps wrapping.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickAt,
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
const ARROW_DOWN = { code: "ArrowDown", windowsVirtualKeyCode: 40 };

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

it("a narrow tablist hides its scrollbar and a click reveals the clipped tab", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: 320 });
      // The strip has no scrollbar, so selecting the tab cut at the edge is
      // how a mouse moves along it: click its visible sliver, as a user would.
      const target = await view.evaluate(`(() => {
        const list = document.getElementById("widget");
        const box = list.getBoundingClientRect();
        const clipped = [...list.querySelectorAll(".tab")].find((tab) => {
          const rect = tab.getBoundingClientRect();
          return rect.left < box.right - 4 && rect.right > box.right;
        });
        const rect = clipped.getBoundingClientRect();
        return {
          id: clipped.id,
          scrollbar: getComputedStyle(list).scrollbarWidth,
          x: (rect.left + box.right) / 2,
          y: rect.top + rect.height / 2,
        };
      })()`);
      expect(target.scrollbar).toBe("none");

      await clickAt(view, target.x, target.y);
      const id = JSON.stringify(target.id);
      expect(
        await waitForBrowser(
          view,
          `(() => {
            const box = document.getElementById("widget").getBoundingClientRect();
            const tab = document.getElementById(${id}).getBoundingClientRect();
            return tab.left >= box.left && tab.right <= box.right;
          })()`,
        ),
      ).toBe(true);
    },
    { artifactName: "tabs-click-reveal" },
  );
});

// The fade sides of #widget: which edges the mask makes transparent.
const FADE = `(() => {
  const mask = getComputedStyle(document.getElementById("widget")).maskImage;
  if (mask === "none") return "none";
  // Computed stops serialize transparent as rgba(0, 0, 0, 0).
  const clear = "rgba(0, 0, 0, 0)";
  const stops = mask.slice(mask.indexOf(",") + 1, -1).trim();
  const start = stops.startsWith(clear);
  const end = stops.endsWith(clear);
  return start && end ? "both" : start ? "start" : "end";
})()`;

for (const reduced of [false, true]) {
  it(`an overflowing strip fades the edges it can scroll toward${reduced ? " (reduced motion)" : ""}`, async () => {
    await withBrowserPage(
      fixtureUrl(FIXTURE),
      async (view) => {
        await view.evaluate(`document.getElementById("widget").scrollLeft = 0`);
        // Wide enough to fit: the timeline is inactive and nothing is masked.
        expect(await view.evaluate(FADE)).toBe("none");

        await setViewport(view, { width: 320 });
        expect(await waitForBrowser(view, `${FADE} === "end"`)).toBe(true);

        await view.evaluate(`document.getElementById("widget").scrollLeft = 40`);
        expect(await waitForBrowser(view, `${FADE} === "both"`)).toBe(true);

        await view.evaluate(`(() => {
          const list = document.getElementById("widget");
          list.scrollLeft = list.scrollWidth;
        })()`);
        expect(await waitForBrowser(view, `${FADE} === "start"`)).toBe(true);
      },
      {
        // The fade follows scroll, not time, so the reduced-motion reset keeps it.
        mediaFeatures: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [],
        artifactName: `tabs-fade${reduced ? "-reduced" : ""}`,
      },
    );
  });
}

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
          // Not a scroll container: its fade timeline is inactive.
          mask: getComputedStyle(list).maskImage,
          fits: tab.getBoundingClientRect().right <= list.getBoundingClientRect().right + 0.5,
          lines: (${LINES})(tab),
        };
      })()`);
      expect(rail.overflow).toBe("visible");
      expect(rail.mask).toBe("none");
      expect(rail.fits).toBe(true);
      expect(rail.lines).toBeGreaterThan(1);
    },
    { artifactName: "tabs-vertical" },
  );
});

/*
 * aria-orientation is the one switch between the rail and the strip, so a page
 * that changes layout flips it and owes no tab styling of its own. A demo
 * restyled the vertical form into a strip instead; when the framework moved
 * the rail to grid and its accent to ::after, the strip came back stacked and
 * the desktop rail grew a second accent bar. Each form must read the current
 * attribute: layout, one indicator on the right edge, and the arrow keys.
 */
it("a tablist that flips aria-orientation takes each form and its keys", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const read = `(() => {
        const list = document.getElementById("flip");
        const tabs = [...list.querySelectorAll(".tab")];
        const selected = list.querySelector('[aria-selected="true"]');
        const after = getComputedStyle(selected, "::after");
        return {
          rows: new Set(tabs.map((tab) => Math.round(tab.getBoundingClientRect().top))).size,
          end: after.borderInlineEndWidth,
          bottom: after.borderBlockEndWidth,
          start: getComputedStyle(selected).borderInlineStartWidth,
        };
      })()`;

      const vertical = await view.evaluate(read);
      expect(vertical.rows).toBe(3);
      expect(vertical).toMatchObject({ end: "2px", bottom: "0px", start: "0px" });
      expect(await tabUntil(view, `document.activeElement?.id === "flip-1"`)).toBe(true);
      await pressKey(view, "ArrowDown", ARROW_DOWN);
      expect(await waitForBrowser(view, `document.activeElement?.id === "flip-2"`)).toBe(true);

      await view.evaluate(
        `document.getElementById("flip").setAttribute("aria-orientation", "horizontal")`,
      );
      const horizontal = await view.evaluate(read);
      expect(horizontal.rows).toBe(1);
      expect(horizontal).toMatchObject({ end: "0px", bottom: "2px", start: "0px" });
      await pressKey(view, "ArrowRight", ARROW_RIGHT);
      expect(await waitForBrowser(view, `document.activeElement?.id === "flip-3"`)).toBe(true);
      expect(
        await view.evaluate(
          `document.getElementById("flip-3").getAttribute("aria-selected") === "true"`,
        ),
      ).toBe(true);
    },
    { artifactName: "tabs-flip" },
  );
});
