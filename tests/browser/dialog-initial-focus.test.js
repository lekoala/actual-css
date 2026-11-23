/*
 * The control showModal() focuses shows its ring only when the opening did.
 *
 * WebKit matched :focus-visible on it after a tap or a click, so an iPad
 * opened the kitchen-sink modal with Cancel ringed as if pressed. Real input
 * in every engine: the modality under test only exists for dispatched events.
 */
import { expect } from "bun:test";
import { fixtureUrl, waitForBrowser } from "../../scripts/utils/browser.js";
import { browserSuite } from "./browser-suite.js";

const { it, clickSelector, pressKey, tabUntil, tapSelector, withBrowserPage } =
  await browserSuite();

const FIXTURE = "tests/browser/dialog-initial-focus.html";

const bundle = await Bun.build({ entrypoints: ["src/js/full.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Runtime test bundle failed");
const runtime = `(() => {
  ${await bundle.outputs[0].text()}
})()`;

const opened = `document.getElementById("modal").open && document.activeElement?.id === "cancel"`;
const ringed = `document.getElementById("cancel").matches(":focus-visible")`;

for (const [name, press] of [
  ["a tap", tapSelector],
  ["a click", clickSelector],
]) {
  it(`a modal opened by ${name} focuses its first control without a ring`, async () => {
    await withBrowserPage(
      fixtureUrl(FIXTURE),
      async (view) => {
        await view.evaluate(runtime);
        await press(view, "#open");
        await waitForBrowser(view, opened);
        expect(await view.evaluate(ringed)).toBe(false);
      },
      { touch: true },
    );
  });
}

it("a modal opened from the keyboard keeps the ring on its first control", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await view.evaluate(runtime);
    expect(await tabUntil(view, `document.activeElement?.id === "open"`)).toBe(true);
    await pressKey(view, "Enter");
    await waitForBrowser(view, opened);
    expect(await view.evaluate(ringed)).toBe(true);
  });
});
