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

async function measure(view, width) {
  await view.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(150);
  return view.evaluate(`(() => {
    const layout = document.querySelector(".sidebar-layout");
    const main = layout.firstElementChild.getBoundingClientRect();
    const aside = layout.lastElementChild.getBoundingClientRect();
    const box = layout.getBoundingClientRect();
    return {
      sameRow: Math.round(main.top) === Math.round(aside.top),
      mainWidth: main.width,
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
