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

const readColor = (view) =>
  view.evaluate(`(() => {
  const el = document.activeElement;
  const reference = document.createElement("span");
  reference.hidden = true;
  reference.style.color = "var(--focus)";
  (el.matches("input") ? el.parentElement : el).append(reference);
  const expected = getComputedStyle(reference).color;
  reference.remove();
  const cs = getComputedStyle(el);
  return { color: cs.outlineColor, expected, visible: el.matches(":focus-visible"), style: cs.outlineStyle };
})()`);

for (const scheme of ["light", "dark"]) {
  it(`generic focus follows local theme colors and author hooks in ${scheme}`, async () => {
    await withBrowserPage(
      fixtureUrl(FIXTURE),
      async (view) => {
        for (const id of [
          "root-link",
          "root-btn",
          "island-link",
          "island-btn",
          "local-link",
          "local-btn",
          "dark-card",
          "custom-color",
          "native-check",
        ]) {
          expect(await tabUntil(view, `document.activeElement?.id === ${JSON.stringify(id)}`)).toBe(
            true,
          );
          const result = await readColor(view);
          expect(result.visible, id).toBe(true);
          expect(result.style, id).toBe("solid");
          expect(result.color, id).toBe(
            id === "custom-color" ? "rgb(150, 30, 80)" : result.expected,
          );
        }
      },
      {
        mediaFeatures: [{ name: "prefers-color-scheme", value: scheme }],
        artifactName: `focus-color-${scheme}`,
      },
    );
  });
}

it("an inherited generic color override crosses theme islands and native choices", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    await view.evaluate(
      'document.documentElement.style.setProperty("--focus-outline-color", "rgb(12 34 56)")',
    );
    for (const id of [
      "root-link",
      "island-link",
      "local-link",
      "custom-link",
      "dark-card",
      "custom-color",
      "native-check",
    ]) {
      expect(await tabUntil(view, `document.activeElement?.id === ${JSON.stringify(id)}`)).toBe(
        true,
      );
      const result = await readColor(view);
      // Whole-line and element-local hooks still take precedence.
      if (id === "custom-link")
        expect(result.color).toBe(
          await view.evaluate("getComputedStyle(document.activeElement).color"),
        );
      else
        expect(result.color, id).toBe(
          id === "custom-color" ? "rgb(150, 30, 80)" : "rgb(12, 34, 56)",
        );
    }
  });
});

it("generic focus remains an outline in forced colors", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      for (const id of ["root-link", "island-link", "local-link", "dark-card", "native-check"]) {
        expect(await tabUntil(view, `document.activeElement?.id === ${JSON.stringify(id)}`)).toBe(
          true,
        );
        const result = await readColor(view);
        expect(result.visible, id).toBe(true);
        expect(result.style, id).toBe("solid");
        expect(
          await view.evaluate("parseFloat(getComputedStyle(document.activeElement).outlineWidth)"),
        ).toBeGreaterThan(0);
      }
    },
    {
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
      artifactName: "focus-color-forced",
    },
  );
});
