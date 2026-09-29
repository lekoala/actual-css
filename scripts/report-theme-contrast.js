/*
 * Non-blocking contrast report across the shipped preset themes.
 *
 * The default theme carries blocking gates (tests/browser/soft-recipe.test.js,
 * tests/browser/field-focus.test.js); presets are reference/demo material, so
 * this tool only REPORTS their resting and hovered soft pairs, their focus
 * line against --surface and --surface-solid, and the invalid-field focus
 * line (a real invalid .input's --form-invalid-border) against the field's
 * own background, and the inverse text pair --surface-solid-fg on
 * --surface-solid — light and dark where a theme defines both — and exits 0
 * whatever it finds. Use it to decide where a
 * preset's character survives a correction.
 *
 * Each island resolves its own tokens plus the default theme's inherited
 * --*-soft-fg hooks (a preset that wants its own soft ink overrides them), so
 * the numbers are the behavior an adopter actually ships.
 *
 * Usage: bun run report:theme-contrast
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fixtureUrl, withBrowserPage } from "./utils/browser.js";
import { RASTERIZE, contrast as ratio } from "./utils/color.js";

const ROOT = join(import.meta.dirname, "..");
const THEMES_DIR = join(ROOT, "src", "css", "themes");
const INTENTS = ["primary", "secondary", "success", "warning", "danger", "neutral"];
const OUT_HTML = join(ROOT, "tmp", "theme-contrast.html");

const themes = readdirSync(THEMES_DIR)
  .filter((file) => /^[a-z0-9-]+\.css$/.test(file) && file !== "index.css")
  .map((file) => {
    const css = readFileSync(join(THEMES_DIR, file), "utf8");
    return { name: file.replace(".css", ""), hasDark: /light-dark\(/.test(css) };
  });

// Badges state .soft explicitly: a preset may fill badges by default
// (bootstrap-v6), which would measure a solid pair against the soft hover.
function island(theme, scheme) {
  const schemeAttr = ` style="color-scheme: ${scheme}"`;
  return `<div data-theme="${theme.name}"${schemeAttr} id="island-${theme.name}-${scheme}">
    ${INTENTS.map((i) => `<span data-ink="${i}" style="color: var(--${i})"></span>`).join("")}
    ${INTENTS.map((i) => `<span class="badge soft ${i}" data-badge="${i}">t</span>`).join("")}
    ${INTENTS.map((i) => `<button class="btn soft ${i}" data-hover="${i}" type="button">t</button>`).join("")}
    <span data-focus="surface" style="color: var(--focus); background: var(--surface)"></span>
    <span data-focus="solid" style="color: var(--focus); background: var(--surface-solid)"></span>
    <span data-pair="inverse" style="color: var(--surface-solid-fg); background: var(--surface-solid)"></span>
    <input class="input" aria-invalid="true" data-focus-invalid="field" aria-label="t">
  </div>`;
}

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Theme contrast report</title>
  <link rel="stylesheet" href="../src/css/actual.full.css">
  <style>
    * { transition-duration: 0s !important; }
  </style>
  ${themes
    .map(
      (theme) =>
        `<link rel="stylesheet" href="../src/css/themes/${theme.name}.css" data-report-theme="${theme.name}">`,
    )
    .join("\n  ")}
</head>
<body>
${themes
  .map((theme) => island(theme, "light") + (theme.hasDark ? island(theme, "dark") : ""))
  .join("\n  ")}
</body>
</html>
`;

mkdirSync(join(ROOT, "tmp"), { recursive: true });
writeFileSync(OUT_HTML, page);

await withBrowserPage(
  fixtureUrl(OUT_HTML),
  async (view) => {
    const readRest = (id) =>
      view.evaluate(`(() => {
        const norm = ${RASTERIZE};
        const root = document.getElementById("${id}");
        const cs = (el) => getComputedStyle(el);
        const rest = {};
        const key = (el) =>
          el.dataset.badge ??
          el.dataset.pair ??
          (el.dataset.focus ? \`focus-\${el.dataset.focus}\` : \`invalid-\${el.dataset.focusInvalid}\`);
        for (const el of root.querySelectorAll(
          "[data-badge], [data-pair], [data-focus], [data-focus-invalid]",
        ))
          rest[key(el)] = {
            // The invalid field's block-end border carries
            // --form-invalid-border, the hook its focus outline reads, even on
            // an underline-only preset (material) whose other sides are clear.
            fg: norm(el.dataset.focusInvalid ? cs(el).borderBlockEndColor : cs(el).color),
            bg: norm(cs(el).backgroundColor),
          };
        return rest;
      })()`);

    const readHover = (id) =>
      view.evaluate(`(() => {
        const norm = ${RASTERIZE};
        const root = document.getElementById("${id}");
        const bg = {};
        for (const el of root.querySelectorAll("[data-hover]"))
          bg[el.dataset.hover] = norm(getComputedStyle(el).backgroundColor);
        return bg;
      })()`);

    const forceHover = async (selector) => {
      const { nodeId } = await view.cdp("DOM.querySelector", {
        nodeId: documentNode.nodeId,
        selector,
      });
      await view.cdp("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
    };

    await view.cdp("DOM.enable");
    await view.cdp("CSS.enable");
    const { root: documentNode } = await view.cdp("DOM.getDocument");

    console.log("Soft pair contrast (ink vs surface), report only — no gate.\n");
    console.log("theme      scheme  intent    rest   hover");
    for (const theme of themes) {
      for (const scheme of theme.hasDark ? ["light", "dark"] : ["light"]) {
        const id = `island-${theme.name}-${scheme}`;
        const rest = await readRest(id);
        for (const intent of INTENTS) {
          await forceHover(`#${id} [data-hover="${intent}"]`);
        }
        const hover = await readHover(id);
        for (const intent of INTENTS) {
          const fg = rest[intent].fg;
          const r = ratio(fg, rest[intent].bg).toFixed(2);
          const h = ratio(fg, hover[intent]).toFixed(2);
          const flag = +h < 4.5 ? "  <-- under 4.5" : "";
          console.log(
            `${theme.name.padEnd(9)}  ${scheme.padEnd(6)}  ${intent.padEnd(9)} ${r.padStart(5)}:1   ${h.padStart(5)}:1${flag}`,
          );
        }
      }
    }

    console.log("\nFocus line contrast (--focus vs surface / solid), needs 3:1 on both.\n");
    console.log("theme      scheme  surface  solid");
    for (const theme of themes) {
      for (const scheme of theme.hasDark ? ["light", "dark"] : ["light"]) {
        const rest = await readRest(`island-${theme.name}-${scheme}`);
        const [s, d] = ["focus-surface", "focus-solid"].map((key) =>
          ratio(rest[key].fg, rest[key].bg).toFixed(2),
        );
        const flag = +s < 3 || +d < 3 ? "  <-- under 3" : "";
        console.log(
          `${theme.name.padEnd(9)}  ${scheme.padEnd(6)}  ${s.padStart(5)}:1  ${d.padStart(5)}:1${flag}`,
        );
      }
    }

    // Documented exception (focus.css): an invalid field focuses in
    // --form-invalid-border. The line is inset, so it reads against the
    // field's own background, not the surface around it.
    console.log("\nInvalid focus line contrast (--form-invalid-border vs field), needs 3:1.\n");
    console.log("theme      scheme  field");
    for (const theme of themes) {
      for (const scheme of theme.hasDark ? ["light", "dark"] : ["light"]) {
        const rest = await readRest(`island-${theme.name}-${scheme}`);
        const v = ratio(rest["invalid-field"].fg, rest["invalid-field"].bg).toFixed(2);
        const flag = +v < 3 ? "  <-- under 3" : "";
        console.log(`${theme.name.padEnd(9)}  ${scheme.padEnd(6)}  ${v.padStart(5)}:1${flag}`);
      }
    }

    // Tooltip and status-bar text sit on this pair.
    console.log("\nInverse text contrast (--surface-solid-fg vs --surface-solid), needs 4.5:1.\n");
    console.log("theme      scheme  inverse");
    for (const theme of themes) {
      for (const scheme of theme.hasDark ? ["light", "dark"] : ["light"]) {
        const rest = await readRest(`island-${theme.name}-${scheme}`);
        const v = ratio(rest.inverse.fg, rest.inverse.bg).toFixed(2);
        const flag = +v < 4.5 ? "  <-- under 4.5" : "";
        console.log(`${theme.name.padEnd(9)}  ${scheme.padEnd(6)}  ${v.padStart(5)}:1${flag}`);
      }
    }
  },
  { artifactName: "theme-contrast" },
);
