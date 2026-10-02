/*
 * Supported compositions. A component whose layout is a replaceable default
 * (.topbar row, .card slots in card.test.js) hands it to a layout primitive on
 * the same element. A component whose layout is anatomy keeps it: the flyout
 * keeps its gap under a grid preset, and .nav-list's contradictory markup is
 * banned instead (tests/css-audit.test.js).
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const baseTest = (await browserAvailable()) ? test : test.skip;

baseTest(
  "default layouts yield to a primitive; anatomy stays with the component",
  async () => {
    const result = await withBrowserPage(fixtureUrl("tests/browser/composition.html"), (view) =>
      view.evaluate(`(() => {
        const style = (id) => getComputedStyle(document.getElementById(id));
        return {
          megaGap: style("mega").columnGap,
          megaColumns: style("mega").gridTemplateColumns.split(" ").length,
          topbar: style("topbar").justifyContent,
          topbarWrap: style("topbar").flexWrap,
          topbarDefault: [style("topbar-default").display, style("topbar-default").alignItems],
        };
      })()`),
    );

    // The preset adds the columns; the gutter stays section padding + 4px.
    expect(result.megaColumns).toBe(3);
    expect(result.megaGap).toBe("4px");
    expect(result.topbar).toBe("space-between");
    expect(result.topbarWrap).toBe("wrap");
    expect(result.topbarDefault).toEqual(["flex", "center"]);
  },
  60_000,
);
