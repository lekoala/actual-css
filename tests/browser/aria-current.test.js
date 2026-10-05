/*
 * Current states name their aria-current value: "page" or "true" (a flyout
 * section) on .tab, "page" or "location" on .nav-link, "page" or "true" (a
 * master/detail item) on .list-item.
 * Any other value — including the "false" React and Vue serialize for a false
 * binding — renders like an absent attribute, and reveal-current skips the
 * values its strips do not paint.
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

it("only the supported values paint the current state", async () => {
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
        const read = (id) => {
          const links = [...document.getElementById(id).querySelectorAll("a")];
          const none = paint(links.find((a) => a.hasAttribute("data-reference")));
          return links
            .filter((a) => a.hasAttribute("aria-current"))
            .map((a) => ({
              value: a.getAttribute("aria-current"),
              supported: a.hasAttribute("data-current"),
              painted: paint(a) !== none,
            }));
        };
        return { tabs: read("tabs"), nav: read("nav"), list: read("list") };
      })()`);

      for (const [name, items] of Object.entries(groups)) {
        for (const { value, supported, painted } of items) {
          expect(painted, `${name} aria-current="${value}"`).toBe(supported);
        }
      }
    },
    { width: 800, height: 600, artifactName: "aria-current" },
  );
});

it("reveal-current skips values its strips do not paint", async () => {
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
