/*
 * .scroller styles the scrollbar on any primary pointer but touch. Chromium
 * trades a touch screen's overlay scrollbar, hidden at rest, for a classic
 * visible one as soon as scrollbar-color or scrollbar-width is set: on a phone
 * every .scroller strip grew a permanent bar. A coarse pointer must leave both
 * properties at their initial value. The other case is not "fine": headless
 * Chrome on a CI runner without a mouse reports pointer: none, and a
 * pointerless device draws classic scrollbars too.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/scroller.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const READ = `(() => {
  const style = getComputedStyle(document.getElementById("strip"));
  return {
    coarse: matchMedia("(pointer: coarse)").matches,
    width: style.scrollbarWidth,
    color: style.scrollbarColor,
  };
})()`;

it("styles the scrollbar unless the pointer is touch", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const result = await view.evaluate(READ);
    expect(result.coarse).toBe(false);
    expect(result.width).toBe("thin");
    expect(result.color).not.toBe("auto");
  });
});

it("leaves the native overlay scrollbar to a touch screen", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await view.cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
    const result = await view.evaluate(READ);
    // Guards the emulation itself: without it the assertion below is vacuous.
    expect(result.coarse).toBe(true);
    expect(result.width).toBe("auto");
    expect(result.color).toBe("auto");
  });
});
