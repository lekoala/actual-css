/*
 * Real-browser theme-boundary contract for --state-selected-text, driven over
 * Bun.WebView.
 *
 * Trap: a theme that resolves --state-selected-text to another token bakes that
 * reference where it is declared (brutalist: var(--link)). A nested island that
 * does not set the hook inherits the already-resolved value, and the local
 * fallback var(--state-selected-text, var(--state-selected)) can never reach
 * it. The hook is reset to the guaranteed-invalid value on every theme
 * boundary, so the island reads its own --state-selected again.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/state-selected-text.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

/* Rasterize computed colors so color-mix()/light-dark()-shaped values become
   comparable sRGB bytes. */
const READ = `(() => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const norm = (value) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b].join(",");
  };
  const color = (id) => norm(getComputedStyle(document.getElementById(id)).color);
  return {
    parent: color("parent"),
    island: color("island"),
    islandRef: color("island-ref"),
  };
})()`;

it("a nested theme island resets --state-selected-text to its own fallback", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const { parent, island, islandRef } = await view.evaluate(READ);
      // The island does not inherit brutalist's dark-blue --link.
      expect(island).not.toBe(parent);
      // It falls back to its own --state-selected (corporate's dark primary).
      expect(island).toBe(islandRef);
    },
    { artifactName: "state-selected-text" },
  );
});
