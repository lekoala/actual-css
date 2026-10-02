/*
 * Theme contrast report: the pairs a theme author tunes by hand, measured in
 * headless Chrome on the theme's own boundaries. Shared by the CLI
 * (`actual-css contrast`) and the repository report over the presets
 * (`bun run report:theme-contrast`).
 *
 * Measured per island (one per color scheme the theme declares):
 *   - soft ink against the resting and the hovered soft fill (4.5:1)
 *   - the focus line against --surface and --surface-solid (3:1)
 *   - the invalid-field focus line against the field's own background (3:1)
 *   - --surface-solid-fg on --surface-solid (4.5:1)
 * A pair involving a translucent color has no ratio until it is composited
 * over its backdrop, so it reads n/a instead of a number.
 *
 * Bun only: Bun.WebView drives the browser.
 */
import { fileURLToPath } from "node:url";
import { contrast, RASTERIZE } from "./color.js";
import { inlineImports } from "./css-bundle.js";
import { themeNameOf } from "./design-tokens.js";

const FRAMEWORK = fileURLToPath(new URL("../css/actual.full.css", import.meta.url));

export const INTENTS = ["primary", "secondary", "success", "warning", "danger", "neutral"];

/* Badges state .soft explicitly: a theme may fill badges by default
   (bootstrap-v6), which would measure a solid pair against the soft hover. */
function islandMarkup(id, attribute, scheme) {
  const theme = attribute ? ` data-theme="${attribute}"` : "";
  const style = scheme ? ` style="color-scheme: ${scheme}"` : "";
  return `<div${theme}${style} id="${id}">
    ${INTENTS.map((i) => `<span class="badge soft ${i}" data-badge="${i}">t</span>`).join("")}
    ${INTENTS.map((i) => `<button class="btn soft ${i}" data-hover="${i}" type="button">t</button>`).join("")}
    <span data-pair="focus-surface" style="color: var(--focus); background: var(--surface)"></span>
    <span data-pair="focus-solid" style="color: var(--focus); background: var(--surface-solid)"></span>
    <span data-pair="inverse" style="color: var(--surface-solid-fg); background: var(--surface-solid)"></span>
    <input class="input" aria-invalid="true" data-pair="invalid-field" aria-label="t">
  </div>`;
}

const ratio = (fg, bg) => (fg[3] < 255 || bg[3] < 255 ? null : contrast(fg, bg));

/*
 * Measures each theme of `themes` (data-theme values) in `css`, the full
 * stylesheet with imports inlined. `null` stands for the root's theme — the
 * default one, or an application theme written on :root — labelled `label`.
 * Each theme is read in every scheme its `color-scheme` declares. Returns one
 * row per island.
 */
export async function measureContrast({ css, themes, label = "default" }) {
  await using view = new Bun.WebView({ backend: "chrome" });
  await view.navigate("about:blank");

  // Transitions off: a forced :hover must compute its end state at once.
  const islands = await view.evaluate(`((css, themes, label) => {
    const style = document.createElement("style");
    style.textContent = css + "\\n* { transition-duration: 0s !important; }";
    document.head.append(style);

    // A root island carries no data-theme: the core redeclares the default
    // palette on [data-theme="light"|"dark"], which would mask a :root theme.
    // Pinning color-scheme alone is what picks the light-dark() side.
    const schemesOf = (attribute) => {
      const probe = document.createElement("div");
      if (attribute) probe.dataset.theme = attribute;
      document.body.append(probe);
      const declared = getComputedStyle(probe).colorScheme.split(/\\s+/);
      probe.remove();
      const schemes = declared.filter((s) => s === "light" || s === "dark");
      return schemes.length > 0 ? schemes : ["light"];
    };

    return themes.flatMap((attribute) =>
      schemesOf(attribute).map((scheme) => ({ theme: attribute ?? label, scheme, attribute })),
    );
  })(${JSON.stringify(css)}, ${JSON.stringify(themes)}, ${JSON.stringify(label)})`);

  const markup = islands
    .map((island, i) => islandMarkup(`island-${i}`, island.attribute, island.scheme))
    .join("\n");
  await view.evaluate(`document.body.insertAdjacentHTML("beforeend", ${JSON.stringify(markup)})`);

  await view.cdp("DOM.enable");
  await view.cdp("CSS.enable");
  const { root } = await view.cdp("DOM.getDocument");
  const { nodeIds } = await view.cdp("DOM.querySelectorAll", {
    nodeId: root.nodeId,
    selector: "[data-hover]",
  });
  for (const nodeId of nodeIds) {
    await view.cdp("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
  }

  const colors = await view.evaluate(`(() => {
    const rgba = ${RASTERIZE};
    return [...document.querySelectorAll("[id^=island-]")].map((island) => {
      const cs = (el) => getComputedStyle(el);
      const pairs = {};
      for (const el of island.querySelectorAll("[data-pair]")) {
        // The invalid field's block-end border carries --form-invalid-border,
        // the hook its focus outline reads, even on an underline-only theme
        // (material) whose other sides are clear.
        const fg = el.dataset.pair === "invalid-field" ? cs(el).borderBlockEndColor : cs(el).color;
        pairs[el.dataset.pair] = { fg: rgba(fg), bg: rgba(cs(el).backgroundColor) };
      }
      const soft = {};
      for (const el of island.querySelectorAll("[data-badge]")) {
        const hover = island.querySelector('[data-hover="' + el.dataset.badge + '"]');
        soft[el.dataset.badge] = {
          fg: rgba(cs(el).color),
          rest: rgba(cs(el).backgroundColor),
          hover: rgba(cs(hover).backgroundColor),
        };
      }
      return { pairs, soft };
    });
  })()`);

  return islands.map(({ theme, scheme }, i) => {
    const { pairs, soft } = colors[i];
    const pair = (key) => ratio(pairs[key].fg, pairs[key].bg);
    return {
      theme,
      scheme,
      soft: INTENTS.map((intent) => ({
        intent,
        rest: ratio(soft[intent].fg, soft[intent].rest),
        hover: ratio(soft[intent].fg, soft[intent].hover),
      })),
      focusSurface: pair("focus-surface"),
      focusSolid: pair("focus-solid"),
      invalidFocus: pair("invalid-field"),
      inverse: pair("inverse"),
    };
  });
}

/*
 * Measures one theme file over the framework, or the default theme without
 * `themeFile`. `name` overrides the data-theme name read from the file; a file
 * that declares none is a :root theme.
 */
export async function measureThemeFile({ themeFile, name }) {
  const themeCss = themeFile ? await inlineImports(themeFile) : "";
  const theme = themeFile ? themeNameOf(themeCss, name) : null;
  const css = `${await inlineImports(FRAMEWORK)}\n${themeCss}`;
  return measureContrast({ css, themes: [theme], label: themeFile ? ":root" : "default" });
}

/* Text tables for `rows`, and the number of pairs under their threshold. */
export function formatContrast(rows) {
  let misses = 0;
  const cell = (value, min) => {
    if (value === null) return { text: "n/a", miss: false };
    const miss = value < min;
    if (miss) misses += 1;
    return { text: `${value.toFixed(2)}:1`, miss };
  };
  const width = Math.max(5, ...rows.map((row) => row.theme.length));
  const head = (row) => `${row.theme.padEnd(width)}  ${row.scheme.padEnd(6)}`;
  const flag = (cells, min) => (cells.some((c) => c.miss) ? `  <-- under ${min}` : "");
  const lines = [];

  lines.push("Soft pair contrast (ink vs resting / hovered fill), needs 4.5:1.", "");
  lines.push(`${"theme".padEnd(width)}  scheme  intent       rest     hover`);
  for (const row of rows) {
    for (const { intent, rest, hover } of row.soft) {
      // Both states gate: the hovered fill is usually the closer one, but a
      // theme can invert that, and a 1:1 resting pair once passed silently.
      const cells = [cell(rest, 4.5), cell(hover, 4.5)];
      lines.push(
        `${head(row)}  ${intent.padEnd(9)} ${cells[0].text.padStart(8)}  ${cells[1].text.padStart(8)}${flag(cells, 4.5)}`,
      );
    }
  }

  const single = (title, key, min) => {
    lines.push("", title, "");
    lines.push(`${"theme".padEnd(width)}  scheme   ratio`);
    for (const row of rows) {
      const c = cell(row[key], min);
      lines.push(`${head(row)}  ${c.text.padStart(8)}${flag([c], min)}`);
    }
  };

  lines.push("", "Focus line contrast (--focus vs --surface / --surface-solid), needs 3:1.", "");
  lines.push(`${"theme".padEnd(width)}  scheme   surface     solid`);
  for (const row of rows) {
    const cells = [cell(row.focusSurface, 3), cell(row.focusSolid, 3)];
    lines.push(
      `${head(row)}  ${cells[0].text.padStart(8)}  ${cells[1].text.padStart(8)}${flag(cells, 3)}`,
    );
  }

  // Documented exception (focus.css): an invalid field focuses in
  // --form-invalid-border. The line is inset, so it reads against the
  // field's own background, not the surface around it.
  single(
    "Invalid focus line contrast (--form-invalid-border vs field), needs 3:1.",
    "invalidFocus",
    3,
  );
  // Tooltip and status-bar text sit on this pair.
  single(
    "Inverse text contrast (--surface-solid-fg vs --surface-solid), needs 4.5:1.",
    "inverse",
    4.5,
  );

  return { text: lines.join("\n"), misses };
}
