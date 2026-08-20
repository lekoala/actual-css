/*
 * Real-browser specificity contract for .prose, driven over Bun.WebView.
 *
 * .prose brings content defaults at 0-1-0 via :where(), so an explicit
 * component class loaded after typography wins. The alert link inherits the
 * alert color, and a .btn link keeps its own foreground instead of picking up
 * prose's --primary. Both links are asserted because fixing only the plain
 * link could leave <a class="btn"> broken.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/prose.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("prose element recipes stay low-specificity so components override them", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const color = (sel) => getComputedStyle(document.querySelector(sel)).color;
        return {
          alert: color("#ref-alert"),
          plain: color("#plain"),
          button: color("#button"),
          proseLink: color("#prose-link"),
        };
      })()`);

      // The alert link inherits the alert foreground, not prose's --primary.
      expect(result.plain).toBe(result.alert);
      // The .btn link keeps its own foreground and is not prose-tinted.
      expect(result.button).not.toBe(result.proseLink);
    },
    { artifactName: "prose" },
  );
});
