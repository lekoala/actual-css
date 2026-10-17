/* Solid surfaces own link ink; nested cards and theme islands open a new context. */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  forceStates,
  tabUntil,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;
const READ = `(() => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rgb = (value) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  };
  const color = (el) => rgb(getComputedStyle(el).color);
  const luminance = (bytes) => bytes.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a, b) => {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  return [...document.querySelectorAll("[data-ink]")].map((a) => {
    const surface = document.getElementById(a.dataset.ink);
    const ink = color(a);
    return {
      surface: a.dataset.ink,
      ink,
      expected: color(surface),
      contrast: contrast(ink, rgb(getComputedStyle(surface).backgroundColor)),
      underline: getComputedStyle(a).textDecorationLine,
    };
  });
})()`;

for (const scheme of ["light", "dark"]) {
  for (const explicitLink of [false, true]) {
    it(`solid card links in ${scheme}, explicit --link: ${explicitLink}`, async () => {
      await withBrowserPage(
        fixtureUrl("tests/browser/card-links.html"),
        async (view) => {
          if (explicitLink) {
            await view.evaluate(`document.documentElement.style.setProperty("--link", "purple")`);
          }
          const check = async () => {
            for (const row of await view.evaluate(READ)) {
              expect(row.ink, row.surface).toEqual(row.expected);
              expect(row.contrast, row.surface).toBeGreaterThanOrEqual(4.5);
              expect(row.underline, row.surface).toBe("underline");
            }
          };
          await check();
          // Force styling only; actual keyboard focus is exercised below.
          for (const states of [
            ["hover"],
            ["focus", "focus-visible"],
            ["hover", "focus", "focus-visible"],
          ]) {
            await forceStates(view, { "[data-ink]": states });
            await check();
          }
          await forceStates(view, { "[data-ink]": [] });
          const contexts = await view.evaluate(`(() => {
            const color = (id) => getComputedStyle(document.getElementById(id)).color;
            return {
              page: color("page-link"), nested: color("nested-link"),
              island: color("island-link"), button: color("button"),
              danger: color("danger"),
              defaultIsland: color("default-island-link"),
              defaultIslandRef: color("default-island-ref"),
              alert: color("nested-alert"), alertLink: color("nested-alert-link"),
            };
          })()`);
          expect(contexts.nested).toBe(contexts.page);
          expect(contexts.island).toBe("rgb(0, 100, 0)");
          expect(contexts.button).toBe(contexts.danger);
          expect(contexts.defaultIsland).toBe(contexts.defaultIslandRef);
          expect(contexts.alertLink).toBe(contexts.alert);
          expect(await tabUntil(view, `document.activeElement.matches("[data-ink]")`)).toBe(true);
          const focus = await view.evaluate(`(() => {
            const a = document.activeElement;
            const style = getComputedStyle(a);
            return { visible: a.matches(":focus-visible"), width: parseFloat(style.outlineWidth),
              ink: style.color, outline: style.outlineColor };
          })()`);
          expect(focus.visible).toBe(true);
          expect(focus.width).toBeGreaterThan(0);
          expect(focus.outline).toBe(focus.ink);
          await check();
        },
        {
          mediaFeatures: [{ name: "prefers-color-scheme", value: scheme }],
          artifactName: "card-links",
        },
      );
    }, 60_000);
  }
}
