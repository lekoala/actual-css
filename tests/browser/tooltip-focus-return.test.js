/*
 * Tooltip on a dialog invoker, over real input.
 *
 * Hover the trigger (tip shows), click it (a drawer opens), close the drawer
 * with the pointer: the dialog hands focus back to the trigger, and the tip
 * used to come back with it, on a button the user had just acted on. Focus
 * only shows a tip when it matches :focus-visible, and a focus restored after
 * a pointer close does not. Keyboard focus still does.
 *
 * Real CDP input throughout: modality is what is under test, and el.click()
 * or el.focus() would not produce the pointer modality the bug needs.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/tooltip-focus-return.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const tipOpen = `!!document.querySelector('[role="tooltip"]')?.matches(":popover-open")`;

async function centre(view, id) {
  return view
    .evaluate(`(() => {
      const rect = document.getElementById(${JSON.stringify(id)}).getBoundingClientRect();
      return JSON.stringify({
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      });
    })()`)
    .then(JSON.parse);
}

async function pointerTo(view, id) {
  await view.cdp("Input.dispatchMouseEvent", { ...(await centre(view, id)), type: "mouseMoved" });
}

async function click(view, id) {
  const at = await centre(view, id);
  await view.cdp("Input.dispatchMouseEvent", { ...at, type: "mouseMoved" });
  for (const type of ["mousePressed", "mouseReleased"]) {
    await view.cdp("Input.dispatchMouseEvent", { ...at, type, button: "left", clickCount: 1 });
  }
}

async function tab(view, shift = false) {
  for (const type of ["keyDown", "keyUp"]) {
    await view.cdp("Input.dispatchKeyEvent", {
      type,
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      modifiers: shift ? 8 : 0,
    });
  }
}

it("a drawer closed with the pointer does not bring the invoker's tooltip back", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await pointerTo(view, "trigger");
      await waitForBrowser(view, tipOpen);

      await click(view, "trigger");
      await waitForBrowser(view, `document.getElementById("panel").open`);

      await click(view, "close");
      await waitForBrowser(
        view,
        `!document.getElementById("panel").open && document.activeElement?.id === "trigger"`,
      );

      // Elapsed time is the contract here: the tip shows after a 150ms delay,
      // so its absence is only meaningful once that delay has passed.
      await view.evaluate("new Promise((r) => setTimeout(r, 300))");
      expect(await view.evaluate(tipOpen)).toBe(false);

      // Keyboard focus is still a show intent: leave and come back with Tab.
      await tab(view);
      await tab(view, true);
      await waitForBrowser(view, `document.activeElement?.id === "trigger"`);
      await waitForBrowser(view, tipOpen);
      expect(await view.evaluate(tipOpen)).toBe(true);
    },
    { artifactName: "tooltip-focus-return" },
  );
});
