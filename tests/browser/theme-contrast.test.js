/*
 * Theme contrast measured in a real browser: the root theme is read on the
 * root, not on the core's light/dark islands.
 */
import { expect, test } from "bun:test";
import { browserAvailable } from "../../scripts/utils/browser.js";
import { inlineImports } from "../../src/tooling/css-bundle.js";
import { measureContrast } from "../../src/tooling/theme-contrast.js";

const TIMEOUT = 60_000;
const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const framework = await inlineImports("src/css/actual.full.css");

// Trap: a theme on :root measured through [data-theme="light"|"dark"]
// islands, where the core redeclares its own palette, reported the default
// theme's ratios for the application's colors.
it("a :root theme is measured with its own colors in both schemes", async () => {
  const theme = `:root {
    --surface: white;
    --surface-solid: white;
    --focus: light-dark(black, white);
  }`;
  const rows = await measureContrast({
    css: `${framework}\n${theme}`,
    themes: [null],
    label: ":root",
  });

  expect(rows.map(({ theme, scheme }) => `${theme} ${scheme}`)).toEqual([
    ":root light",
    ":root dark",
  ]);
  const [light, dark] = rows;
  expect(light.focusSurface).toBe(21);
  // White on white: the dark side of the application's light-dark() applied.
  expect(dark.focusSurface).toBe(1);
});
