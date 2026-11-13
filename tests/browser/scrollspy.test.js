import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;

it("visits each trailing section in order instead of jumping to the last item", async () => {
  await withBrowserPage(fixtureUrl("tests/browser/scrollspy-sequence.html"), async (view) => {
    for (const [top, target] of [
      [900, "#alpha"],
      [1200, "#beta"],
      [1400, "#gamma"],
      [1200, "#beta"],
      [900, "#alpha"],
    ]) {
      await view.evaluate(`document.getElementById("scroller").scrollTop = ${top}`);
      await waitForBrowser(
        view,
        `document.querySelector('[aria-current="location"]')?.getAttribute("href") === ${JSON.stringify(target)}`,
      );
      expect(
        await view.evaluate(`(() => {
        const native = CSS.supports("selector(:target-current)");
        const selector = 'a[aria-current="location"]' + (native ? ', a:target-current' : '');
        return [...document.querySelector(".scrollspy").querySelectorAll(selector)].map((a) => a.getAttribute("href"));
      })()`),
      ).toEqual([target]);
    }
  });
}, 60_000);

it("native scrollspy yields to a different JavaScript location and resumes after it clears", async () => {
  await withBrowserPage(fixtureUrl("tests/browser/scrollspy.html"), async (view) => {
    const native = await view.evaluate('CSS.supports("selector(:target-current)")');
    if (native) {
      await waitForBrowser(
        view,
        'document.querySelectorAll(".scrollspy a:target-current").length === 1',
      );
    }

    // Deliberately disagree with the native position to reproduce the two
    // indicators; no scrolling is needed to test which state owns the CSS.
    const target = await view.evaluate(`(() => {
      const links = [...document.querySelectorAll(".scrollspy a")];
      const link = links.find((a) => !${native} || !a.matches(":target-current"));
      link.setAttribute("aria-current", "location");
      return link.getAttribute("href");
    })()`);
    if (native) {
      await waitForBrowser(
        view,
        'document.querySelectorAll(".scrollspy a:target-current").length === 0',
      );
    }
    expect(
      await view.evaluate(`(() => {
      const selector = 'a[aria-current="location"]' + (${native} ? ', a:target-current' : '');
      return [...document.querySelector(".scrollspy").querySelectorAll(selector)].map((a) => a.getAttribute("href"));
    })()`),
    ).toEqual([target]);

    await view.evaluate('document.querySelector("[aria-current]").removeAttribute("aria-current")');
    if (native) {
      await waitForBrowser(
        view,
        'document.querySelectorAll(".scrollspy a:target-current").length === 1',
      );
    }
    expect(
      await view.evaluate(
        'getComputedStyle(document.querySelector(".scrollspy")).scrollTargetGroup',
      ),
    ).toBe(native ? "auto" : undefined);
  });
}, 60_000);
