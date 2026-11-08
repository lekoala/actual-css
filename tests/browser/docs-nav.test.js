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
  await withBrowserPage(fixtureUrl("site/components/rating.html"), async (view) => {
    await clickSelector(view, `${group("patterns")} > summary`);
    await waitForBrowser(view, `!${isOpen("patterns")}`);
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
  });
}, 60_000);
