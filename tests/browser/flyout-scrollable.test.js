/*
 * .flyout.scrollable keeps the footer in view: the body region scrolls, never
 * the panel. Three cases from the prototype — a panel shorter than its cap, a
 * list longer than the cap, and a panel the positioner squeezes against the
 * viewport — plus a plain flyout that must keep scrolling as a whole.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  setViewport,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = fixtureUrl("tests/browser/flyout-scrollable.html");
const TIMEOUT = 60_000;
const it = (await browserAvailable()) ? test : test.skip;

const options = (name) => ({
  artifactName: `flyout-scrollable-${name}`,
  mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }],
});

async function open(view, id) {
  await clickSelector(view, `[aria-controls="${id}"]`);
  await waitForBrowser(
    view,
    `document.getElementById(${JSON.stringify(id)}).matches(":popover-open")`,
  );
}

function measure(view, id) {
  return view.evaluate(`(() => {
    const panel = document.getElementById(${JSON.stringify(id)});
    const body = panel.querySelector(":scope > :not(header, footer)");
    const footer = panel.querySelector(":scope > footer").getBoundingClientRect();
    const box = panel.getBoundingClientRect();
    return {
      panelScrolls: panel.scrollHeight > panel.clientHeight,
      bodyScrolls: body.scrollHeight > body.clientHeight,
      footerInside: footer.top >= box.top && footer.bottom <= box.bottom,
      inViewport: box.top >= 0 && box.bottom <= innerHeight,
    };
  })()`);
}

it(
  "a short panel sizes to its content",
  async () => {
    await withBrowserPage(
      FIXTURE,
      async (view) => {
        await setViewport(view, { width: 900, height: 560 });
        await open(view, "short");
        expect(await measure(view, "short")).toEqual({
          panelScrolls: false,
          bodyScrolls: false,
          footerInside: true,
          inViewport: true,
        });
      },
      options("short"),
    );
  },
  TIMEOUT,
);

it(
  "a long panel scrolls its body and keeps the footer in view",
  async () => {
    await withBrowserPage(
      FIXTURE,
      async (view) => {
        await setViewport(view, { width: 900, height: 560 });
        await open(view, "long");
        expect(await measure(view, "long")).toEqual({
          panelScrolls: false,
          bodyScrolls: true,
          footerInside: true,
          inViewport: true,
        });
      },
      options("long"),
    );
  },
  TIMEOUT,
);

it(
  "a panel squeezed by the viewport keeps the footer in view",
  async () => {
    await withBrowserPage(
      FIXTURE,
      async (view) => {
        await setViewport(view, { width: 900, height: 280 });
        await open(view, "bottom");
        expect(await measure(view, "bottom")).toEqual({
          panelScrolls: false,
          bodyScrolls: true,
          footerInside: true,
          inViewport: true,
        });
      },
      options("bottom"),
    );
  },
  TIMEOUT,
);

it(
  "a focused control at the end of the body keeps its ring inside the scrollport",
  async () => {
    await withBrowserPage(
      FIXTURE,
      async (view) => {
        await setViewport(view, { width: 900, height: 560 });
        await open(view, "long");
        expect(await tabUntil(view, `document.activeElement.id === "long-last"`, { max: 24 })).toBe(
          true,
        );
        const fits = await view.evaluate(`(() => {
          const input = document.getElementById("long-last");
          const body = input.closest(".stack");
          const ring = parseFloat(getComputedStyle(input).outlineOffset) + parseFloat(getComputedStyle(input).outlineWidth);
          const r = input.getBoundingClientRect();
          const b = body.getBoundingClientRect();
          return r.left - ring >= b.left && r.bottom + ring <= b.bottom;
        })()`);
        expect(fits).toBe(true);
      },
      options("focus"),
    );
  },
  TIMEOUT,
);

it(
  "a flyout without .scrollable still scrolls as a whole",
  async () => {
    await withBrowserPage(
      FIXTURE,
      async (view) => {
        await setViewport(view, { width: 900, height: 280 });
        await open(view, "plain");
        const state = await measure(view, "plain");
        expect(state.panelScrolls).toBe(true);
        expect(state.bodyScrolls).toBe(false);
      },
      options("plain"),
    );
  },
  TIMEOUT,
);
