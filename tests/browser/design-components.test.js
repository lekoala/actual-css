/*
 * Component measurement for the design-tool export: every variant is
 * rendered in the theme's islands and each value binds to the token that
 * paints it, or to a recipe when no theme token does.
 */
import { expect, test } from "bun:test";
import { browserAvailable } from "../../scripts/utils/browser.js";
import { inlineImports } from "../../src/tooling/css-bundle.js";
import { measureComponents } from "../../src/tooling/design-components.js";
import { coreTokenCss, linkTokens, resolveTokens } from "../../src/tooling/design-tokens.js";

const TIMEOUT = 60_000;
const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const css = await inlineImports("src/css/actual.full.css");
const resolved =
  baseTest === test ? await resolveTokens({ css, aliasSources: [await coreTokenCss()] }) : null;
const spec =
  baseTest === test
    ? await measureComponents({ css, resolved, linked: linkTokens(resolved) })
    : null;
const built = spec && Object.fromEntries(spec.spec.components.map((c) => [c.name, c]));

it("every combination is a variant, default first; soft recipes are shared", async () => {
  const { recipes } = spec;
  expect(Object.keys(built)).toEqual(["Button", "Input", "Badge", "Alert", "Card"]);
  const shape = Object.fromEntries(
    Object.values(built).map((c) => [c.name, [c.properties, c.variants.length]]),
  );
  expect(shape).toEqual({
    Button: [["Intent", "Variant", "Size"], 7 * 6 * 3],
    Input: [["Size"], 3],
    Badge: [["Intent", "Variant", "Size"], 7 * 3 * 3],
    Alert: [["Intent", "Variant"], 7 * 4],
    Card: [[], 1],
  });
  // The first variant is what a new instance shows: the author's bare class.
  expect(built.Button.variants[0].props).toEqual({
    Intent: "default",
    Variant: "solid",
    Size: "md",
  });
  expect(built.Badge.variants[0].props).toMatchObject({ Variant: "soft", Size: "md" });
  expect(recipes.light["soft-danger-bg"].hex).not.toBe(recipes.dark["soft-danger-bg"].hex);

  const [input] = built.Input.variants;
  expect(input.box).toMatchObject({ hug: false, fixedHeight: true, justify: "start" });
  expect(input.box.height).toBe(38);
  expect(input.box.stroke.token).toBe("border");
  expect(input.texts[0].label).toBe("Input");

  const [badge] = built.Badge.variants;
  expect(badge.box).toMatchObject({ hug: true, fixedHeight: true, justify: "center" });
  expect(badge.box.radius).toBe(9999);
  // Soft by default, with the button's soft recipe names.
  expect(badge.box.fill.token).toBe("soft-default-bg");

  const [alert] = built.Alert.variants;
  expect(alert.box).toMatchObject({ hug: false, fixedHeight: false });
  expect(alert.box.padding).toEqual({ top: 12, right: 16, bottom: 12, left: 16 });
  expect(alert.box.fill.token).toBe("soft-default-bg");

  const [card] = built.Card.variants;
  expect(card.box).toMatchObject({ dir: "column", hug: false, fixedHeight: false });
  expect(card.box.gap).toBe(12);
  expect(card.box.fill.token).toBe("surface-raised");
  expect(card.texts.map((t) => t.label)).toEqual(["Card title", "Card content goes here."]);
});

it("Button colors bind to theme tokens or recipes; lengths are measured px", async () => {
  const pick = (Intent, Variant, Size = "md") =>
    built.Button.variants.find(
      ({ props }) => props.Intent === Intent && props.Variant === Variant && props.Size === Size,
    );

  const solid = pick("primary", "solid");
  expect(solid.box.fill.token).toBe("primary");
  expect(solid.box.stroke).toBeNull();
  expect(solid.box).toMatchObject({ radius: 8, height: 38 });
  expect(solid.texts[0].color.token).toBe("primary-fg");
  expect(solid.texts[0].fontWeight).toBe(500);

  // No theme token paints a soft fill: it becomes a recipe.
  expect(pick("danger", "soft").box.fill.token).toBe("soft-danger-bg");

  // currentColor variants take the island's ink, not body's.
  expect(pick("default", "outline").box.stroke.token).toBe("text");
  expect(pick("default", "ghost").texts[0].color.token).toBe("text");

  const link = pick("default", "link", "sm");
  expect(link.texts[0].underline).toBe(true);
  expect(link.box.fill).toBeNull();
  expect(link.box.padding.left).toBe(0);
  expect(link.texts[0].fontSize).toBe(14);
});
