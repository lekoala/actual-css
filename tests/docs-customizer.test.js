import { describe, expect, test } from "bun:test";
import "../scripts/docs/assets/docs-customizer.js";

const { AXES, DEFAULTS, normalize, encode, decode, cssText } = globalThis.ActualDocsCustomizer;
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
    const config = { ...DEFAULTS, scheme: "dark", finish: "gloss" };
    expect(encode(DEFAULTS)).toBe("1");
    expect(encode(config)).toBe("1,scheme:dark,finish:gloss");
    expect(decode(encode(config), THEMES)).toEqual(config);
    expect(decode("garbage", THEMES)).toEqual({ ...DEFAULTS });
  });

  // A demo theme ignores the axes, so a link to it does not carry them.
  test("a demo theme shares only the theme and the scheme", () => {
    const config = { ...DEFAULTS, theme: "tactile", scheme: "dark", finish: "gloss" };
    expect(encode(config)).toBe("1,theme:tactile,scheme:dark");
  });
});

describe("docs customizer CSS", () => {
  test("default on every axis writes nothing", () => {
    expect(cssText(DEFAULTS)).toBe("");
  });

  // A config saved before an axis existed lacks its key.
  test("a missing or unknown axis value writes nothing", () => {
    const { borders, ...older } = { ...DEFAULTS, radius: "small" };
    expect(cssText(older)).toBe(cssText({ ...DEFAULTS, radius: "small" }));
    expect(cssText({ ...DEFAULTS, radius: "bogus" })).toBe("");
  });

  test("a chosen axis writes only its own tokens", () => {
    const css = cssText({ ...DEFAULTS, radius: "large" });
    expect(css).toContain("--radius-lg: 1.5rem;");
    expect(css).not.toContain("--control-size");
    expect(css).not.toContain("--finish");
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

  // The rules come after the core's, so a treatment without a 3:1 edge on
  // every side restates the strong edge increased contrast gives back, in the
  // same scopes. Framed already has it.
  test("treatments give the strong edge back under increased contrast", () => {
    for (const fields of ["edge", "filled", "recessed"]) {
      const css = cssText({ ...DEFAULTS, fields });
      const media = css.slice(css.indexOf("@media (prefers-contrast: more)"));
      expect(media).toContain(
        "  :root,\n  [data-theme] {\n    --control-default-border: var(--border-control);",
      );
    }
    expect(cssText({ ...DEFAULTS, fields: "framed" })).not.toContain("@media");
  });

  // --border-width is every edge, and increased contrast raises it to 2px on
  // :root: the axis may only thicken.
  test("borders never thin below the core width", () => {
    for (const option of Object.values(AXES.borders.options)) {
      expect(Number.parseFloat(option.css["--border-width"])).toBeGreaterThanOrEqual(2);
    }
  });

  // Shadow roles enter box-shadow lists, where none voids the whole list.
  test("elevation never writes none", () => {
    for (const option of Object.values(AXES.elevation.options)) {
      for (const value of Object.values(option.css)) expect(value).not.toBe("none");
    }
  });

  // Demo themes own component rules that outrank tokens: the axes customize
  // Default only, and the export never depends on a demo theme file.
  test("a demo theme writes no override", () => {
    expect(cssText({ ...DEFAULTS, theme: "plush", radius: "square" })).toBe("");
    expect(cssText({ ...DEFAULTS, scheme: "dark" })).toBe("");
  });

  test("the header states the markup only when a scheme is pinned", () => {
    const config = { ...DEFAULTS, radius: "square" };
    expect(cssText(config)).not.toContain("Markup:");
    expect(cssText({ ...config, scheme: "dark" })).toContain('Markup: <html data-theme="dark">');
  });
});
