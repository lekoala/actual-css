/*
 * Class reference tables (Class | Kind | Description) reflow on phones; any
 * other table keeps its table layout. The reflow changes the rows' display, so
 * the accessibility tree must still expose rows and cells.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;

it("only class reference tables reflow, and their rows stay rows", async () => {
  await withBrowserPage(
    fixtureUrl("site/foundations/tokens.html"),
    async (view) => {
      const display = await view.evaluate(`(() => {
        const row = (wrap) => getComputedStyle(wrap.querySelector("tbody tr")).display;
        const wraps = [...document.querySelectorAll(".docs-prose .table-wrap")];
        return {
          reference: wraps.filter((w) => w.matches(".docs-class-reference")).map(row),
          // Three-column tables that are not a class reference.
          other: wraps
            .filter((w) => !w.matches(".docs-class-reference"))
            .filter((w) => w.querySelectorAll("thead th").length === 3)
            .map(row),
        };
      })()`);
      expect(display.other.length).toBeGreaterThan(0);
      expect(new Set(display.other)).toEqual(new Set(["table-row"]));

      await view.navigate(fixtureUrl("site/components/table.html"));
      const reflowed = await view.evaluate(
        `getComputedStyle(document.querySelector(".docs-class-reference tbody tr")).display`,
      );
      expect(reflowed).toBe("grid");

      await view.cdp("Accessibility.enable");
      const { nodes } = await view.cdp("Accessibility.getFullAXTree");
      const roles = new Set(nodes.map((node) => node.role?.value));
      expect(roles.has("row")).toBe(true);
      expect(roles.has("cell") || roles.has("gridcell")).toBe(true);
      const cell = nodes.find(
        (node) =>
          node.role?.value === "cell" &&
          node.name?.value === "Scroll container and outer chrome (surface, border, radius).",
      );
      expect(cell).toBeDefined();
    },
    { width: 390 },
  );
}, 60_000);
