/*
 * .scroller fades the edges an inline-scrolling region can still scroll
 * toward: the end at rest, both mid-way, the start at the end. A region that
 * fits, or scrolls only on the block axis, stays unmasked. The fade rides a
 * scroll-driven animation, so it must hold under reduced motion too, where
 * the reset shortens every animation duration.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/scroller-fade.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

// Which inline edges the computed mask fades, in reading order. `transparent`
// computes to rgba(0, 0, 0, 0); the direction flips the physical gradient.
const EDGES = `(id) => {
  const mask = getComputedStyle(document.getElementById(id)).maskImage;
  if (mask === "none") return "none";
  const clear = "rgba(0, 0, 0, 0)";
  const stops = mask.slice(mask.indexOf(",") + 1, -1).trim();
  const edges = [stops.startsWith(clear) && "start", stops.endsWith(clear) && "end"];
  return edges.filter(Boolean).join("+");
}`;

// Scroll to a fraction of the range; RTL scrolls toward negative scrollLeft.
const scrollTo = (id, fraction) => `(() => {
  const el = document.getElementById(${JSON.stringify(id)});
  const sign = getComputedStyle(el).direction === "rtl" ? -1 : 1;
  el.scrollLeft = sign * (el.scrollWidth - el.clientWidth) * ${fraction};
})()`;

const edgesOf = (id) => `(${EDGES})(${JSON.stringify(id)})`;

for (const [label, mediaFeatures] of [
  ["default motion", []],
  ["reduced motion", [{ name: "prefers-reduced-motion", value: "reduce" }]],
]) {
  it(`scroller fades only the edges left to scroll toward (${label})`, async () => {
    await withBrowserPage(
      fixtureUrl(FIXTURE),
      async (view) => {
        const supported = await view.evaluate(`CSS.supports("animation-timeline", "scroll()")`);
        expect(supported, "test engine must run scroll-driven animations").toBe(true);

        for (const id of ["ltr", "rtl", "ltr-in-rtl"]) {
          expect(await view.evaluate(edgesOf(id)), `${id} at rest`).toBe("end");
          await view.evaluate(scrollTo(id, 0.5));
          await waitForBrowser(view, `${edgesOf(id)} === "start+end"`);
          await view.evaluate(scrollTo(id, 1));
          await waitForBrowser(view, `${edgesOf(id)} === "start"`);
        }
        // RTL fades the physical left at the end of the trail.
        expect(
          await view.evaluate(`getComputedStyle(document.getElementById("rtl")).maskImage`),
        ).toContain("to left");
        // The fade follows the strip's own direction, not an outer [dir="rtl"].
        expect(
          await view.evaluate(`getComputedStyle(document.getElementById("ltr-in-rtl")).maskImage`),
        ).toContain("to right");

        expect(await view.evaluate(edgesOf("fits"))).toBe("none");
        expect(await view.evaluate(edgesOf("vertical"))).toBe("none");
      },
      { width: 800, height: 600, mediaFeatures, artifactName: "scroller-fade" },
    );
  });
}
