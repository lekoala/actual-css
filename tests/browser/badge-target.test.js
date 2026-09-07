/*
 * Real-browser badge dismiss target contract, driven over Bun.WebView.
 *
 * WCAG 2.2 2.5.8 floors pointer targets at 24 CSS px. The badge's dismiss
 * button uses a 24px literal floor on top of --density-compact-size, so a
 * density that dips below 24px (.sm = 20px, or a thematic 17px override) can
 * no longer shrink the target — while the negative margins keep the badge
 * itself visually compact. At and above the floor (default 24px, .lg 30px)
 * the floor is a no-op and badge/button keep their normal relationship.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/badge-target.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("badge dismiss targets never fall below 24x24 while the badge stays compact", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const rect = (id) => {
          const el = document.getElementById(id);
          const r = el.getBoundingClientRect();
          return { w: r.width, h: r.height };
        };
        const measure = (id) => ({
          badge: rect(id),
          button: (() => {
            const r = document.querySelector("#" + id + " > button").getBoundingClientRect();
            return { w: r.width, h: r.height };
          })(),
        });
        return { sm: measure("sm"), def: measure("default"), lg: measure("lg"), custom: measure("custom") };
      })()`);

      // The floor holds the target at 24x24 whatever the density…
      for (const key of ["sm", "def", "lg", "custom"]) {
        expect(result[key].button.w).toBeGreaterThanOrEqual(24);
        expect(result[key].button.h).toBeGreaterThanOrEqual(24);
      }

      // …without inflating the badge under the floor.
      expect(result.sm.badge.h).toBeLessThan(24);
      expect(result.sm.badge.h).toBeLessThan(result.sm.button.h);
      expect(result.custom.badge.h).toBeLessThan(24);
      expect(result.custom.badge.h).toBeLessThan(result.custom.button.h);

      // At and above the floor, the normal geometry is preserved: badge and
      // button track each other.
      expect(Math.abs(result.def.badge.h - result.def.button.h)).toBeLessThanOrEqual(1);
      expect(result.def.button.h).toBeGreaterThanOrEqual(24);
      expect(Math.abs(result.lg.badge.h - result.lg.button.h)).toBeLessThanOrEqual(1);
      expect(result.lg.button.h).toBeGreaterThanOrEqual(30);
    },
    { artifactName: "badge-target" },
  );
});
