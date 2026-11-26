import { describe, expect, test } from "bun:test";
import "../scripts/docs/assets/docs-customizer.js";

const { AXES, DEFAULTS, normalize, encode, decode, cssText, markup } =
  globalThis.ActualDocsCustomizer;
const THEMES = ["plush", "tactile"];

const rule = (css, selector) => {
  const start = css.indexOf(`${selector} {`);
  return start === -1 ? "" : css.slice(start, css.indexOf("}", start));
};

describe("docs customizer config", () => {
  test("normalize keeps known values and drops the rest", () => {
    expect(
      normalize({ version: 1, theme: "plush", radius: "large", fields: "bogus", extra: 1 }, THEMES),
    ).toEqual({ ...DEFAULTS, theme: "plush", radius: "large" });
    expect(normalize({ version: 1, theme: "removed-theme" }, THEMES).theme).toBe("default");
  });

  test("another version restores the defaults", () => {
    expect(normalize({ version: 2, radius: "large" }, THEMES)).toEqual({ ...DEFAULTS });
  });

  test("the share value lists only what differs and round-trips", () => {
    const config = { ...DEFAULTS, theme: "tactile", scheme: "dark", finish: "gloss" };
    expect(encode(DEFAULTS)).toBe("1");
    expect(encode(config)).toBe("1,theme:tactile,scheme:dark,finish:gloss");
    expect(decode(encode(config), THEMES)).toEqual(config);
    expect(decode("garbage", THEMES)).toEqual({ ...DEFAULTS });
  });
});

describe("docs customizer CSS", () => {
  test("default on every axis writes nothing", () => {
    expect(cssText(DEFAULTS)).toBe("");
  });

  test("a chosen axis writes only its own tokens", () => {
    const css = cssText({ ...DEFAULTS, radius: "large" });
    expect(css).toContain("--radius-lg: 1.5rem;");
    expect(css).not.toContain("--control-size");
    expect(css).not.toContain("--btn-finish");
  });

  // Density re-bound on every [data-theme] would stop an inherited density at
  // a palette-only island (tokens.css, Controls).
  test("density and font stay on :root, the other axes reach theme islands", () => {
    const css = cssText({ ...DEFAULTS, density: "compact", font: "serif", radius: "small" });
    const islands = rule(css, ":root,\n[data-theme]");
    const root = css.slice(css.lastIndexOf(":root {"));
    expect(islands).toContain("--radius:");
    expect(islands).not.toContain("--control-size");
    expect(root).toContain("--control-size: var(--control-size-sm);");
    expect(root).toContain("--font-sans: ui-serif");
  });

  // Switching from one treatment to another must not leave the previous
  // treatment's hooks behind.
  test("every field treatment sets the same hooks", () => {
    const sets = Object.values(AXES.fields.options).map((option) =>
      Object.keys(option.css).sort().join(),
    );
    expect(new Set(sets).size).toBe(1);
  });

  // Shadow roles enter box-shadow lists, where none voids the whole list.
  test("elevation never writes none", () => {
    for (const option of Object.values(AXES.elevation.options)) {
      for (const value of Object.values(option.css)) expect(value).not.toBe("none");
    }
  });

  test("the header states the markup the CSS assumes", () => {
    const config = { ...DEFAULTS, theme: "plush", scheme: "dark", radius: "square" };
    expect(cssText(config)).toContain(
      'Markup: <html data-theme="plush" style="color-scheme: dark">',
    );
    expect(cssText(config)).toContain("src/css/themes/plush.css");
    // A single-scheme theme keeps its own scheme.
    expect(markup(config, { paired: false })).toBe('<html data-theme="plush">');
    expect(markup({ ...DEFAULTS, scheme: "dark" })).toBe('<html data-theme="dark">');
  });
});
