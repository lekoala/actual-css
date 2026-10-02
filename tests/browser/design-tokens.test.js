/*
 * Design-tool token export resolved in a real browser: light-dark() pairs,
 * scheme detection on a named theme, and alias confirmation by value.
 */
import { expect, test } from "bun:test";
import { browserAvailable } from "../../scripts/utils/browser.js";
import { inlineImports } from "../../src/tooling/css-bundle.js";
import { coreTokenCss, linkTokens, resolveTokens } from "../../src/tooling/design-tokens.js";

const TIMEOUT = 60_000;
const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const framework = await inlineImports("src/css/actual.css");
const core = await coreTokenCss();

it("the default theme exports both schemes with their own values", async () => {
  const resolved = await resolveTokens({ css: framework, aliasSources: [core] });
  expect(Object.keys(resolved.modes)).toEqual(["light", "dark"]);
  expect(resolved.modes.light.surface).toEqual({ components: [1, 1, 1], alpha: 1 });
  expect(resolved.modes.dark.surface).not.toEqual(resolved.modes.light.surface);
  expect(resolved.lengths["space-40"]).toEqual({ px: 16, css: "1rem" });
  // 0.65rem: exact, not the 1/64px layout snap (10.390625).
  expect(resolved.lengths["bar-height"].px).toBe(10.4);

  const { modes, foundations } = linkTokens(resolved);
  // Aliased in the core, including one a forced-colors block redeclares.
  expect(modes.dark.heading).toEqual({ alias: "text" });
  expect(modes.dark["state-disabled"]).toEqual({ alias: "text-subtle" });
  expect(foundations["control-size"].alias).toBe("control-size-md");
});

it("a light-only theme exports one mode and its own aliases", async () => {
  const theme = `[data-theme="brand"] {
    color-scheme: light;
    --primary: rgb(255 0 0);
    --focus: var(--primary);
    --radius: 0.625rem;
  }`;
  const resolved = await resolveTokens({
    css: `${framework}\n${theme}`,
    theme: "brand",
    aliasSources: [core, theme],
  });
  expect(Object.keys(resolved.modes)).toEqual(["light"]);
  expect(resolved.modes.light.primary).toEqual({ components: [1, 0, 0], alpha: 1 });
  expect(resolved.lengths.radius.px).toBe(10);
  expect(linkTokens(resolved).modes.light.focus).toEqual({ alias: "primary" });
});

// Trap: the root theme used to be read on [data-theme="light"|"dark"] islands,
// where the core redeclares its own palette over the application's :root.
it("a :root theme exports its own values in both schemes", async () => {
  const theme = `:root {
    --primary: light-dark(rgb(255 0 0), rgb(0 0 255));
    --radius: 0.625rem;
  }`;
  const resolved = await resolveTokens({ css: `${framework}\n${theme}` });
  expect(Object.keys(resolved.modes)).toEqual(["light", "dark"]);
  expect(resolved.modes.light.primary).toEqual({ components: [1, 0, 0], alpha: 1 });
  expect(resolved.modes.dark.primary).toEqual({ components: [0, 0, 1], alpha: 1 });
  expect(resolved.lengths.radius.px).toBe(10);
});

it("a light-dark theme exports two modes", async () => {
  const theme = await inlineImports("src/css/themes/ocean.css");
  const resolved = await resolveTokens({ css: `${framework}\n${theme}`, theme: "ocean" });
  expect(Object.keys(resolved.modes)).toEqual(["light", "dark"]);
  expect(resolved.modes.dark.primary).not.toEqual(resolved.modes.light.primary);
});
