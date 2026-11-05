/*
 * data-dialog-open in a real browser: happy-dom has no :modal and closes
 * synchronously, so the upgrade of an `open` dialog is only observable here.
 * Chrome queues the close event of the close() that precedes showModal(), and
 * delivers it while the dialog is open again.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;

// Exercise the source without depending on a rebuilt distribution bundle.
const bundle = await Bun.build({ entrypoints: ["src/js/dialog.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Dialog test bundle failed");
const source = await bundle.outputs[0].text();

const state = `(() => {
  const dialog = document.getElementById("notice");
  return {
    open: dialog.open,
    modal: dialog.matches(":modal"),
    ariaModal: dialog.getAttribute("aria-modal"),
    lock: document.documentElement.classList.contains("has-modal-open"),
    focusInside: dialog.contains(document.activeElement),
    closes: window.closes,
  };
})()`;

it("an open dialog upgrades to modal without a stray close", async () => {
  await withBrowserPage(fixtureUrl("tests/browser/dialog-open.html"), async (view) => {
    await view.evaluate(`(() => {
      const dialog = document.getElementById("notice");
      window.closes = 0;
      dialog.addEventListener("close", () => window.closes++);
      // Registered before the runtime, this capture listener sees the queued
      // close ahead of the runtime's own: wait for it, not for toggle, whose
      // order relative to close is not stable.
      addEventListener("close", (event) => {
        if (event.target === dialog) window.closeDelivered = true;
      }, { capture: true, once: true });
      ${source}
    })()`);
    await waitForBrowser(view, "window.closeDelivered === true");

    expect(await view.evaluate(state)).toEqual({
      open: true,
      modal: true,
      ariaModal: "true",
      lock: true,
      focusInside: true,
      closes: 0,
    });

    // A real close afterwards runs the normal lifecycle.
    await view.press("Escape");
    await waitForBrowser(view, `!document.getElementById("notice").open`);
    await waitForBrowser(view, "window.closes === 1");
    expect((await view.evaluate(state)).lock).toBe(false);
  });
}, 60_000);

// Not specific to data-dialog-open: any close() followed by an opening in the
// same task receives its close event while open again.
it("a close event delivered after a reopening leaves the new opening alone", async () => {
  await withBrowserPage(fixtureUrl("tests/browser/dialog-open.html"), async (view) => {
    await view.evaluate(`(() => { ${source} })()`);
    await waitForBrowser(view, `document.getElementById("notice").matches(":modal")`);

    await view.evaluate(`(() => {
      const dialog = document.getElementById("notice");
      addEventListener("close", (event) => {
        if (event.target === dialog) window.closeDelivered = true;
      }, { capture: true, once: true });
      dialog.close();
      document.getElementById("reopen").click();
    })()`);
    await waitForBrowser(view, "window.closeDelivered === true");

    const after = await view.evaluate(state);
    expect(after.modal).toBe(true);
    expect(after.lock).toBe(true);
  });
}, 60_000);
