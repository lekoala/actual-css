/*
 * Real-browser rating focus contract, driven over Bun.WebView.
 *
 * The rating component draws its star fill from --rating-color, which follows
 * the intent. The focus outline must NOT follow the intent — the core doctrine
 * guarantees --focus at 3:1 against both --surface and --surface-solid, so the
 * outline color must stay --focus regardless of the rating's intent.
 *
 * Focus is forced via CSS.forcePseudoState to reliably trigger :focus-visible
 * on the hidden radios without depending on tab order.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/rating-focus.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("rating focus outline stays --focus across intents", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.cdp("DOM.enable");
      await view.cdp("CSS.enable");

      const { root: docRoot } = await view.cdp("DOM.getDocument");

      for (const id of ["rp-3", "rd-3", "rw-3"]) {
        const { nodeId } = await view.cdp("DOM.querySelector", {
          nodeId: docRoot.nodeId,
          selector: `#${id}`,
        });
        await view.cdp("CSS.forcePseudoState", {
          nodeId,
          forcedPseudoClasses: ["focus", "focus-visible"],
        });

        const style = await view.evaluate(`(() => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          const norm = (value) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = value;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            return r + "," + g + "," + b;
          };
          const el = document.getElementById(${JSON.stringify(id)});
          const cs = getComputedStyle(el);
          const rootCs = getComputedStyle(document.documentElement);
          return {
            outlineColor: norm(cs.outlineColor),
            outlineStyle: cs.outlineStyle,
            ratingColor: norm(cs.backgroundColor),
            focusColor: norm(rootCs.getPropertyValue("--focus")),
          };
        })()`);

        expect(style.outlineStyle).toBe("solid");
        expect(style.outlineColor).toBe(style.focusColor);
        expect(style.outlineColor).not.toBe(style.ratingColor);
      }
    },
    { artifactName: "rating-focus" },
  );
});
