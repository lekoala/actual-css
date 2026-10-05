/*
 * ARIA reads aria-current="false" and aria-current="" as not current, and React
 * and Vue serialize a false binding as "false". The generic current state of
 * .tab, .nav-link and .list-item, and reveal-current, must treat both like an
 * absent attribute.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/aria-current.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

// Exercise the source without depending on a rebuilt distribution bundle.
const bundle = await Bun.build({ entrypoints: ["src/js/full.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Runtime test bundle failed");
const source = await bundle.outputs[0].text();

it('"false" and "" render like an item without aria-current', async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const groups = await view.evaluate(`(() => {
        const paint = (el) => {
          const own = getComputedStyle(el);
          const before = getComputedStyle(el, "::before");
          const after = getComputedStyle(el, "::after");
          return [own.color, own.backgroundColor, before.content, after.content].join(" | ");
        };
        const read = (id) => [...document.getElementById(id).querySelectorAll("a")].map(paint);
        return { tabs: read("tabs"), nav: read("nav"), list: read("list") };
      })()`);

      for (const [name, [current, falseValue, empty, none]] of Object.entries(groups)) {
        // The fixture must paint a current state, or the pass is vacuous.
        expect(current, name).not.toBe(none);
        expect(falseValue, name).toBe(none);
        expect(empty, name).toBe(none);
      }
    },
    { width: 800, height: 600, artifactName: "aria-current" },
  );
});

it('reveal-current skips "false" and "" items', async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // Each strip shows a third of its items, sized from its own content.
      const overflows = await view.evaluate(`(() => {
        const strips = [...document.querySelectorAll(".pagination")];
        for (const strip of strips) strip.style.inlineSize = strip.scrollWidth / 3 + "px";
        return strips.every((strip) => strip.scrollWidth > strip.clientWidth);
      })()`);
      expect(overflows).toBe(true);

      await view.evaluate(`(() => { ${source} })()`);
      // The control places itself once the runtime ran; the other strip had
      // the same chance and must still sit at its start.
      await waitForBrowser(view, `document.getElementById("strip-control").scrollLeft !== 0`);
      const scrollLeft = await view.evaluate(
        `document.getElementById("strip-not-current").scrollLeft`,
      );
      expect(scrollLeft).toBe(0);
    },
    { width: 800, height: 600, artifactName: "aria-current-reveal" },
  );
});
