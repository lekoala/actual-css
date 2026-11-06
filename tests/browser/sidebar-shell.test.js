/*
 * Real-browser .sidebar-shell contract, driven over Bun.WebView.
 *
 * From 64rem: side and main at the viewport's height, each its own scroller,
 * the document still. Below: the aside hidden and the document scrolling.
 * The aside keeps the author's display, print is one flow, and the documented
 * recipe closes an open drawer when the viewport widens.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  setViewport,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/sidebar-shell.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const state = `(() => {
  const root = document.scrollingElement;
  const side = document.getElementById("side");
  const main = document.getElementById("main");
  const shell = document.getElementById("shell");
  return {
    viewport: innerHeight,
    shell: shell.getBoundingClientRect().height,
    documentScrolls: root.scrollHeight > root.clientHeight + 1,
    sideDisplay: getComputedStyle(side).display,
    sideScrolls: side.scrollHeight > side.clientHeight + 1,
    mainScrolls: main.scrollHeight > main.clientHeight + 1,
    mainOverflow: getComputedStyle(main).overflowY,
    sideLeft: side.getBoundingClientRect().left,
    mainLeft: main.getBoundingClientRect().left,
  };
})()`;

it("from 64rem each region scrolls on its own and the document stays still", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: 1280, height: 700 });
      expect(await waitForBrowser(view, `innerWidth === 1280`)).toBe(true);
      const wide = await view.evaluate(state);
      expect(wide.shell).toBeCloseTo(wide.viewport, 0);
      expect(wide.documentScrolls).toBe(false);
      expect(wide.sideScrolls).toBe(true);
      expect(wide.mainScrolls).toBe(true);
      // The author's .stack survives: the shell never writes display on aside.
      expect(wide.sideDisplay).toBe("flex");
      expect(wide.mainLeft).toBeGreaterThan(wide.sideLeft);

      // Scrolling the main region leaves the sidebar where it was.
      const before = await view.evaluate(
        `document.getElementById("side-first").getBoundingClientRect().top`,
      );
      await view.evaluate(`document.getElementById("main").scrollTop = 500`);
      const after = await view.evaluate(
        `document.getElementById("side-first").getBoundingClientRect().top`,
      );
      expect(after).toBe(before);
    },
    { artifactName: "sidebar-shell-wide" },
  );
});

it("below 64rem the aside hides and the document scrolls", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: 800, height: 700 });
      expect(await waitForBrowser(view, `innerWidth === 800`)).toBe(true);
      const narrow = await view.evaluate(state);
      expect(narrow.sideDisplay).toBe("none");
      expect(narrow.documentScrolls).toBe(true);
      expect(narrow.mainOverflow).toBe("visible");
    },
    { artifactName: "sidebar-shell-narrow" },
  );
});

it("the keyboard moves from the sidebar into the main region", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: 1280, height: 700 });
      expect(await tabUntil(view, `document.activeElement?.id === "side-last"`)).toBe(true);
      expect(await tabUntil(view, `document.activeElement?.id === "main-first"`, { max: 3 })).toBe(
        true,
      );
    },
    { artifactName: "sidebar-shell-keyboard" },
  );
});

it("prints both regions as one flow with nothing clipped, at any page width", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.cdp("Emulation.setEmulatedMedia", { media: "print" });
      expect(await waitForBrowser(view, `matchMedia("print").matches`)).toBe(true);
      // 800px is under the breakpoint: the narrow rule is screen only, since
      // print never hides framework content.
      for (const width of [1280, 800]) {
        await setViewport(view, { width, height: 700 });
        expect(await waitForBrowser(view, `innerWidth === ${width}`)).toBe(true);
        const printed = await view.evaluate(`({
          shell: getComputedStyle(document.getElementById("shell")).display,
          side: getComputedStyle(document.getElementById("side")).display,
          main: getComputedStyle(document.getElementById("main")).overflowY,
        })`);
        expect(printed, `${width}px`).toEqual({ shell: "block", side: "flex", main: "visible" });
      }
    },
    { artifactName: "sidebar-shell-print" },
  );
});

it("the documented recipe closes an open drawer when the viewport widens", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await setViewport(view, { width: 800, height: 700 });
      await view.evaluate(`document.getElementById("drawer").showModal()`);
      expect(await view.evaluate(`document.getElementById("drawer").open`)).toBe(true);
      await setViewport(view, { width: 1280, height: 700 });
      expect(await waitForBrowser(view, `!document.getElementById("drawer").open`)).toBe(true);
    },
    { artifactName: "sidebar-shell-drawer" },
  );
});
