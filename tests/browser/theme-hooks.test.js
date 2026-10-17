/*
 * Hooks a theme sets to change component behaviour: --btn-shadow (a resting
 * elevation the solid hover overlay must compose with, not replace) and the
 * accordion marker glyph and open turn.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  forceStates,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/theme-hooks.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

// Trap: the hover overlay is itself a box-shadow (inset 999px), so a theme
// elevation set on .btn vanished on hover until both shared one list.
it("keeps --btn-shadow under the solid hover overlay", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await forceStates(view, { "#btn-hover": ["hover"] });
    await waitForBrowser(
      view,
      `getComputedStyle(document.getElementById("btn-hover")).boxShadow.includes("inset")`,
    );
    const shadow = await view.evaluate(`(() => ({
      rest: getComputedStyle(document.getElementById("btn-rest")).boxShadow,
      hover: getComputedStyle(document.getElementById("btn-hover")).boxShadow,
    }))()`);

    expect(shadow.rest).toBe("rgb(0, 0, 0) 4px 4px 0px 0px");
    expect(shadow.hover.startsWith("rgb(0, 0, 0) 4px 4px 0px 0px, ")).toBe(true);
    expect(shadow.hover).toContain("999px inset");
  });
});

it("turns the accordion marker by its hook and swaps its glyph", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const marker = await view.evaluate(`(() => {
      const read = (selector) => {
        const style = getComputedStyle(document.querySelector(selector), "::after");
        return { transform: style.transform, mask: style.maskImage };
      };
      return {
        chevronOpen: read("#acc-default details[open] summary"),
        plusOpen: read("#acc-plus details[open] summary"),
        plusClosed: read("#acc-plus details:not([open]) summary"),
      };
    })()`);
    const angle = (matrix) => {
      const [a, b] = matrix.match(/-?[\d.e-]+/g).map(Number);
      return Math.round((Math.atan2(b, a) * 180) / Math.PI);
    };

    expect(Math.abs(angle(marker.chevronOpen.transform))).toBe(180);
    expect(angle(marker.plusOpen.transform)).toBe(45);
    expect(marker.plusClosed.transform).toBe("none");
    expect(marker.plusOpen.mask).not.toBe(marker.chevronOpen.mask);
    expect(marker.plusOpen.mask).toBe(marker.plusClosed.mask);
  });
});
