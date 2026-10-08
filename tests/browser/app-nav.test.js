/*
 * Real-browser .app-nav contract, driven over Bun.WebView.
 *
 * Forced colors flatten --state-selected to the bar's Canvas, so the current
 * tile needs a structural cue that survives the user agent's palette. Trap: a
 * Highlight/HighlightText repaint looked right in computed style while
 * Chromium drew its Canvas backplate behind the label and HighlightText
 * vanished on it. The cue is a transparent border, which forced colors turn
 * into a system-color frame; the tile must neither opt out of forced colors
 * nor change size for it.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/app-nav.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const READ = `(() => {
  const read = (id) => {
    const el = document.getElementById(id);
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      adjust: cs.forcedColorAdjust,
      borderStyle: cs.borderTopStyle,
      borderWidth: cs.borderTopWidth,
      border: cs.borderTopColor,
      fill: cs.backgroundColor,
      ink: cs.color,
      width: rect.width,
      height: rect.height,
    };
  };
  return { current: read("current"), other: read("other") };
})()`;

it("the current tile's cue costs nothing outside forced colors", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const { current, other } = await view.evaluate(READ);
      expect(current.borderStyle).toBe("solid");
      expect(current.border).toBe("rgba(0, 0, 0, 0)");
      // Border-box: the cue does not resize the tile against its peers.
      expect(current.width).toBe(other.width);
      expect(current.height).toBe(other.height);
    },
    { artifactName: "app-nav" },
  );
});

it("forced colors frame the current tile without opting out", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const { current, other } = await view.evaluate(READ);
      // The user agent keeps the palette: no opt-out, no Highlight repaint.
      // Both tiles fill with Canvas; only the alpha the author gave survives.
      const rgb = (color) => color.match(/\d+/g).slice(0, 3).join(",");
      expect(current.adjust).toBe("auto");
      expect(rgb(current.fill)).toBe(rgb(other.fill));
      // The transparent border is now a visible system-color frame, and only
      // the current tile has one.
      expect(current.borderStyle).toBe("solid");
      expect(current.border).not.toBe("rgba(0, 0, 0, 0)");
      expect(current.border).not.toBe(current.fill);
      expect(other.borderStyle).toBe("none");
    },
    {
      artifactName: "app-nav-forced",
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
    },
  );
});
