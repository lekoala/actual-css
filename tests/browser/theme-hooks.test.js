/*
 * Hooks a theme sets to change component behaviour: --btn-shadow (a resting
 * elevation the solid hover overlay must compose with, not replace),
 * --btn-finish, --shadow-control and --shadow-inset, and the accordion marker
 * glyph and open turn.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  forceStates,
  tabUntil,
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

// Trap: the focus rule reset box-shadow to none to drop any halo, which
// erased a theme's field elevation the moment the keyboard reached it.
it("keeps --control-shadow on a keyboard-focused field", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await tabUntil(view, `document.activeElement?.id === "field"`);
    await waitForBrowser(view, `document.getElementById("field").matches(":focus-visible")`);
    const field = await view.evaluate(`(() => {
      const style = getComputedStyle(document.getElementById("field"));
      return { shadow: style.boxShadow, outline: style.outlineStyle };
    })()`);

    expect(field.outline).toBe("solid");
    expect(field.shadow).toBe("rgb(0, 0, 0) 3px 3px 0px 0px");
  });
});

// Trap: the hover rule used the background shorthand, which resets the image
// layer, so a finish set on .btn vanished under the pointer.
it("keeps --btn-finish under the hover and off unfilled variants", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await forceStates(view, { "#finish-hover": ["hover"] });
    await waitForBrowser(
      view,
      `getComputedStyle(document.getElementById("finish-hover")).boxShadow.includes("inset")`,
    );
    const image = await view.evaluate(`(() => ({
      hover: getComputedStyle(document.getElementById("finish-hover")).backgroundImage,
      outline: getComputedStyle(document.getElementById("finish-outline")).backgroundImage,
    }))()`);

    expect(image.hover).toStartWith("linear-gradient(");
    expect(image.outline).toBe("none");
  });
});

it("recesses fields and rails with --shadow-inset, kept on keyboard focus", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await tabUntil(view, `document.activeElement?.id === "relief-field"`);
    await waitForBrowser(view, `document.getElementById("relief-field").matches(":focus-visible")`);
    const shadows = await view.evaluate(`(() => Object.fromEntries(
      ["relief-field", "relief-switch", "relief-segmented", "relief-progress"].map((id) => [
        id,
        getComputedStyle(document.getElementById(id)).boxShadow,
      ]),
    ))()`);

    for (const shadow of Object.values(shadows)) {
      expect(shadow).toBe("rgb(0, 0, 0) 0px 2px 0px 0px inset");
    }
  });
});

// Trap: the selected segment's ring and its shadow share one list, so the
// control relief must be appended after the ring, never replace the list.
it("lifts moving parts with --shadow-control and falls back to --shadow", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const shadows = await view.evaluate(`(() => ({
      knob: getComputedStyle(document.getElementById("relief-switch"), "::before").boxShadow,
      pill: getComputedStyle(document.querySelector("#relief-segmented .segment")).boxShadow,
      plain: getComputedStyle(document.querySelector("#plain-segmented .segment")).boxShadow,
    }))()`);

    expect(shadows.knob).toBe("rgb(0, 0, 0) 0px 1px 0px 0px");
    expect(shadows.pill).toEndWith(", rgb(0, 0, 0) 0px 1px 0px 0px");
    // Unset, the pill keeps the surface --shadow (its 12px ambient blur).
    expect(shadows.plain).toContain("12px");
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
