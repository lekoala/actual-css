/*
 * Real-browser always-visible tooltip contract, driven over Bun.WebView.
 *
 * A data-tooltip-visible tooltip shows immediately and tracks viewport
 * presence: hidden while its trigger is out of view, re-shown on scroll back
 * in. The tracker must never tear down on a transient reposition failure,
 * otherwise the tooltip stays hidden forever.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/tooltip-visible.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

it("always-visible tooltip hides out of view and re-shows when the trigger returns", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const hidden = () => view.evaluate(`document.querySelector('[role="tooltip"]')?.hidden`);

      // Trigger starts below the fold: the eagerly-created tooltip exists but
      // is hidden because the trigger is out of view.
      expect(await view.evaluate(`document.querySelectorAll('[role="tooltip"]').length`)).toBe(1);
      expect(await hidden()).toBe(true);

      // Scroll the trigger into view -> tooltip shows.
      await view.evaluate(`document.getElementById('trigger').scrollIntoView()`);
      await sleep(200);
      expect(await hidden()).toBe(false);

      // Scroll away -> tooltip hides again (but is not torn down).
      await view.evaluate(`window.scrollTo(0, 0)`);
      await sleep(200);
      expect(await hidden()).toBe(true);

      // Scroll back into view -> tooltip re-shows (the tracker survived).
      await view.evaluate(`document.getElementById('trigger').scrollIntoView()`);
      await sleep(200);
      expect(await hidden()).toBe(false);
    },
    { artifactName: "tooltip-visible" },
  );
});
