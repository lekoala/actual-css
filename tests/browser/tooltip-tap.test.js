/*
 * Tooltips under a finger, over real touch input in every engine.
 *
 * A tap opens a tooltip and pins it until a second tap, a tap elsewhere or
 * Escape; data-tooltip-no-tap opts a trigger out. Synthetic pointer events
 * cannot stand in: the bug this guards was the sequence a real tap produces
 * (pointerover, pointerdown, pointerup, pointerleave, compatibility mouse
 * events, focus).
 */
import { expect } from "bun:test";
import { fixtureUrl, waitForBrowser } from "../../scripts/utils/browser.js";
import { browserSuite } from "./browser-suite.js";

const { it, tapSelector, withBrowserPage } = await browserSuite();

const FIXTURE = "tests/browser/tooltip-tap.html";

const bundle = await Bun.build({ entrypoints: ["src/js/full.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Runtime test bundle failed");
const runtime = `(() => {
  ${await bundle.outputs[0].text()}
})()`;

const open = (id) => `!!document.getElementById(${JSON.stringify(id)})?.matches(":popover-open")`;
const anyTipOpen = `[...document.querySelectorAll("[role=tooltip]")].some((tip) => tip.matches(":popover-open"))`;

// Elapsed time is the contract: the hover show delay is 150ms, so the absence
// of a tooltip only means something once that delay has passed.
const pastShowDelay = (view) => view.evaluate("new Promise((r) => setTimeout(r, 300))");

it("data-tooltip-no-tap leaves the tooltip shut and the action runs", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(runtime);
      await view.evaluate(`document.getElementById("copy").addEventListener("click", (e) => {
        e.currentTarget.dataset.activated = "true";
      })`);
      await tapSelector(view, "#copy");
      await waitForBrowser(view, `document.querySelector("#copy[data-activated]") !== null`);
      await pastShowDelay(view);
      expect(await view.evaluate(anyTipOpen)).toBe(false);
    },
    { width: 390, touch: true },
  );
});

it("a tap opens a tooltip and closes on a second tap or a tap elsewhere", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(runtime);

      await tapSelector(view, "#dossier");
      await waitForBrowser(view, open("dossier-tip"));
      // The finger is gone; a hover tooltip would close after its hide delay.
      await pastShowDelay(view);
      expect(await view.evaluate(open("dossier-tip"))).toBe(true);

      await tapSelector(view, "#dossier");
      await waitForBrowser(view, `!(${open("dossier-tip")})`);
      await pastShowDelay(view);
      expect(await view.evaluate(open("dossier-tip"))).toBe(false);

      await tapSelector(view, "#dossier");
      await waitForBrowser(view, open("dossier-tip"));
      await tapSelector(view, "#outside");
      await waitForBrowser(view, `!(${open("dossier-tip")})`);
    },
    { width: 390, touch: true },
  );
});
