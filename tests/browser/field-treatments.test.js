/*
 * The core field (quiet) and the treatments (framed, edge, filled, recessed)
 * are built from inherited hooks alone, so a theme or the docs customizer can
 * switch them freely. Whatever the treatment, the states keep their
 * invariants: a resting lower edge (3:1, or the known quiet and borderless
 * exceptions, which regain it under increased contrast), one visible hover
 * change shared by the input and the select, the focus outline over the kept
 * elevation, validation on every side, and quiet readonly and disabled fields.
 * Computed styles, not pixels.
 */
import { expect, test } from "bun:test";
import { fixtureUrl } from "../../scripts/utils/browser.js";
import { browserSuite } from "./browser-suite.js";

const { it, engine, hoverSelector, tabUntil, withBrowserPage } = await browserSuite();

const FIXTURE = fixtureUrl("tests/browser/field-treatments.html");
const TREATMENTS = ["quiet", "framed", "edge", "filled", "recessed"];
const CLEAR = "rgba(0, 0, 0, 0)";
// Known exceptions to the 3:1 cue, with their resting lower edge: a pale
// edge, or the fill alone. All give the 3:1 edge back under increased
// contrast (tested below).
const EXCEPTIONS = { quiet: "quiet", recessed: "quiet", filled: "clear" };
const BORDERLESS = new Set(["filled"]);

const read = (id) => `(() => {
  const el = document.getElementById(${JSON.stringify(id)});
  const s = getComputedStyle(el);
  return {
    bg: s.backgroundColor,
    start: s.borderInlineStartColor,
    end: s.borderBlockEndColor,
    endWidth: parseFloat(s.borderBlockEndWidth),
    shadow: s.boxShadow,
    outline: s.outlineStyle === "none" ? null : s.outlineColor,
    outlineWidth: parseFloat(s.outlineWidth),
    color: s.color,
    cursor: s.cursor,
    hover: el.matches(":hover"),
    focus: el.matches(":focus-visible"),
  };
})()`;

const REFS = `Object.fromEntries(
  [...document.querySelectorAll("[data-ref]")].map((el) => [el.dataset.ref, getComputedStyle(el).color]),
)`;

for (const name of TREATMENTS) {
  it(`${name} fields keep the state invariants`, async () => {
    await withBrowserPage(FIXTURE, async (view) => {
      const ref = await view.evaluate(REFS);
      const rest = await view.evaluate(read(`${name}-rest`));

      // Rest: the 3:1 control edge on the lower side at least, except for the
      // known exceptions.
      const expected = { quiet: ref.quiet, clear: CLEAR }[EXCEPTIONS[name]] ?? ref.edge;
      expect(rest.end).toBe(expected);
      expect(rest.endWidth).toBeGreaterThanOrEqual(1);
      expect(rest.shadow.includes("inset")).toBe(name === "recessed");

      // Hover: something visible changes, and a lower edge stays.
      await hoverSelector(view, `#${name}-rest`);
      const hover = await view.evaluate(read(`${name}-rest`));
      expect(hover.hover).toBe(true);
      expect([hover.bg, hover.start, hover.end]).not.toEqual([rest.bg, rest.start, rest.end]);
      if (!BORDERLESS.has(name)) expect(hover.end).not.toBe(CLEAR);

      // A select answers the same hover as the input beside it.
      const pick = (s) => [s.bg, s.start, s.end];
      await hoverSelector(view, `#${name}-select`);
      expect(pick(await view.evaluate(read(`${name}-select`)))).toEqual(pick(hover));
      await hoverSelector(view, "#away");

      // Keyboard focus: the focus outline, over the field's own elevation.
      expect(
        await tabUntil(view, `document.activeElement?.id === "${name}-rest"`, { max: 20 }),
      ).toBe(true);
      const focus = await view.evaluate(read(`${name}-rest`));
      expect(focus.focus).toBe(true);
      expect(focus.outline).toBe(ref.focus);
      expect(focus.outlineWidth).toBeGreaterThanOrEqual(1);
      expect(focus.shadow).toBe(rest.shadow);

      // Invalid: the danger color on every side, and on the focus line.
      const invalid = await view.evaluate(read(`${name}-invalid`));
      expect([invalid.start, invalid.end]).toEqual([ref.danger, ref.danger]);
      expect(await tabUntil(view, `document.activeElement?.id === "${name}-invalid"`)).toBe(true);
      expect((await view.evaluate(read(`${name}-invalid`))).outline).toBe(ref.danger);

      // Fields the user cannot edit drop the 3:1 lower edge for the quiet one.
      const readonly = await view.evaluate(read(`${name}-readonly`));
      expect(readonly.end).toBe(ref.quiet);
      const disabled = await view.evaluate(read(`${name}-disabled`));
      expect(disabled.end).toBe(ref.quiet);
      expect(disabled.color).toBe(ref.disabled);
      expect(disabled.cursor).toBe("not-allowed");
    });
  });
}

// The exceptions give the 3:1 edge back under increased contrast. Emulated
// through CDP, so Chromium only.
(engine ? test.skip : it)(
  "quiet and borderless fields regain their edge under increased contrast",
  async () => {
    await withBrowserPage(
      FIXTURE,
      async (view) => {
        const ref = await view.evaluate(REFS);
        for (const name of Object.keys(EXCEPTIONS)) {
          expect((await view.evaluate(read(`${name}-rest`))).end).toBe(ref.edge);
        }
      },
      { mediaFeatures: [{ name: "prefers-contrast", value: "more" }] },
    );
  },
);

// Forced colors repaint every border in a system color, so a treatment that
// clears the sides (edge) still frames its field. Emulated through CDP, so
// Chromium only.
(engine ? test.skip : it)("every treatment frames its fields in forced colors", async () => {
  await withBrowserPage(
    FIXTURE,
    async (view) => {
      for (const name of TREATMENTS) {
        const sides = await view.evaluate(`(() => {
          const s = getComputedStyle(document.getElementById("${name}-rest"));
          return [s.borderInlineStartColor, s.borderInlineEndColor, s.borderBlockStartColor, s.borderBlockEndColor];
        })()`);
        for (const side of sides) expect(`${name} ${side}`).not.toBe(`${name} ${CLEAR}`);
      }
    },
    { mediaFeatures: [{ name: "forced-colors", value: "active" }] },
  );
});
