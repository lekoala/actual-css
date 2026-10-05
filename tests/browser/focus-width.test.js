/*
 * The generic focus line and the boxed ring share --focus-ring-width at every
 * level: root, a [data-theme] island, and a plain region below it. The line
 * is composed on the focused element; a :root alias was inherited already
 * computed and kept links at 2px inside a 3px theme island.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  tabUntil,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/focus-width.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

// Keyboard focus, so :focus-visible holds as it does for a real user.
const focusAndRead = async (view, id) => {
  expect(await tabUntil(view, `document.activeElement?.id === ${JSON.stringify(id)}`), id).toBe(
    true,
  );
  return view.evaluate(`(() => {
    const cs = getComputedStyle(document.activeElement);
    return cs.outlineWidth + " " + cs.outlineStyle;
  })()`);
};

it("links and buttons draw the same focus width at root, island and region levels", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const seen = {};
      for (const id of [
        "root-link",
        "root-btn",
        "island-link",
        "island-btn",
        "local-link",
        "local-btn",
        "custom-link",
      ]) {
        seen[id] = await focusAndRead(view, id);
      }

      expect(seen["root-link"]).toBe("2px solid");
      expect(seen["root-btn"]).toBe("2px solid");
      expect(seen["island-link"]).toBe("3px solid");
      expect(seen["island-btn"]).toBe("3px solid");
      expect(seen["local-link"]).toBe("6px solid");
      expect(seen["local-btn"]).toBe("6px solid");
      // --focus-outline replaces the whole generic line.
      expect(seen["custom-link"]).toBe("5px dashed");
    },
    { width: 800, height: 600, artifactName: "focus-width" },
  );
});
