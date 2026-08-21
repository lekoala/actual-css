/*
 * Real-browser focus-ring derivation contract, driven over Bun.WebView.
 *
 * The core derives --focus-ring from --focus on every [data-theme] island,
 * so a custom island that recolors --focus gets a matching ring without
 * declaring one. A preset may still pin its own ring later in source order
 * (neon does, for its glow language) — the pin must win over the derivation.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/focus-ring.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("focus ring derivation contract over one browser pass", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const ring = (sel) =>
        view.evaluate(
          `getComputedStyle(document.querySelector(${JSON.stringify(sel)})).getPropertyValue("--focus-ring")`,
        );

      const rootRing = await ring("#root-island");
      const customRing = await ring("#custom-island");
      const neonRing = await ring("#neon-island");

      // Derived rings are color-mix expressions over each island's own --focus.
      expect(rootRing).toContain("color-mix");
      expect(customRing).toContain("color-mix");
      expect(customRing).not.toBe(rootRing);

      // An intentional preset pin outranks the derivation despite loading later.
      expect(neonRing).not.toContain("color-mix");
      expect(neonRing).toBe("hsl(182 100% 46% / 0.35)");
    },
    { artifactName: "focus-ring" },
  );
});
