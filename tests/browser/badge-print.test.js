/*
 * Printing often drops background graphics, and a badge's fill with them. The
 * print rule gives every badge an ink edge so it still reads on paper; the
 * empty status dot needs it most, since it has no text and its own rule
 * zeroes the border.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;

it("a status dot and a labelled badge keep an ink edge in print", async () => {
  const edges = await withBrowserPage(
    fixtureUrl("tests/browser/badge-print.html"),
    (view) =>
      view.evaluate(`["dot", "label"].map((id) => {
        const s = getComputedStyle(document.getElementById(id));
        return { width: parseFloat(s.borderTopWidth), style: s.borderTopStyle };
      })`),
    { media: "print", artifactName: "badge-print" },
  );
  for (const edge of edges) {
    expect(edge.style).toBe("solid");
    expect(edge.width).toBeGreaterThan(0);
  }
}, 60_000);
