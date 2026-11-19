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
  clickSelector,
  fixtureUrl,
  pressKey,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/tooltip-focus-return.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const bundle = await Bun.build({ entrypoints: ["src/js/full.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Runtime test bundle failed");
const runtime = `(() => {
  ${await bundle.outputs[0].text()}
})()`;

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
  await pointerTo(view, id);
  await clickSelector(view, `#${id}`);
}

it("a drawer closed with the pointer does not bring the invoker's tooltip back", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(runtime);
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
      expect(await tabUntil(view, `document.activeElement?.id === "after"`, { max: 1 })).toBe(true);
      await pressKey(view, "Tab", { modifiers: 8 });
      await waitForBrowser(view, `document.activeElement?.id === "trigger"`);
      await waitForBrowser(view, tipOpen);
      expect(await view.evaluate(tipOpen)).toBe(true);
    },
    { artifactName: "tooltip-focus-return" },
  );
});

it("a press dismisses the tooltip through pointer capture, and fresh hover or Tab restores it", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await view.evaluate(runtime);
    await view.evaluate(`(() => {
      const trigger = document.getElementById("trigger");
      trigger.removeAttribute("command");
      trigger.addEventListener("pointerdown", (event) => {
        trigger.setPointerCapture(event.pointerId);
        event.stopPropagation();
      }, { once: true });
      trigger.addEventListener("gotpointercapture", () => { trigger.dataset.captured = "true"; });
      trigger.addEventListener("lostpointercapture", () => { delete trigger.dataset.captured; });
    })()`);

    await pointerTo(view, "trigger");
    await waitForBrowser(view, tipOpen);
    const trigger = await centre(view, "trigger");
    const outside = await centre(view, "after");
    await view.cdp("Input.dispatchMouseEvent", {
      ...trigger,
      type: "mousePressed",
      button: "left",
      buttons: 1,
      clickCount: 1,
    });
    expect(await view.evaluate(tipOpen)).toBe(false);

    // CDP needs the button on the move as well to preserve mouse capture.
    await view.cdp("Input.dispatchMouseEvent", {
      ...outside,
      type: "mouseMoved",
      button: "left",
      buttons: 1,
    });
    await waitForBrowser(view, `document.querySelector("#trigger[data-captured]") !== null`);
    // Cross the show delay while the pointer is held to catch a delayed reopen.
    await view.evaluate("new Promise((resolve) => setTimeout(resolve, 200))");
    expect(await view.evaluate(tipOpen)).toBe(false);
    await view.cdp("Input.dispatchMouseEvent", {
      ...outside,
      type: "mouseReleased",
      button: "left",
      buttons: 0,
      clickCount: 1,
    });
    await waitForBrowser(view, `document.querySelector("#trigger[data-captured]") === null`);
    expect(await view.evaluate(tipOpen)).toBe(false);

    await pointerTo(view, "trigger");
    await waitForBrowser(view, tipOpen);
    await pointerTo(view, "after");
    await waitForBrowser(view, `!(${tipOpen})`);
    expect(await tabUntil(view, `document.activeElement?.id === "after"`, { max: 1 })).toBe(true);
    await pressKey(view, "Tab", { modifiers: 8 });
    await waitForBrowser(view, `document.querySelector("#trigger:focus-visible") !== null`);
    await waitForBrowser(view, tipOpen);

    await click(view, "trigger");
    expect(await view.evaluate(tipOpen)).toBe(false);
    expect(await tabUntil(view, `document.activeElement?.id === "after"`, { max: 1 })).toBe(true);
    await pressKey(view, "Tab", { modifiers: 8 });
    await waitForBrowser(view, `document.querySelector("#trigger:focus-visible") !== null`);
    await waitForBrowser(view, tipOpen);
  });
});

it("a tap does not open a hover tooltip through compatibility mouse events", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await view.evaluate(runtime);
    await view.evaluate(`(() => {
      const trigger = document.getElementById("trigger");
      trigger.removeAttribute("command");
      trigger.addEventListener("click", () => { trigger.dataset.tapped = "true"; });
    })()`);
    await view.cdp("Emulation.setTouchEmulationEnabled", { enabled: true });

    const at = await centre(view, "trigger");
    await view.cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [at] });
    await view.cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await waitForBrowser(view, `document.querySelector("#trigger[data-tapped]") !== null`);
    expect(await view.evaluate(`document.querySelector('[role="tooltip"]') === null`)).toBe(true);
  });
});

it("pressing a text field dismisses its tooltip even when the field gains visible focus", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await view.evaluate(runtime);
    await pointerTo(view, "field");
    await waitForBrowser(view, tipOpen);
    await click(view, "field");
    await waitForBrowser(view, `document.querySelector("#field:focus-visible") !== null`);
    // Wait through the show delay to catch a reopen caused by focusin.
    await view.evaluate("new Promise((resolve) => setTimeout(resolve, 200))");
    expect(await view.evaluate(tipOpen)).toBe(false);

    await pressKey(view, "Tab", { modifiers: 8 });
    await waitForBrowser(view, `document.activeElement?.id === "after"`);
    expect(
      await tabUntil(view, `document.querySelector("#field:focus-visible") !== null`, { max: 1 }),
    ).toBe(true);
    await waitForBrowser(view, tipOpen);
  });
});
