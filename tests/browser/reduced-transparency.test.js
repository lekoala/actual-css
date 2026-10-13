/*
 * prefers-reduced-transparency contract, driven over Bun.WebView.
 *
 * Under reduce, a frosted surface paints opaque and stops blurring: the core's
 * .topbar and .form-actions.sticky, and every panel of the glass theme, whose
 * --surface-* are translucent by design. Without the preference the same
 * elements frost, which proves the fixture still exercises the override.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";
import { RASTERIZE } from "../../src/tooling/color.js";

const FIXTURE = "tests/browser/reduced-transparency.html";
const TIMEOUT = 60_000;
const IDS = ["topbar", "actions", "glass-topbar", "glass-card", "glass-flyout"];

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const readSurfaces = (view) =>
  view.evaluate(`(() => {
    const rgba = ${RASTERIZE};
    return {
      reduce: matchMedia("(prefers-reduced-transparency: reduce)").matches,
      surfaces: ${JSON.stringify(IDS)}.map((id) => {
        const cs = getComputedStyle(document.getElementById(id));
        return { id, alpha: rgba(cs.backgroundColor)[3], blur: cs.backdropFilter };
      }),
    };
  })()`);

it("frosted surfaces blur without a transparency preference", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const { reduce, surfaces } = await readSurfaces(view);
      expect(reduce).toBe(false);
      for (const { id, alpha, blur } of surfaces) {
        expect({ id, blur: blur === "none" }).toEqual({ id, blur: false });
        expect({ id, translucent: alpha < 255 }).toEqual({ id, translucent: true });
      }
    },
    {
      artifactName: "reduced-transparency-off",
      mediaFeatures: [{ name: "prefers-reduced-transparency", value: "no-preference" }],
    },
  );
});

it("reduced transparency paints every frosted surface opaque", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const { reduce, surfaces } = await readSurfaces(view);
      expect(reduce).toBe(true);
      for (const { id, alpha, blur } of surfaces) {
        expect({ id, alpha, blur }).toEqual({ id, alpha: 255, blur: "none" });
      }
    },
    {
      artifactName: "reduced-transparency",
      mediaFeatures: [{ name: "prefers-reduced-transparency", value: "reduce" }],
    },
  );
});
