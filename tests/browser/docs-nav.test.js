import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;
const group = (slug) => `details[data-docs-nav-group="${slug}"]`;
const isOpen = (slug) => `document.querySelector('${group(slug)}').open`;

// Trap: each page renders its groups open, so a collapsed group reopened on
// the next page and collapsing was pointless.
it("a collapsed sidebar group stays collapsed, except around the current page", async () => {
  await withBrowserPage(
    fixtureUrl("site/components/rating.html"),
    async (view) => {
      // A real click lands at the summary's viewport point. The sidebar scrolls
      // on its own, and CI's wider fallback font pushed the summary below the
      // fold, so the click hit nothing; bring it in view as a reader would. The
      // short viewport keeps that case covered on every machine.
      const summary = `${group("patterns")} > summary`;
      await view.evaluate(
        `document.querySelector('${summary}').scrollIntoView({ block: "center" })`,
      );
      await waitForBrowser(
        view,
        `(() => { const r = document.querySelector('${summary}').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()`,
      );
      await clickSelector(view, summary);
      // The store is written on the async toggle event, after `open` flips:
      // wait for the write itself before leaving the page.
      await waitForBrowser(
        view,
        `(sessionStorage.getItem("actual-docs-collapsed") ?? "").includes('"patterns"')`,
      );
      const patternPage = await view.evaluate(
        `document.querySelector('${group("patterns")} a').href`,
      );

      await view.navigate(fixtureUrl("site/components/badge.html"));
      await waitForBrowser(view, `!${isOpen("patterns")}`);
      expect(await view.evaluate(isOpen("components"))).toBe(true);

      await view.navigate(patternPage);
      await waitForBrowser(view, isOpen("patterns"));
      expect(
        await view.evaluate(
          `document.querySelector('${group("patterns")} [aria-current="page"]') !== null`,
        ),
      ).toBe(true);
    },
    { height: 600 },
  );
}, 60_000);
