/*
 * Real-browser .grid reflow contract, driven over Bun.WebView.
 *
 * .grid auto-fits tracks with a --grid-min floor (16rem default). The number
 * of columns on the first row must change with container width instead of
 * staying fixed — this is the responsive-collection primitive, distinct from
 * the fixed .grid-N.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/grid.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function firstRowColumns(view, width) {
  await view.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(150);
  return view.evaluate(`(() => {
    const items = [...document.querySelectorAll(".grid > *")];
    const tops = items.map((el) => Math.round(el.getBoundingClientRect().top));
    const first = tops[0];
    return tops.filter((t) => t === first).length;
  })()`);
}

it(".grid reflows its column count with container width", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      expect(await firstRowColumns(view, 320)).toBe(1);
      expect(await firstRowColumns(view, 600)).toBe(2);
      expect(await firstRowColumns(view, 900)).toBe(3);
    },
    { artifactName: "grid" },
  );
});
