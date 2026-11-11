import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;

// The sidebar is a static scrollport, so a deep page loads with its current
// link wherever it falls. docs.js centers it only when the link is clipped;
// this asserts where that lands: inside the sidebar's own box.
it("keeps the current page visible in a static sidebar", async () => {
  await withBrowserPage(
    fixtureUrl("site/components/table.html"),
    async (view) => {
      const state = await view.evaluate(`(() => {
        const sidebar = document.querySelector(".docs-sidebar");
        const link = sidebar.querySelector('a[aria-current="page"]');
        const box = sidebar.getBoundingClientRect();
        const rect = link.getBoundingClientRect();
        return {
          visible: rect.top >= box.top && rect.bottom <= box.bottom,
          collapsible: sidebar.querySelectorAll("details").length,
          headings: [...sidebar.querySelectorAll(".docs-nav-group")].map((h) => h.textContent),
        };
      })()`);
      expect(state.headings).toEqual(["Components", "Patterns"]);
      expect(state.collapsible).toBe(0);
      expect(state.visible).toBe(true);
    },
    { height: 600 },
  );
}, 60_000);
