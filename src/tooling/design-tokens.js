/*
 * Design-tool token export: resolves a theme's tokens in headless Chrome into
 * a target-neutral model, then writes them for Figma, Penpot, and a portable
 * DTCG profile. Figma and Penpot get the compromises their importers need; the
 * DTCG profile stays spec-conformant (correct $types, 6-digit `hex`).
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
  "border-control",
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

/* Mode-independent tokens by role. The role drives the DTCG type (see
   DTCG_TYPE) and the Penpot type; length roles plus font-weight are the ones
   Figma and Penpot read, the rest are DTCG-only. */
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
  "font-family": ["font-sans", "font-mono"],
  duration: ["duration", "duration-fast", "duration-slow", "duration-spin", "duration-shimmer"],
  "cubic-bezier": ["ease-enter", "ease-exit"],
  number: ["line-height", "line-height-tight", "line-height-relaxed"],
};

/* Every custom property declared by the core token files is exported or
   listed here (tests/design-tokens.test.js), so a new token cannot silently
   stay out of the design tools. */
export const NOT_EXPORTED = {
  "internal 0/1 weights selecting a control step; the steps are exported": [
    "control-step-sm",
    "control-step-md",
    "control-step-lg",
  ],
  "no DTCG type that keeps its meaning": [
    "font-width",
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
  "composite DTCG types the export does not build yet": ["shadow", "shadow-popout"],
  "input of a derived value": [
    "backdrop-color",
    "backdrop-opacity",
    "soft-bg-mix",
    "soft-border-mix",
    "soft-hover-alpha",
    "soft-fg-mix",
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
  "fallback-only state hook, read at the point of use": ["state-selected-text"],
  "internal or plumbing": [
    "density-space",
    "disabled-opacity",
    "indicator-offset",
    "choice-control-size",
    "hgroup-gap",
    "tone-fg",
  ],
};

// Length roles carry a px value plus the CSS source; every other role carries
// one scalar read as-is and parsed by role (see PARSE).
const LENGTH_ROLES = ["spacing", "radius", "border-width", "font-size", "size", "offset"];
const RAW_ROLES = ["font-family", "duration", "cubic-bezier", "number"];
const LENGTHS = LENGTH_ROLES.flatMap((role) => FOUNDATIONS[role]);
const WEIGHTS = FOUNDATIONS["font-weight"];
const RAWS = RAW_ROLES.flatMap((role) => FOUNDATIONS[role]);
const ROLE_OF = new Map(
  Object.entries(FOUNDATIONS).flatMap(([role, names]) => names.map((n) => [n, role])),
);

const DECLARATION_RE = /(?<![-\w])--([a-z0-9-]+)\s*:\s*([^;{}]*);/gi;
const ALIAS_RE = /^var\(\s*--([a-z0-9-]+)\s*\)$/i;
// Every valid spelling — either quote, a bare ident, whitespace inside the
// brackets, an i/s flag: a missed name falls back to the :root theme silently.
const THEME_NAME_RE = /\[\s*data-theme\s*=\s*(?:(["'])([^"']+)\1|([-\w]+))\s*(?:[is]\s*)?\]/gi;

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

/* The one data-theme value a theme file declares, light/dark excluded. null
   when it declares none: the theme is written on :root, the application's
   own sheet rather than an island. An explicit name must be one the file
   declares: an island no rule matches would measure the framework defaults
   and report them as the theme (a typo passed silently). */
export function themeNameOf(css, explicit) {
  const names = new Set(
    // Comments stripped: a selector quoted in a doc comment is not a theme.
    [...stripComments(css).matchAll(THEME_NAME_RE)]
      .map((m) => m[2] ?? m[3])
      .filter((n) => n !== "light" && n !== "dark"),
  );
  if (explicit != null) {
    if (names.has(explicit)) return explicit;
    const found = names.size ? `it declares ${[...names].join(", ")}` : "it declares none";
    throw new Error(`The theme declares no [data-theme="${explicit}"]; ${found}.`);
  }
  if (names.size > 1) {
    throw new Error(
      `Expected one [data-theme="…"] name in the theme, found ${[...names].join(", ")}; pass the name explicitly.`,
    );
  }
  return names.size === 1 ? [...names][0] : null;
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
function readIslands({ css, islands, colors, lengths, weights, raws }) {
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
    const values = { colors: {}, lengths: {}, weights: {}, raws: {}, missing: [] };
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
    for (const name of raws) {
      const raw = read(name);
      if (raw) values.raws[name] = raw;
    }
    values.scheme = getComputedStyle(island).colorScheme;
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
 * inlined). Without `theme`, the theme is the root's — the default one, or an
 * application theme written on :root. The theme exports the schemes it
 * declares: `light dark` gives two modes, anything else one. `islands` is
 * returned so component measurements read the same boundaries.
 */
export async function resolveTokens({ css, theme = null, aliasSources = [] }) {
  // A root island carries no data-theme: the core redeclares the default
  // palette on [data-theme="light"|"dark"], which would mask a :root theme.
  // Pinning color-scheme alone is what picks the light-dark() side.
  const [declared] = await evaluateIslands({
    css,
    islands: [{ attribute: theme }],
    colors: [],
    lengths: [],
    weights: [],
    raws: [],
  });
  const schemes = declared.scheme.split(/\s+/).filter((s) => s === "light" || s === "dark");
  const islands = (schemes.length > 0 ? schemes : ["light"]).map((mode) => ({
    mode,
    attribute: theme,
    scheme: mode,
  }));

  const read = await evaluateIslands({
    css,
    islands,
    colors: THEME_COLORS,
    lengths: LENGTHS,
    weights: WEIGHTS,
    raws: RAWS,
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
  // Geometry and the raw foundations do not follow the color scheme; the first
  // mode is the reference.
  const [{ lengths, weights, raws }] = read;
  const extras = Object.fromEntries(
    Object.entries(raws).map(([name, raw]) => [name, PARSE[ROLE_OF.get(name)](raw)]),
  );
  return { islands, modes, lengths, weights, extras, aliases: aliasCandidates(...aliasSources) };
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

/* Raw foundation readers. Each role maps to one parser, so a value the browser
   reports in an unexpected shape fails loudly instead of exporting garbage. */
export function parseDuration(value) {
  const match = value.match(/^([\d.]+)(ms|s)$/);
  if (!match) throw new Error(`Unexpected duration: ${value}`);
  return { value: Number(match[1]), unit: match[2] };
}

export function parseCubicBezier(value) {
  const match = value.match(/^cubic-bezier\(([^)]+)\)$/);
  const numbers = match?.[1].split(",").map((n) => Number(n.trim()));
  if (numbers?.length !== 4 || numbers.some(Number.isNaN)) {
    throw new Error(`Unexpected cubic-bezier: ${value}`);
  }
  return numbers;
}

export function parseFontFamily(value) {
  return value
    .split(",")
    .map((family) => family.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

export function parseNumber(value) {
  const n = Number(value);
  if (Number.isNaN(n)) throw new Error(`Unexpected number: ${value}`);
  return n;
}

const PARSE = {
  "font-family": parseFontFamily,
  duration: parseDuration,
  "cubic-bezier": parseCubicBezier,
  number: parseNumber,
};

const round = (n) => Math.round(n * 10000) / 10000;

const byte = (n) =>
  Math.round(n * 255)
    .toString(16)
    .padStart(2, "0");

/* DTCG color `hex` is a 6-digit fallback: alpha is carried separately, and the
   spec requires the hex itself to be 6 digits. */
export function hexRgbOf({ components }) {
  return `#${components.map(byte).join("")}`;
}

/* The CSS-fidelity form: keeps alpha in the hex for Penpot and for comparing
   colors across modes (two colors that share RGB but not alpha must differ). */
export function hexOf({ components, alpha }) {
  return `${hexRgbOf({ components })}${alpha < 1 ? byte(alpha) : ""}`;
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
 * The target-neutral model the writers read: per mode, each color is
 * `{ alias }` or `{ color, hex }` (hex 6-digit, the DTCG form); each
 * foundation carries its role and is `{ alias }`, `{ px, css }`, `{ weight }`
 * or `{ value }` for the raw roles.
 */
export function linkTokens({ modes, lengths, weights, extras = {}, aliases }) {
  const modeSets = Object.values(modes);
  const linkedModes = Object.fromEntries(
    Object.entries(modes).map(([mode, colors]) => [
      mode,
      Object.fromEntries(
        Object.entries(colors).map(([name, color]) => {
          const alias = aliasOf(name, modeSets, aliases, colorsEqual);
          return [name, alias ? { alias } : { color, hex: hexRgbOf(color) }];
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
  for (const [name, value] of Object.entries(extras)) {
    foundations[name] = { role: ROLE_OF.get(name), value };
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
    Object.entries(foundations).flatMap(([name, token]) => {
      // `number`, not DTCG `fontWeight`: Figma's import drops fontWeight
      // tokens, and a number variable is what binds to a text layer's weight.
      if (token.role === "font-weight") {
        return [[name, { $type: "number", $value: token.weight }]];
      }
      // Figma reads dimensions only; the raw roles stay in the DTCG profile.
      if (!LENGTH_ROLES.includes(token.role)) return [];
      const $value = token.alias ? `{${token.alias}}` : { value: token.px, unit: "px" };
      const doc = { $type: "dimension", $value };
      if (token.css) doc.$extensions = { [EXTENSION]: { css: token.css } };
      return [[name, doc]];
    }),
  );
  return files;
}

/* DTCG `$type` per role. Figma keeps its own adaptations (a font weight as a
   number); the neutral profile uses the type the spec defines. */
const DTCG_TYPE = {
  spacing: "dimension",
  radius: "dimension",
  "border-width": "dimension",
  "font-size": "dimension",
  size: "dimension",
  offset: "dimension",
  "font-weight": "fontWeight",
  "font-family": "fontFamily",
  duration: "duration",
  "cubic-bezier": "cubicBezier",
  number: "number",
};

function dtcgValue(token) {
  if (token.alias) return `{${token.alias}}`;
  if (token.role === "font-weight") return token.weight;
  if (LENGTH_ROLES.includes(token.role)) return { value: token.px, unit: "px" };
  return token.value;
}

/*
 * DTCG: the portable profile. Same file split as Figma, but every foundation
 * keeps its spec type (`fontWeight`, `duration`, `cubicBezier`, `fontFamily`,
 * `number`), colors carry a 6-digit `hex` with alpha separate, and dimensions
 * keep their CSS value in `$extensions`. No tool adaptation: any DTCG reader
 * can import it.
 */
export function toDtcg({ modes, foundations }, recipes = {}) {
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
      const doc = { $type: DTCG_TYPE[token.role], $value: dtcgValue(token) };
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
      Object.entries(foundations).flatMap(([name, token]) => {
        const $type = PENPOT_TYPES[token.role];
        // Penpot reads the roles it types; the DTCG-only roles stay out.
        if (!$type) return [];
        if (token.alias) return [[name, { $type, $value: `{${token.alias}}` }]];
        return [[name, { $type, $value: token.weight ?? `${token.px}px` }]];
      }),
    ),
  };

  const colorSet = (colors) =>
    Object.fromEntries(
      Object.entries(colors).map(([name, token]) => [
        name,
        { $type: "color", $value: token.alias ? `{${token.alias}}` : hexOf(token.color) },
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
