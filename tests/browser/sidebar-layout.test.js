/*
 * Real-browser .sidebar-layout contract, driven over Bun.WebView.
 *
 * Below the wrap point the aside moves onto its own line and the main region
 * (flex-grow 999) reclaims the full row. Above it, both share the same row.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/sidebar-layout.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const main = layout.firstElementChild.getBoundingClientRect();
    const aside = layout.lastElementChild.getBoundingClientRect();
    const box = layout.getBoundingClientRect();
    return {
      sameRow: Math.round(main.top) === Math.round(aside.top),
      mainWidth: main.width,
      asideLeft: aside.left,
      mainLeft: main.left,
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

      // Narrow: aside wraps below and main reclaims ~100% of the container.
      const narrow = await measure(view, 480);
      expect(narrow.sameRow).toBe(false);
      expect(Math.abs(narrow.mainWidth - narrow.containerWidth)).toBeLessThan(1);
    },
    { artifactName: "sidebar-layout" },
  );
});

it(".reverse puts the aside on the inline start without changing DOM order", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const wide = await measure(view, 900, ".sidebar-layout.reverse");
      expect(wide.sameRow).toBe(true);
      // The aside (last DOM child) renders to the left of the main region.
      expect(wide.asideLeft).toBeLessThan(wide.mainLeft);

      // Narrow: reverse keeps the aside on top (first in visual order).
      const narrow = await measure(view, 480, ".sidebar-layout.reverse");
      expect(narrow.sameRow).toBe(false);
    },
    { artifactName: "sidebar-layout" },
  );
});
