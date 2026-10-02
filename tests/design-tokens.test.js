/*
 * Design-tool token export: the coverage guard, alias linking, and the Figma
 * and Penpot shapes. Browser resolution is covered in
 * tests/browser/design-tokens.test.js.
 */
import { describe, expect, test } from "bun:test";
import {
  aliasCandidates,
  coreTokenCss,
  declaredTokens,
  FOUNDATIONS,
  linkTokens,
  NOT_EXPORTED,
  parseSrgb,
  THEME_COLORS,
  themeNameOf,
  toFigma,
  toPenpot,
} from "../src/tooling/design-tokens.js";

describe("token coverage", () => {
  const exported = [...THEME_COLORS, ...Object.values(FOUNDATIONS).flat()];
  const skipped = Object.values(NOT_EXPORTED).flat();

  test("every core token is exported or skipped with a reason", async () => {
    const classified = new Set([...exported, ...skipped]);
    const unclassified = [...declaredTokens(await coreTokenCss())].filter(
      (name) => !classified.has(name),
    );
    expect(unclassified).toEqual([]);
  });

  test("no token is both exported and skipped, or listed twice", () => {
    const all = [...exported, ...skipped];
    expect(all.filter((name, i) => all.indexOf(name) !== i)).toEqual([]);
  });
});

describe("source reading", () => {
  test("alias candidates keep every var() target, including conditional ones", () => {
    const aliases = aliasCandidates(
      ":root { --a: var(--b); --c: 1px; } @media print { --a: red; }",
      "[data-theme='x'] { --c: var(--d); --a: var( --e ); }",
    );
    expect(aliases.get("a")).toEqual(["b", "e"]);
    expect(aliases.get("c")).toEqual(["d"]);
  });

  test("theme name ignores the light/dark boundaries", () => {
    expect(themeNameOf('[data-theme="ocean"] {} [data-theme="dark"] {}')).toBe("ocean");
    expect(() => themeNameOf('[data-theme="a"] {} [data-theme="b"] {}')).toThrow(/a, b/);
    expect(themeNameOf("[data-theme='brand'] {}")).toBe("brand");
    // No name: an application theme written on :root.
    expect(themeNameOf(":root { --primary: red; } [data-theme='dark'] {}")).toBeNull();
  });

  test("an explicit theme name must be one the file declares", () => {
    const css = '[data-theme="a"] {} [data-theme="b"] {}';
    expect(themeNameOf(css, "b")).toBe("b");
    // A typo would otherwise measure the framework defaults as the theme.
    expect(() => themeNameOf(css, "c")).toThrow(/"c".*a, b/);
    expect(() => themeNameOf(":root { --primary: red; }", "brand")).toThrow(/declares none/);
  });

  test("computed srgb colors parse with and without alpha, clamped to gamut", () => {
    expect(parseSrgb("color(srgb 0.5 0.25 1)")).toEqual({ components: [0.5, 0.25, 1], alpha: 1 });
    expect(parseSrgb("color(srgb 1.02 -0.01 0.123456 / 0.04)")).toEqual({
      components: [1, 0, 0.1235],
      alpha: 0.04,
    });
    expect(() => parseSrgb("rgb(0, 0, 0)")).toThrow();
  });
});

const black = { components: [0, 0, 0], alpha: 1 };
const white = { components: [1, 1, 1], alpha: 1 };
const linked = linkTokens({
  modes: {
    light: {
      text: black,
      heading: black,
      focus: white,
      "hover-overlay": { ...white, alpha: 0.06 },
    },
    dark: { text: white, heading: white, focus: white, "hover-overlay": { ...white, alpha: 0.06 } },
  },
  lengths: {
    "space-40": { px: 16, css: "1rem" },
    "control-pad-x": { px: 16, css: "1rem" },
    gap: { px: 12, css: "0.75rem" },
    radius: { px: 8, css: "0.5rem" },
  },
  weights: { "font-weight-bold": 700 },
  aliases: new Map([
    ["heading", ["text"]],
    ["focus", ["text"]],
    ["control-pad-x", ["space-40"]],
    ["gap", ["space-40"]],
  ]),
});

describe("linking", () => {
  test("an alias is kept only when it holds in every mode", () => {
    expect(linked.modes.light.heading).toEqual({ alias: "text" });
    expect(linked.modes.dark.heading).toEqual({ alias: "text" });
    // focus equals text in dark only: a literal override, not an alias.
    expect(linked.modes.dark.focus.hex).toBe("#ffffff");
  });

  test("foundations carry their role, and aliases need an equal value", () => {
    expect(linked.foundations["control-pad-x"]).toEqual({ role: "spacing", alias: "space-40" });
    expect(linked.foundations.gap).toEqual({ role: "spacing", px: 12, css: "0.75rem" });
    expect(linked.foundations["font-weight-bold"]).toEqual({ role: "font-weight", weight: 700 });
  });

  test("translucent colors carry alpha in the hex", () => {
    expect(linked.modes.light["hover-overlay"].hex).toBe("#ffffff0f");
  });
});

describe("Figma output", () => {
  const files = toFigma(linked);

  test("one file per mode plus foundations", () => {
    expect(Object.keys(files).sort()).toEqual(["dark", "foundations", "light"]);
  });

  test("DTCG object values, references, px dimensions with the CSS value kept", () => {
    expect(files.light.heading.$value).toBe("{text}");
    expect(files.light.text.$value).toEqual({ colorSpace: "srgb", ...black, hex: "#000000" });
    expect(files.foundations.radius).toEqual({
      $type: "dimension",
      $value: { value: 8, unit: "px" },
      $extensions: { "actual-css": { css: "0.5rem" } },
    });
    expect(files.foundations["control-pad-x"].$value).toBe("{space-40}");
    expect(files.foundations["font-weight-bold"]).toEqual({ $type: "number", $value: 700 });
  });
});

describe("Penpot output", () => {
  const doc = toPenpot(linked);

  test("sets in order, one theme per mode enabling foundations and that mode", () => {
    expect(doc.$metadata.tokenSetOrder).toEqual(["foundations", "mode/light", "mode/dark"]);
    expect(doc.$themes).toEqual([
      {
        id: "mode-light",
        name: "Light",
        group: "Mode",
        selectedTokenSets: { foundations: "enabled", "mode/light": "enabled" },
      },
      {
        id: "mode-dark",
        name: "Dark",
        group: "Mode",
        selectedTokenSets: { foundations: "enabled", "mode/dark": "enabled" },
      },
    ]);
    // Shape confirmed against a Penpot multi-file export.
    expect(doc.$metadata.activeThemes).toEqual(["Mode/Light"]);
    expect(doc.$metadata.activeSets).toEqual(["foundations", "mode/light"]);
  });

  test("recipes join the mode sets, which switch them with the mode", () => {
    const soft = { color: white, hex: "#ffffff" };
    const withRecipes = toPenpot(linked, { light: { "soft-bg": soft }, dark: { "soft-bg": soft } });
    expect(withRecipes["mode/dark"]["soft-bg"]).toEqual({ $type: "color", $value: "#ffffff" });
    expect(withRecipes["mode/dark"].text).toEqual({ $type: "color", $value: "#ffffff" });
    expect(withRecipes.$metadata.tokenSetOrder).toEqual(["foundations", "mode/light", "mode/dark"]);
    expect(toFigma(linked, { light: { "soft-bg": soft } }).light["soft-bg"].$value.hex).toBe(
      "#ffffff",
    );
  });

  test("plain string values typed by role", () => {
    expect(doc["mode/light"].text).toEqual({ $type: "color", $value: "#000000" });
    expect(doc["mode/dark"].heading).toEqual({ $type: "color", $value: "{text}" });
    expect(doc.foundations.radius).toEqual({ $type: "borderRadius", $value: "8px" });
    expect(doc.foundations.gap).toEqual({ $type: "spacing", $value: "12px" });
    expect(doc.foundations["control-pad-x"]).toEqual({ $type: "spacing", $value: "{space-40}" });
    expect(doc.foundations["font-weight-bold"]).toEqual({ $type: "fontWeights", $value: 700 });
  });
});
