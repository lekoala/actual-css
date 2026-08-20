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
        const marginTop = (sel) => getComputedStyle(document.querySelector(sel)).marginTop;
        return {
          alert: color("#ref-alert"),
          plain: color("#plain"),
          button: color("#button"),
          proseLink: color("#prose-link"),
          p1: marginTop("#flow-p1"),
          p2: marginTop("#flow-p2"),
          wrap: marginTop("#flow-wrap"),
          table: marginTop("#flow-table"),
          h2: marginTop("#flow-h2"),
          bcCurrentMargin: marginTop("#bc-current"),
          bcCurrentColor: color("#bc-current"),
          bcTextRef: color("#bc-ref-text"),
        };
      })()`);

      // The alert link inherits the alert foreground, not prose's --primary.
      expect(result.plain).toBe(result.alert);
      // The .btn link keeps its own foreground and is not prose-tinted.
      expect(result.button).not.toBe(result.proseLink);

      // Direct-child rhythm: the wrapper gets the sibling flow, while the
      // nested table inside it no longer carries a trapped top margin.
      expect(result.table).toBe("0px");
      expect(result.wrap).toBe(result.p2);
      expect(result.wrap).not.toBe("0px");
      // Headings keep their wider rhythm; the first child is reset.
      expect(parseFloat(result.h2)).toBeGreaterThan(parseFloat(result.wrap));
      expect(result.p1).toBe("0px");

      // A classed list inside prose keeps its own item rhythm (no li + li leak).
      expect(result.bcCurrentMargin).toBe("0px");
      // aria-current on the breadcrumb item receives the current style.
      expect(result.bcCurrentColor).toBe(result.bcTextRef);
    },
    { artifactName: "prose" },
  );
});
