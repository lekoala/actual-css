/*
 * --border-control is the resting edge of the controls an edge identifies
 * (choices, swatches, choice cards), apart from the --border that separates
 * surfaces: setting it alone moves every such control and no separator. An
 * unchecked switch takes it too, as its whole track. Text fields read
 * --control-default-border instead: the quiet --border by default, and
 * --border-control under increased contrast.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/border-control.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const EDGES = `(() => {
  // Block-start: the edge every control and the hr divider draw, read on the
  // pseudo-element when the control draws it there.
  const edge = (el) => {
    const name = el.dataset.name ?? el.className.split(" ")[0];
    return name + " " + getComputedStyle(el, el.dataset.pseudo ?? null).borderBlockStartColor;
  };
  return {
    fields: [...document.querySelectorAll("[data-field]")].map(edge),
    controls: [...document.querySelectorAll("[data-control]")].map(edge),
    separators: [...document.querySelectorAll("[data-separator]")].map(edge),
  };
})()`;

const FIELDS = (color) => [
  `input ${color}`,
  `textarea ${color}`,
  `select ${color}`,
  `join-addon ${color}`,
  `otp-cell ${color}`,
];

it("choices take --border-control, fields and separators keep --border", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const edges = await view.evaluate(EDGES);

      expect(edges.fields).toEqual(FIELDS("rgb(200, 200, 200)"));
      expect(edges.controls).toEqual([
        "check rgb(255, 0, 0)",
        "radio rgb(255, 0, 0)",
        "color-swatch rgb(255, 0, 0)",
        "choice-card rgb(255, 0, 0)",
      ]);
      expect(edges.separators).toEqual([
        "btn rgb(200, 200, 200)",
        "card rgb(200, 200, 200)",
        "divider rgb(200, 200, 200)",
      ]);
    },
    { artifactName: "border-control" },
  );
});

// The quiet field edge is a known WCAG 1.4.11 trade-off: increased contrast
// gives every field the 3:1 edge back.
it("fields take --border-control under increased contrast", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      expect((await view.evaluate(EDGES)).fields).toEqual(FIELDS("rgb(255, 0, 0)"));
    },
    {
      artifactName: "border-control-more",
      mediaFeatures: [{ name: "prefers-contrast", value: "more" }],
    },
  );
});

// The 3:1 edge belongs to the resting state: a checked track is one uniform
// fill, a disabled one keeps the quiet --border edge a disabled check has, and
// an invalid switch keeps the validation edge.
it("a switch drops the control edge when checked or disabled", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const state = await view.evaluate(`(() => {
        const read = (name) => {
          const s = getComputedStyle(document.querySelector('[data-switch="' + name + '"]'));
          return { edge: s.borderBlockStartColor, fill: s.backgroundColor };
        };
        const quiet = document.createElement("i");
        quiet.style.color = "var(--border)";
        document.querySelector('[data-switch="disabled"]').after(quiet);
        return {
          checked: read("checked"),
          disabled: read("disabled"),
          border: getComputedStyle(quiet).color,
          invalid: read("invalid").edge,
          danger: getComputedStyle(document.querySelector("[data-switch-danger]")).color,
        };
      })()`);
      expect(state.checked.edge).toBe(state.checked.fill);
      expect(state.disabled.edge).toBe(state.border);
      expect(state.disabled.edge).not.toBe(state.disabled.fill);
      expect(state.invalid).toBe(state.danger);
    },
    { artifactName: "border-control-switch" },
  );
});

// A labelled neutral outline needs no 3:1 boundary (its text identifies it):
// alone or among buttons it keeps --border; beside a field it is a segment of
// that field and takes its edge (the fixture paints it apart from --border).
// An intent outline keeps its intent.
it("a neutral outline takes the field edge only beside a field", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const state = await view.evaluate(`(() => {
        const edge = (el) => getComputedStyle(el).borderBlockStartColor;
        return {
          joined: edge(document.querySelector("#joined-outline")),
          joinedText: getComputedStyle(document.querySelector("#joined-outline")).color,
          buttons: [...document.querySelectorAll("#button-join .btn")].map(edge),
          intent: edge(document.querySelector("#intent-outline")),
          text: getComputedStyle(document.querySelector("#ref-text")).color,
          primary: getComputedStyle(document.querySelector("#ref-primary")).color,
        };
      })()`);
      expect(state.joined).toBe("rgb(0, 160, 160)");
      expect(state.joinedText).toBe(state.text);
      expect(state.buttons).toEqual(["rgb(200, 200, 200)", "rgb(200, 200, 200)"]);
      expect(state.intent).toBe(state.primary);
    },
    { artifactName: "border-control-outline" },
  );
});

// --control-default-border is the inherited resting edge of text controls,
// like --control-default-bg: with the lower-edge hook a theme keeps 3:1 at the
// bottom only. An inherited lower edge must not mark a field the user cannot
// edit, and validation still owns every side.
it("--control-default-border moves field sides and states drop the lower edge", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const state = await view.evaluate(`(() => {
        const read = (name) => {
          const s = getComputedStyle(document.querySelector('[data-recipe="' + name + '"]'));
          return s.borderInlineStartColor + " / " + s.borderBlockEndColor;
        };
        return {
          input: read("input"),
          textarea: read("textarea"),
          select: read("select"),
          addon: read("addon"),
          joinButton: read("join-button"),
          check: read("check"),
          readonly: read("readonly"),
          disabled: read("disabled"),
          invalid: read("invalid"),
          danger: getComputedStyle(document.querySelector("[data-switch-danger]")).color,
        };
      })()`);
      const recipe = "rgb(0, 128, 0) / rgb(0, 0, 255)";
      expect(state.input).toBe(recipe);
      expect(state.textarea).toBe(recipe);
      expect(state.select).toBe(recipe);
      expect(state.addon).toBe(recipe);
      expect(state.joinButton).toBe(recipe);
      // Choices are identified by their edge alone: the field recipe skips them.
      expect(state.check).toBe("rgb(255, 0, 0) / rgb(255, 0, 0)");
      expect(state.readonly).toBe("rgb(200, 200, 200) / rgb(200, 200, 200)");
      expect(state.disabled).toBe("rgb(200, 200, 200) / rgb(200, 200, 200)");
      expect(state.invalid).toBe(`${state.danger} / ${state.danger}`);
    },
    { artifactName: "border-control-recipe" },
  );
});

// The resting switch is a filled pill: its track is the 3:1 edge color and
// the border takes the same color instead of drawing a ring around it.
it("a resting switch is a filled pill, not a ring", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const [fill, edge] = await view.evaluate(`(() => {
      const s = getComputedStyle(document.querySelector("[data-resting-switch]"));
      return [s.backgroundColor, s.borderBlockStartColor];
    })()`);
    expect(fill).toBe(edge);
    expect(edge).toBe("rgb(255, 0, 0)");
  });
});

// The knob keeps one tone through the toggle: a light resting knob beside the
// dark checked one flipped color on every click in a dark scheme.
it("a dark scheme switch knob is the opaque surface, dark in both states", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const [off, on, surface] = await view.evaluate(`[
      getComputedStyle(document.querySelector("[data-dark-switch]"), "::before").backgroundColor,
      getComputedStyle(document.querySelector("[data-dark-checked]"), "::before").backgroundColor,
      getComputedStyle(document.querySelector("[data-dark-surface]")).color,
    ]`);
    expect(off).toBe(surface);
    const lightness = (rgb) => Math.max(...rgb.match(/\d+/g).slice(0, 3).map(Number));
    expect(lightness(off)).toBeLessThan(80);
    expect(lightness(on)).toBeLessThan(80);
  });
});

// The underline-only recipe hides the sides with a transparent edge; forced
// colors repaint every border in a system color, so the field keeps a full
// frame there. Asserted on computed styles: the headless screenshot does not
// paint the forced palette (see scripts/forced-colors-shot.js).
it("an underline-only field regains its sides in forced colors", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const sides = await view.evaluate(`(() => {
        const s = getComputedStyle(document.querySelector('[data-recipe="underline"]'));
        return [s.borderInlineStartColor, s.borderInlineEndColor, s.borderBlockStartColor];
      })()`);
      for (const side of sides) expect(side).not.toMatch(/rgba\(.*, 0\)$|transparent/);
    },
    {
      artifactName: "border-control-forced",
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
    },
  );
});

// Themes tune the edge through the mix, never by redeclaring the color-mix():
// an unguarded redeclaration erased every control outline without color-mix.
it("--border-control-mix sets the ink share of the derived edge", async () => {
  await withBrowserPage(fixtureUrl(FIXTURE), async (view) => {
    const [edge, expected] = await view.evaluate(`[
      getComputedStyle(document.querySelector("[data-mix]")).borderBlockStartColor,
      getComputedStyle(document.querySelector("[data-mix-expected]")).color,
    ]`);
    expect(edge).toBe(expected);
  });
});
