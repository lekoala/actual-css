/*
 * The sheet scrim must cover the viewport and swallow the click.
 *
 * Two jobs, and only the first is visual: .surface-backdrop paints the scrim,
 * and it also physically intercepts the pointer, so a click on the scrim
 * dismisses the sheet without also activating whatever sits underneath.
 *
 * This runs in a real engine because neither job is observable in the unit
 * layer — happy-dom does not lay out or hit-test. The transport change that
 * stopped reparenting the panel broke the placement silently: the scrim used
 * to be inserted next to a panel that had already been moved to the document
 * root, so it landed there too. With the panel left where it was authored,
 * `menu.before(backdrop)` would strand the scrim inside the author's
 * container, subject to its overflow and stacking. Hence the fixture's
 * deliberately overflow:hidden host.
 *
 * The native ::backdrop is not an alternative here. It is painted for a manual
 * popover and it does inherit custom properties from its originating element,
 * but the UA sets pointer-events: none on an open popover's backdrop and that
 * is not overridable from author CSS — not even with !important, since a UA
 * !important outranks an author one. Measured: the click reaches the element
 * behind the scrim and activates it. So the scrim stays a real element.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/surface-sheet-scrim.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

it("the sheet scrim covers the viewport and absorbs the click that dismisses it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`document.getElementById("trigger").click()`);
      await sleep(400);

      const open = JSON.parse(
        await view.evaluate(`(() => {
          const panel = document.getElementById("sheet");
          const scrim = document.querySelector(".surface-backdrop");
          const rect = scrim && scrim.getBoundingClientRect();
          return JSON.stringify({
            isSheet: panel.classList.contains("is-sheet"),
            panelParent: panel.parentElement.className,
            scrimParent: scrim ? scrim.parentElement.tagName : null,
            covers: rect
              ? Math.round(rect.width) >= innerWidth && Math.round(rect.height) >= innerHeight
              : false,
            hitTest: (() => {
              const el = document.elementFromPoint(30, 30);
              return el ? el.className || el.tagName : null;
            })(),
          });
        })()`),
      );

      // The panel stays exactly where the author put it — that is the point of
      // the transport, and what keeps its inherited context intact.
      expect(open.panelParent).toBe("flyout-trigger");
      expect(open.isSheet).toBe(true);

      // The scrim, which the runtime creates and no author owns, does need the
      // document root: a plain fixed div cannot escape the host's overflow.
      expect(open.scrimParent).toBe("BODY");
      expect(open.covers).toBe(true);
      expect(open.hitTest).toBe("surface-backdrop");

      // A genuine click on the scrim, dispatched through the browser's own
      // hit testing rather than synthesised on a node.
      for (const type of ["mousePressed", "mouseReleased"]) {
        await view.cdp("Input.dispatchMouseEvent", {
          type,
          x: 30,
          y: 30,
          button: "left",
          clickCount: 1,
        });
      }
      await sleep(300);

      const after = JSON.parse(
        await view.evaluate(`JSON.stringify({
          behindClicks: window.behindClicks,
          surfaceOpen: document.getElementById("sheet").classList.contains("is-open"),
        })`),
      );

      expect(after.surfaceOpen).toBe(false);
      expect(after.behindClicks).toBe(0);
    },
    {
      artifactName: "surface-sheet-scrim",
      width: 420,
      height: 700,
      mediaFeatures: [
        { name: "prefers-reduced-motion", value: "no-preference" },
        // shouldUseSheet() also consults the pointer type.
        { name: "pointer", value: "coarse" },
      ],
    },
  );
});
