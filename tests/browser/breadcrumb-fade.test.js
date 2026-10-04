/*
 * The breadcrumb start fade exists only once the trail has scrolled: at rest
 * the root stays fully inked, scrolled the clipped start fades. It rides a
 * scroll-driven animation, so it must also hold under reduced motion, where
 * the reset shortens every animation duration.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/inline-visible.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const stop = (id) =>
  `getComputedStyle(document.getElementById(${JSON.stringify(id)})).getPropertyValue("--breadcrumb-fade-start")`;
// The fade length, resolved: the stop's end value. Padding computes to an
// absolute length regardless of layout (a flex item would shrink its width).
const FADE = `(() => {
  const probe = document.createElement("span");
  probe.style.paddingLeft = "var(--breadcrumb-fade)";
  document.getElementById("trail-long").append(probe);
  const px = getComputedStyle(probe).paddingLeft;
  probe.remove();
  return px;
})()`;
// Scroll to the far inline end; RTL scrolls toward negative scrollLeft.
const toEnd = (id) =>
  `(() => {
    const list = document.getElementById(${JSON.stringify(id)});
    const sign = getComputedStyle(list).direction === "rtl" ? -1 : 1;
    list.scrollLeft = sign * list.scrollWidth;
  })()`;

for (const [label, mediaFeatures] of [
  ["default motion", []],
  ["reduced motion", [{ name: "prefers-reduced-motion", value: "reduce" }]],
]) {
  it(`breadcrumb start fade follows the trail's scroll (${label})`, async () => {
    await withBrowserPage(
      fixtureUrl(FIXTURE),
      async (view) => {
        const supported = await view.evaluate(`CSS.supports("animation-timeline", "scroll()")`);
        expect(supported, "test engine must run scroll-driven animations").toBe(true);
        const fade = await view.evaluate(FADE);
        expect(Number.parseFloat(fade)).toBeGreaterThan(0);

        for (const id of ["trail-long", "trail-rtl"]) {
          expect(await view.evaluate(stop(id)), `${id} at rest`).toBe("0px");
          await view.evaluate(toEnd(id));
          await waitForBrowser(view, `${stop(id)} === ${JSON.stringify(fade)}`);
        }
      },
      { width: 800, height: 600, mediaFeatures, artifactName: "breadcrumb-fade" },
    );
  });
}
