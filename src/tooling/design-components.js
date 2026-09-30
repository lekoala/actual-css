/*
 * Design-tool component export: renders every variant of a component in the
 * theme's islands, measures the computed box, and binds each value to a token.
 *
 * Nothing is modelled: the browser answers what a `.btn.danger.soft.lg`
 * looks like, so a theme's overrides and every derived value come along for
 * free. A component is described as one box and its texts — the box's layout
 * (hug or fill, fixed or content height, row or column, centred or not) is
 * read from the rendered element too, so the plugin only replays it.
 *
 * Colors bind to the theme token that paints the same value in every mode; a
 * color no theme token paints (a soft fill, a soft border) becomes a recipe
 * token named `<variant>-<intent>-<role>`, so the design tool still switches
 * it with the mode. Lengths stay measured px: binding them too (radius,
 * padding, height, type — about 1,800 bindings over 221 variants) froze
 * Penpot, and a theme's own lengths already arrive through the measurement.
 */
import { hexOf, inPage, parseSrgb } from "./design-tokens.js";

/* Every list starts with its default: the first combination is the one a
   design tool picks for a new instance. */
const INTENTS = ["default", "primary", "secondary", "success", "warning", "danger", "neutral"];
const SIZES = ["md", "sm", "lg"];
const BUTTON_VARIANTS = ["solid", "soft", "outline", "surface", "ghost", "link"];

const classes = (...names) => names.filter((n) => n && n !== "default" && n !== "md").join(" ");

/* One entry per design-tool component. Every combination of `properties` is
   measured and built, and each property becomes a variant property, in the
   order given — Intent, Variant, Size, the way an author stacks the classes.
   `html` renders one combination: classes are the public API, so the markup
   is what an author writes. "default" and "md" add no class. A soft-by-default
   component (badge, alert) still measures its default as `soft`, so its
   recipes share the button's names (`soft-danger-bg`) instead of doubling
   them; the recipe guard below fails if the two ever paint differently. */
export const COMPONENTS = [
  {
    name: "Button",
    properties: { Intent: INTENTS, Variant: BUTTON_VARIANTS, Size: SIZES },
    html: ({ Intent, Variant, Size }) =>
      `<button class="btn ${classes(Intent, Variant, Size)}" type="button">Button</button>`,
  },
  {
    name: "Input",
    properties: { Size: SIZES },
    html: ({ Size }) => `<input class="input ${classes(Size)}" value="Input" aria-label="Input">`,
  },
  {
    name: "Badge",
    properties: { Intent: INTENTS, Variant: ["soft", "solid", "outline"], Size: SIZES },
    html: ({ Intent, Variant, Size }) =>
      `<span class="badge ${classes(Intent, Variant, Size)}">Badge</span>`,
  },
  {
    name: "Alert",
    properties: { Intent: INTENTS, Variant: ["soft", "solid", "outline", "surface"] },
    html: ({ Intent, Variant }) =>
      `<div class="alert ${classes(Intent, Variant)}" role="status">Alert message</div>`,
  },
  {
    name: "Card",
    properties: {},
    html: () => '<article class="card"><h3>Card title</h3><p>Card content goes here.</p></article>',
  },
];

/* Wide enough for a card, narrow enough that a fill-width component (input,
   alert) reads as a component rather than a page-wide bar. */
const SPECIMEN_WIDTH = "20rem";

/* Runs in the page: every specimen in every island, computed values only.
   A specimen is one box plus its texts: the element's own text, an input's
   value, or each child element (a card's title and body). */
function measureSpecimens({ css, islands, specimens, width }) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
  const probe = document.createElement("div");
  document.body.append(probe);
  const srgb = (value) => {
    probe.style.color = `color-mix(in srgb, ${value}, ${value})`;
    return getComputedStyle(probe).color;
  };
  const px = (value) => Number.parseFloat(value) || 0;

  const text = (cs, rect, label) => ({
    label,
    width: rect.width,
    height: rect.height,
    color: srgb(cs.color),
    fontSize: px(cs.fontSize),
    fontWeight: Number(cs.fontWeight),
    lineHeight: cs.lineHeight === "normal" ? 1.2 : px(cs.lineHeight) / px(cs.fontSize),
    underline: cs.textDecorationLine.includes("underline"),
  });

  const texts = (el, cs, rect) => {
    if (el instanceof HTMLInputElement) {
      const inner = {
        width:
          rect.width -
          px(cs.paddingLeft) -
          px(cs.paddingRight) -
          px(cs.borderLeftWidth) -
          px(cs.borderRightWidth),
        height: cs.lineHeight === "normal" ? px(cs.fontSize) * 1.2 : px(cs.lineHeight),
      };
      return [{ ...text(cs, inner, el.value), rect: inner }];
    }
    if (el.children.length > 0) {
      return [...el.children].map((child) => {
        const box = child.getBoundingClientRect();
        return { ...text(getComputedStyle(child), box, child.textContent.trim()), rect: box };
      });
    }
    const range = document.createRange();
    range.selectNodeContents(el);
    const box = range.getBoundingClientRect();
    return [{ ...text(cs, box, el.textContent.trim()), rect: box }];
  };

  return islands.map(({ attribute, scheme }) => {
    const island = document.createElement("div");
    if (attribute) island.dataset.theme = attribute;
    if (scheme) island.style.colorScheme = scheme;
    // What body gives the page: an island does not reset `color`, and the
    // currentColor variants (outline, ghost, link) would otherwise inherit
    // the ink of body's scheme instead of this island's.
    island.style.color = "var(--text)";
    island.innerHTML = specimens
      .map((html) => `<div style="inline-size: ${width}">${html}</div>`)
      .join("");
    document.body.append(island);

    const measured = [...island.children].map((wrap) => {
      const el = wrap.firstElementChild;
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const children = texts(el, cs, rect);
      const flex = cs.display.includes("flex");
      const column = flex ? cs.flexDirection.startsWith("column") : children.length > 1;
      const [a, b] = children;
      return {
        width: rect.width,
        height: rect.height,
        // Narrower than its container: the component sizes to its content.
        hug: rect.width < wrap.getBoundingClientRect().width - 0.5,
        // A minimum height is a control size; otherwise content decides.
        fixedHeight: px(cs.minHeight) > 0,
        dir: column ? "column" : "row",
        justify: cs.justifyContent === "center" ? "center" : "start",
        gap: b ? Math.max(0, column ? b.rect.top - a.rect.bottom : b.rect.left - a.rect.right) : 0,
        padding: {
          top: px(cs.paddingTop),
          right: px(cs.paddingRight),
          bottom: px(cs.paddingBottom),
          left: px(cs.paddingLeft),
        },
        borderWidth: px(cs.borderTopWidth),
        radius: px(cs.borderTopLeftRadius),
        bg: srgb(cs.backgroundColor),
        border: srgb(cs.borderTopColor),
        children: children.map(({ rect: _, ...child }) => child),
      };
    });
    island.remove();
    return measured;
  });
}

function combinations(properties) {
  return Object.entries(properties).reduce(
    (acc, [name, values]) => acc.flatMap((props) => values.map((v) => ({ ...props, [name]: v }))),
    [{}],
  );
}

/*
 * Measures `components` for the islands of a resolved theme. Returns the
 * recipe colors per mode (same shape as linked theme colors) and the spec a
 * design-tool plugin builds from: per variant, the box and its texts in px,
 * and each color's value for the first mode plus the token it binds to.
 */
export async function measureComponents({ css, resolved, linked, components = COMPONENTS }) {
  const modes = Object.keys(resolved.modes);
  const specimens = components.flatMap((component) =>
    combinations(component.properties).map((props) => ({ component, props })),
  );
  const measured = await inPage(measureSpecimens, {
    css,
    islands: resolved.islands,
    specimens: specimens.map(({ component, props }) => component.html(props)),
    width: SPECIMEN_WIDTH,
  });

  // Theme colors keyed by their value in every mode; aliases are skipped so a
  // color binds to the concrete token (`text`, not `heading`).
  const themeByValue = new Map();
  for (const name of Object.keys(linked.modes[modes[0]])) {
    if (linked.modes[modes[0]][name].alias) continue;
    const key = modes.map((mode) => hexOf(resolved.modes[mode][name])).join(" ");
    if (!themeByValue.has(key)) themeByValue.set(key, name);
  }

  const recipes = Object.fromEntries(modes.map((mode) => [mode, {}]));
  // `perMode` is one computed color per mode.
  const bindColor = (perMode, recipeName) => {
    const colors = perMode.map(parseSrgb);
    if (colors.every((c) => c.alpha === 0)) return null;
    const hexes = colors.map(hexOf);
    let token = themeByValue.get(hexes.join(" "));
    if (!token) {
      token = recipeName;
      modes.forEach((mode, m) => {
        const known = recipes[mode][token];
        // A recipe name carries no size and no component: if two of them
        // ever paint different colors, the name has to grow a dimension.
        if (known && known.hex !== hexes[m]) {
          throw new Error(`Recipe ${token} paints ${known.hex} and ${hexes[m]} in ${mode}`);
        }
        recipes[mode][token] = { color: colors[m], hex: hexes[m] };
      });
    }
    const [first] = colors;
    return { hex: hexOf({ ...first, alpha: 1 }), opacity: first.alpha, token };
  };

  const describe = (component, props, i) => {
    const [m] = measured.map((island) => island[i]);
    const each = (read) => measured.map((island) => read(island[i]));
    // Intent and variant name the recipe; a component with neither uses its
    // own name, so two plain components never share one.
    const scope = [props.Variant, props.Intent].filter(Boolean);
    const recipe = (role) =>
      [...(scope.length ? scope : [component.name]), role].join("-").toLowerCase();
    return {
      props,
      box: {
        width: Math.ceil(m.width),
        height: m.height,
        hug: m.hug,
        fixedHeight: m.fixedHeight,
        dir: m.dir,
        justify: m.justify,
        gap: m.gap,
        padding: m.padding,
        radius: m.radius,
        borderWidth: m.borderWidth,
        fill: bindColor(
          each((s) => s.bg),
          recipe("bg"),
        ),
        stroke:
          m.borderWidth > 0
            ? bindColor(
                each((s) => s.border),
                recipe("border"),
              )
            : null,
      },
      texts: m.children.map((child, c) => ({
        label: child.label,
        width: Math.ceil(child.width),
        height: Math.ceil(child.height),
        lineHeight: Math.round(child.lineHeight * 1000) / 1000,
        fontSize: child.fontSize,
        fontWeight: child.fontWeight,
        underline: child.underline,
        color: bindColor(
          each((s) => s.children[c].color),
          recipe(c === 0 ? "fg" : `fg-${c + 1}`),
        ),
      })),
    };
  };

  const spec = components.map((component) => ({
    name: component.name,
    properties: Object.keys(component.properties),
    variants: specimens.flatMap(({ component: owner, props }, i) =>
      owner === component ? [describe(component, props, i)] : [],
    ),
  }));

  return { recipes, spec: { components: spec } };
}
