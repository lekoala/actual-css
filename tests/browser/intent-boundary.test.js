/*
 * Real-browser intent-boundary contract, driven over Bun.WebView.
 *
 * Verifies that the :where(.btn) boundary sets --intent to its
 * guaranteed-invalid initial value: a neutral button resolves the --intent
 * fallback (to --neutral), an explicit intent class wins, and an intent
 * inherited from an ancestor is blocked. This locks the custom-property
 * semantics ("initial resets to the guaranteed-invalid value") that the
 * framework's intent plumbing relies on.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/intent-boundary.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("intent boundary resets --intent so fallbacks apply and inherited intents are blocked", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const bg = (sel) => getComputedStyle(document.querySelector(sel)).backgroundColor;
        return {
          neutral: bg("#ref-neutral"),
          primary: bg("#ref-primary"),
          default: bg("#btn-default"),
          explicit: bg("#btn-primary"),
          inherited: bg("#btn-inherit"),
        };
      })()`);

      // Neutral button falls back to --neutral (not the literal initial keyword,
      // which would be transparent).
      expect(result.default).toBe(result.neutral);
      expect(result.default).not.toBe("rgba(0, 0, 0, 0)");
      // Explicit intent class wins.
      expect(result.explicit).toBe(result.primary);
      // An inherited intent from an ancestor is blocked by the boundary.
      expect(result.inherited).toBe(result.neutral);
    },
    { artifactName: "intent-boundary" },
  );
});
