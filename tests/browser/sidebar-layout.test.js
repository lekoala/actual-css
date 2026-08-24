/*
 * Real-browser .sidebar-layout contract, driven over Bun.WebView.
 *
 * Below the wrap point the aside moves onto its own line and the main region
 * (flex-grow 999) reclaims the full row. Above it, both share the same row.
 *
 * .reverse expects the aside first in the DOM; the role rules swap the sizing
 * so the aside keeps its preferred width and the main reclaims the row. Focus
 * order follows the DOM, so reading, keyboard and visual order all agree.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/sidebar-layout.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Resolve main and aside by tag, so the helper is order-agnostic and works for
   both the default (main-first) and reverse (aside-first) DOM shapes. */
async function measure(view, width, selector = ".sidebar-layout") {
  await view.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(150);
  return view.evaluate(`(() => {
    const layout = document.querySelector(${JSON.stringify(selector)});
    const main = layout.querySelector("main").getBoundingClientRect();
    const aside = layout.querySelector("aside").getBoundingClientRect();
    const box = layout.getBoundingClientRect();
    return {
      sameRow: Math.round(main.top) === Math.round(aside.top),
      mainWidth: main.width,
      mainTop: main.top,
      asideTop: aside.top,
      mainLeft: main.left,
      asideLeft: aside.left,
      containerWidth: box.width,
    };
  })()`);
}

it(".sidebar-layout stacks the aside and lets main reclaim full width when narrow", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // Wide: aside and main share a row.
      const wide = await measure(view, 900);
      expect(wide.sameRow).toBe(true);

      // Narrow: main stays on top, aside wraps below, main reclaims ~100%.
      const narrow = await measure(view, 480);
      expect(narrow.sameRow).toBe(false);
      expect(narrow.mainTop).toBeLessThan(narrow.asideTop);
      expect(Math.abs(narrow.mainWidth - narrow.containerWidth)).toBeLessThan(1);
    },
    { artifactName: "sidebar-layout" },
  );
});

it(".reverse puts the aside on the inline start and keeps it on top when stacked", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const wide = await measure(view, 900, ".sidebar-layout.reverse");
      expect(wide.sameRow).toBe(true);
      // The aside (first in the DOM) renders to the left of the main region.
      expect(wide.asideLeft).toBeLessThan(wide.mainLeft);

      // Narrow: the aside stays on top, matching the DOM order.
      const narrow = await measure(view, 480, ".sidebar-layout.reverse");
      expect(narrow.sameRow).toBe(false);
      expect(narrow.asideTop).toBeLessThan(narrow.mainTop);
    },
    { artifactName: "sidebar-layout" },
  );
});

it(".reverse focus order follows the DOM (aside before main)", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // Focus the first focusable element in the reverse layout, then press Tab
      // and confirm focus advances to the next link in DOM order.
      await view.evaluate(`document.querySelector("#reverse a").focus()`);
      const first = await view.evaluate(`document.activeElement.getAttribute("href")`);
      expect(first).toBe("#reverse-aside");

      await view.cdp("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Tab",
        code: "Tab",
        windowsVirtualKeyCode: 9,
      });
      await view.cdp("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "Tab",
        code: "Tab",
        windowsVirtualKeyCode: 9,
      });
      await sleep(50);

      const second = await view.evaluate(`document.activeElement.getAttribute("href")`);
      expect(second).toBe("#reverse-main");
    },
    { artifactName: "sidebar-layout" },
  );
});
