/*
 * Real-browser .switcher threshold contract, driven over Bun.WebView.
 *
 * .switcher stacks every child on its own line below the threshold and puts
 * them all on one line above it. With 3 peers that means exactly 3 rows or
 * exactly 1 row — never an intermediate 2-row orphan.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/switcher.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function lineCount(view, width) {
  await view.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(150);
  return view.evaluate(`(() => {
    const tops = [...document.querySelectorAll(".switcher > *")].map((el) =>
      Math.round(el.getBoundingClientRect().top),
    );
    return new Set(tops).size;
  })()`);
}

it(".switcher is all-on-one-line or all-stacked, never a partial row", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // Below the 40rem threshold: every peer wraps to its own row.
      expect(await lineCount(view, 480)).toBe(3);
      // Above the threshold: all peers share one row.
      expect(await lineCount(view, 900)).toBe(1);
    },
    { artifactName: "switcher" },
  );
});
