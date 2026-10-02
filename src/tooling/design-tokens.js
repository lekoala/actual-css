/*
 * Design-tool token export: resolves a theme's tokens in headless Chrome and
 * writes them for Figma (DTCG files, one per mode) and Penpot (one token file
 * with its sets and themes).
 *
 * Values are read from the browser, never from the CSS text: tokens are built
 * with light-dark(), color-mix() and var() chains that only the browser
 * evaluates faithfully. The CSS source only tells which declarations are pure
 * aliases (`--a: var(--b)`), so the design tool keeps the relationship instead
 * of two unrelated equal values. Names stay the CSS names without `--`.
 * Bun only: Bun.WebView drives the browser.
 */
import { readFile } from "node:fs/promises";
import { stripComments } from "./css-bundle.js";

const CORE_TOKEN_FILES = ["../css/core/tokens.css", "../css/core/theme.css"];

/* Painted colors, one value per mode. The knobs that produce derived colors
   (mix ratios, backdrop color and opacity) are not exported: the design tool
   receives what is painted, not how it was computed. */
export const THEME_COLORS = [
  "primary",
  "primary-fg",
  "secondary",
  "secondary-fg",
  "success",
  "success-fg",
  "warning",
  "warning-fg",
  "danger",
  "danger-fg",
  "neutral",
  "neutral-fg",
  "surface",
  "surface-raised",
  "surface-subtle",
  "surface-solid",
  "surface-solid-fg",
  "surface-opaque",
  "text",
  "text-muted",
  "text-subtle",
  "heading",
  "border",
  "focus",
  "hover-overlay",
  "hover-overlay-solid",
  "shadow-color",
  "selection-bg",
  "selection-fg",
  "state-selected",
  "state-selected-fg",
  "state-disabled",
  "indicator-ring",
  "backdrop-fill",
];

/* Mode-independent tokens by role. The role tells a design tool where a value
   applies (Penpot token types); every role but font-weight is a length. */
export const FOUNDATIONS = {
  spacing: [
    "space-10",
    "space-20",
    "space-30",
    "space-40",
    "space-50",
    "space-60",
    "gap",
    "control-pad-x-sm",
    "control-pad-x-md",
    "control-pad-x-lg",
    "control-pad-x",
  ],
  radius: ["radius-sm", "radius", "radius-lg", "radius-full"],
  "border-width": ["border-width", "focus-ring-width"],
  "font-size": [
    "font-size-xs",
    "font-size-sm",
    "font-size-md",
    "font-size-lg",
    "control-font-size",
  ],
  size: ["control-size-sm", "control-size-md", "control-size-lg", "control-size", "bar-height"],
  offset: ["focus-outline-offset"],
  "font-weight": [
    "font-weight-normal",
    "font-weight-medium",
    "font-weight-semibold",
    "font-weight-bold",
  ],
};

/* Every custom property declared by the core token files is exported or
   listed here (tests/design-tokens.test.js), so a new token cannot silently
   stay out of the design tools. */
export const NOT_EXPORTED = {
  "font stack; a design tool font token holds one family": ["font-sans", "font-mono"],
  "no design tool equivalent": [
    "font-width",
    "font-width-dense",
    "line-height",
    "line-height-tight",
    "line-height-relaxed",
    "shadow",
    "shadow-popout",
    "duration",
    "duration-fast",
    "duration-slow",
    "duration-spin",
    "duration-shimmer",
    "ease-enter",
    "ease-exit",
    "viewport-block",
    "viewport-inline",
    "z-sticky",
    "z-menu",
    "z-status",
    "icon-chevron",
    "icon-check",
    "icon-close",
    "icon-plus",
  ],
  "input of a derived value": [
    "backdrop-color",
    "backdrop-opacity",
    "soft-bg-mix",
    "soft-border-mix",
    "soft-hover-alpha",
    "soft-fg-mix",
    "focus-outline",
    "focus-outline-color",
  ],
  "soft recipe, exported with the components": [
    "primary-soft-fg",
    "secondary-soft-fg",
    "success-soft-fg",
    "warning-soft-fg",
    "danger-soft-fg",
    "neutral-soft-fg",
  ],
  "internal or plumbing": [
    "density-space",
    "disabled-opacity",
    "indicator-offset",
    "choice-control-size",
    "hgroup-gap",
    "tone-fg",
  ],
};

const WEIGHTS = FOUNDATIONS["font-weight"];
const LENGTHS = Object.entries(FOUNDATIONS).flatMap(([role, names]) =>
  role === "font-weight" ? [] : names,
);
const ROLE_OF = new Map(
  Object.entries(FOUNDATIONS).flatMap(([role, names]) => names.map((n) => [n, role])),
);

const DECLARATION_RE = /(?<![-\w])--([a-z0-9-]+)\s*:\s*([^;{}]*);/gi;
const ALIAS_RE = /^var\(\s*--([a-z0-9-]+)\s*\)$/i;
const THEME_NAME_RE = /\[data-theme="([^"]+)"\]/g;

export function declaredTokens(css) {
  return new Set([...stripComments(css).matchAll(DECLARATION_RE)].map((m) => m[1]));
}

/* Every `--a: var(--b)` declaration, per name. Only candidates: the source
   cannot tell which one applies (a theme may alias a token the core declares
   literally, a forced-colors block may replace an alias), so the resolved
   values decide. */
export function aliasCandidates(...sources) {
  const aliases = new Map();
  for (const css of sources) {
    for (const [, name, value] of stripComments(css).matchAll(DECLARATION_RE)) {
      const target = value.trim().match(ALIAS_RE)?.[1];
      if (target) aliases.set(name, [...(aliases.get(name) ?? []), target]);
    }
  }
  return aliases;
}

/* The one data-theme value a theme file declares, light/dark excluded. */
export function themeNameOf(css) {
  const names = new Set(
    [...css.matchAll(THEME_NAME_RE)].map((m) => m[1]).filter((n) => n !== "light" && n !== "dark"),
  );
  if (names.size !== 1) {
    throw new Error(
      `Expected one [data-theme="…"] name in the theme, found ${names.size === 0 ? "none" : [...names].join(", ")}; pass the name explicitly.`,
    );
  }
  return [...names][0];
}

export async function coreTokenCss() {
  const files = CORE_TOKEN_FILES.map((path) => readFile(new URL(path, import.meta.url), "utf8"));
  return (await Promise.all(files)).join("\n");
}

/*
 * Runs in the page. Each island is one mode: `color-scheme` on the island is
 * what light-dark() resolves against. Colors go through color-mix(in srgb) so
 * every color syntax computes to the same `color(srgb r g b / a)` form.
 */
function readIslands({ css, islands, colors, lengths, weights }) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);

  const result = [];
  for (const { attribute, scheme } of islands) {
    const island = document.createElement("div");
    if (attribute) island.dataset.theme = attribute;
    if (scheme) island.style.colorScheme = scheme;
    const probe = document.createElement("div");
    probe.style.position = "absolute";
    island.append(probe);
    document.body.append(island);

    const computed = getComputedStyle(probe);
    const values = { colors: {}, lengths: {}, weights: {}, missing: [] };
    const read = (name) => {
      const raw = computed.getPropertyValue(`--${name}`).trim();
      if (!raw) values.missing.push(name);
      return raw;
    };

    for (const name of colors) {
      if (!read(name)) continue;
      probe.style.color = `color-mix(in srgb, var(--${name}), var(--${name}))`;
      values.colors[name] = computed.color;
    }
    for (const name of lengths) {
      const raw = read(name);
      if (!raw) continue;
      // column-gap reports the computed length; width would report the used
      // one, snapped to 1/64px by layout (0.65rem came out as 10.39).
      probe.style.columnGap = `var(--${name})`;
      values.lengths[name] = { px: Number.parseFloat(computed.columnGap), css: raw };
    }
    for (const name of weights) {
      const raw = read(name);
      if (raw) values.weights[name] = Number(raw);
    }
    values.scheme = attribute ? getComputedStyle(island).colorScheme : null;
    result.push(values);
    island.remove();
  }
  return result;
}

/* Runs `fn(input)` in a blank headless page. `fn` is serialized, so it must be
   self-contained: no closure over module scope. */
export async function inPage(fn, input) {
  await using view = new Bun.WebView({ backend: "chrome" });
  await view.navigate("about:blank");
  // `return await`: a bare return lets `await using` close the view first.
  return await view.evaluate(`(${fn.toString()})(${JSON.stringify(input)})`);
}

const evaluateIslands = (input) => inPage(readIslands, input);

/*
 * Resolves one theme. `css` is the full stylesheet (framework + theme, imports
 * inlined). Without `theme`, the default theme is read through its light and
 * dark boundaries. A named theme exports the schemes it declares: `light dark`
 * gives two modes, anything else one. `islands` is returned so component
 * measurements read the same boundaries.
 */
export async function resolveTokens({ css, theme, aliasSources = [] }) {
  let islands = [
    { mode: "light", attribute: "light" },
    { mode: "dark", attribute: "dark" },
  ];
  if (theme) {
    const [declared] = await evaluateIslands({
      css,
      islands: [{ attribute: theme }],
      colors: [],
      lengths: [],
      weights: [],
    });
    const schemes = declared.scheme.split(/\s+/).filter((s) => s === "light" || s === "dark");
    islands = (schemes.length > 0 ? schemes : ["light"]).map((mode) => ({
      mode,
      attribute: theme,
      scheme: mode,
    }));
  }

  const read = await evaluateIslands({
    css,
    islands,
    colors: THEME_COLORS,
    lengths: LENGTHS,
    weights: WEIGHTS,
  });
  const missing = [...new Set(read.flatMap((values) => values.missing))];
  if (missing.length > 0) {
    throw new Error(`Tokens without a value: ${missing.map((n) => `--${n}`).join(", ")}`);
  }

  const modes = Object.fromEntries(
    islands.map(({ mode }, i) => [
      mode,
      Object.fromEntries(Object.entries(read[i].colors).map(([n, c]) => [n, parseSrgb(c)])),
    ]),
  );
  // Geometry does not follow the color scheme; the first mode is the reference.
  const [{ lengths, weights }] = read;
  return { islands, modes, lengths, weights, aliases: aliasCandidates(...aliasSources) };
}

export function parseSrgb(value) {
  const match = value.match(/^color\(srgb ([^ ]+) ([^ ]+) ([^ )/]+)(?: \/ ([^ )]+))?\)$/);
  if (!match) throw new Error(`Unexpected computed color: ${value}`);
  const clamp = (n) => Math.min(1, Math.max(0, Number(n)));
  return {
    components: match.slice(1, 4).map((n) => round(clamp(n))),
    alpha: match[4] === undefined ? 1 : round(clamp(match[4])),
  };
}

const round = (n) => Math.round(n * 10000) / 10000;

export function hexOf({ components, alpha }) {
  const byte = (n) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${components.map(byte).join("")}${alpha < 1 ? byte(alpha) : ""}`;
}

const colorsEqual = (a, b) =>
  a.alpha === b.alpha && a.components.every((n, i) => n === b.components[i]);

/* A candidate becomes an alias only when its target is exported in the same
   group and holds the same value in every mode; otherwise the theme overrode
   the token literally. */
function aliasOf(name, valueSets, aliases, same) {
  return aliases.get(name)?.find((t) => valueSets.every((v) => t in v && same(v[t], v[name])));
}

/*
 * The target-neutral model both writers read: per mode, each color is
 * `{ alias }` or `{ color, hex }`; each foundation carries its role and is
 * `{ alias }`, `{ px, css }` or `{ weight }`.
 */
export function linkTokens({ modes, lengths, weights, aliases }) {
  const modeSets = Object.values(modes);
  const linkedModes = Object.fromEntries(
    Object.entries(modes).map(([mode, colors]) => [
      mode,
      Object.fromEntries(
        Object.entries(colors).map(([name, color]) => {
          const alias = aliasOf(name, modeSets, aliases, colorsEqual);
          return [name, alias ? { alias } : { color, hex: hexOf(color) }];
        }),
      ),
    ]),
  );

  const foundations = {};
  for (const [name, length] of Object.entries(lengths)) {
    const alias = aliasOf(name, [lengths], aliases, (a, b) => a.px === b.px);
    foundations[name] = { role: ROLE_OF.get(name), ...(alias ? { alias } : length) };
  }
  for (const [name, weight] of Object.entries(weights)) {
    foundations[name] = { role: "font-weight", weight };
  }
  return { modes: linkedModes, foundations };
}

const EXTENSION = "actual-css";

/*
 * Figma: DTCG documents keyed by file name, `foundations` plus one per color
 * mode. Figma turns each imported file into a collection whose single mode is
 * named after the file, hence `light` / `dark`. Recipe colors (see
 * design-components.js) join the mode files so they switch with the mode.
 */
export function toFigma({ modes, foundations }, recipes = {}) {
  const files = {};
  for (const [mode, colors] of Object.entries(modes)) {
    files[mode] = Object.fromEntries(
      Object.entries({ ...colors, ...recipes[mode] }).map(([name, token]) => [
        name,
        {
          $type: "color",
          $value: token.alias
            ? `{${token.alias}}`
            : { colorSpace: "srgb", ...token.color, hex: token.hex },
        },
      ]),
    );
  }

  files.foundations = Object.fromEntries(
    Object.entries(foundations).map(([name, token]) => {
      // `number`, not DTCG `fontWeight`: Figma's import drops fontWeight
      // tokens, and a number variable is what binds to a text layer's weight.
      if (token.role === "font-weight") return [name, { $type: "number", $value: token.weight }];
      const $value = token.alias ? `{${token.alias}}` : { value: token.px, unit: "px" };
      const doc = { $type: "dimension", $value };
      if (token.css) doc.$extensions = { [EXTENSION]: { css: token.css } };
      return [name, doc];
    }),
  );
  return files;
}

/* Penpot token types per role: the type decides which property a token can
   be applied to in the Penpot UI. */
const PENPOT_TYPES = {
  spacing: "spacing",
  radius: "borderRadius",
  "border-width": "borderWidth",
  "font-size": "fontSizes",
  size: "sizing",
  offset: "dimension",
  "font-weight": "fontWeights",
};

const PENPOT_THEME_GROUP = "Mode";

/*
 * Penpot: one token file holding every set plus `$themes` and `$metadata`.
 * Sets are `foundations` and `mode/<scheme>`, recipe colors included (their
 * names keep them apart, and they always switch with the mode); each theme of
 * the Mode group enables foundations and one scheme, so switching theme only
 * swaps colors. Values are plain strings (hex, `16px`): Penpot does not read
 * the DTCG object forms.
 */
export function toPenpot({ modes, foundations }, recipes = {}) {
  const doc = {
    foundations: Object.fromEntries(
      Object.entries(foundations).map(([name, token]) => {
        const $type = PENPOT_TYPES[token.role];
        if (token.alias) return [name, { $type, $value: `{${token.alias}}` }];
        return [name, { $type, $value: token.weight ?? `${token.px}px` }];
      }),
    ),
  };

  const colorSet = (colors) =>
    Object.fromEntries(
      Object.entries(colors).map(([name, token]) => [
        name,
        { $type: "color", $value: token.alias ? `{${token.alias}}` : token.hex },
      ]),
    );
  const schemes = Object.keys(modes);
  for (const mode of schemes) {
    doc[`mode/${mode}`] = colorSet({ ...modes[mode], ...recipes[mode] });
  }

  const title = (mode) => mode[0].toUpperCase() + mode.slice(1);
  doc.$themes = schemes.map((mode) => ({
    id: `mode-${mode}`,
    name: title(mode),
    group: PENPOT_THEME_GROUP,
    selectedTokenSets: { foundations: "enabled", [`mode/${mode}`]: "enabled" },
  }));
  doc.$metadata = {
    tokenSetOrder: ["foundations", ...schemes.map((mode) => `mode/${mode}`)],
    activeThemes: [`${PENPOT_THEME_GROUP}/${title(schemes[0])}`],
    activeSets: ["foundations", `mode/${schemes[0]}`],
  };
  return doc;
}
