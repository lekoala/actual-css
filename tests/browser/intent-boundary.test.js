/*
 * Real-browser intent-boundary contract, driven over Bun.WebView.
 *
 * Verifies that the :where(.btn) boundary sets --intent to its
 * guaranteed-invalid initial value: a neutral button resolves the --intent
 * fallback (to --neutral), an explicit intent class wins, and an intent
 * inherited from an ancestor is blocked. This locks the custom-property
 * semantics ("initial resets to the guaranteed-invalid value") that the
 * framework's intent plumbing relies on.
 *
 * The .card, .navbar and .app-nav boundaries reset --intent / --intent-fg
 * alongside --ui-* precisely because the shared variants (.soft and .solid
 * here) read the intent tokens to paint their surface: without the reset an
 * ancestor intent tinted a variant that had no local intent class.
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
        const fg = (sel) => getComputedStyle(document.querySelector(sel)).color;
        const pairs = ["card", "navbar", "appnav"];
        const variants = ["soft", "solid"];
        const read = (name) => {
          const out = {};
          for (const v of variants) {
            const inherit = document.getElementById(name + "-inherit-" + v);
            const plain = document.getElementById(name + "-plain-" + v);
            out[v] = {
              inheritBg: inherit ? bg("#" + name + "-inherit-" + v) : null,
              inheritFg: inherit ? fg("#" + name + "-inherit-" + v) : null,
              plainBg: plain ? bg("#" + name + "-plain-" + v) : null,
              plainFg: plain ? fg("#" + name + "-plain-" + v) : null,
            };
          }
          return out;
        };
        return {
          neutral: bg("#ref-neutral"),
          primary: bg("#ref-primary"),
          danger: bg("#ref-danger"),
          default: bg("#btn-default"),
          explicit: bg("#btn-primary"),
          inherited: bg("#btn-inherit"),
          card: read("card"),
          navbar: read("navbar"),
          appnav: read("appnav"),
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

      // Every surface-owning component renders its shared variants byte-identically
      // to the same variant outside the intent wrapper — the ancestor .danger must
      // not paint through .soft or .solid.
      for (const name of ["card", "navbar", "appnav"]) {
        for (const v of ["soft", "solid"]) {
          expect(result[name][v].inheritBg).toBe(result[name][v].plainBg);
          expect(result[name][v].inheritFg).toBe(result[name][v].plainFg);
          // And the blocked variant is genuinely not the ancestor's color: the
          // assertion would be vacuous if both twins happened to be danger.
          expect(result[name][v].inheritBg).not.toBe(result.danger);
          expect(result[name][v].inheritFg).not.toBe(result.danger);
        }
      }
    },
    { artifactName: "intent-boundary" },
  );
});
