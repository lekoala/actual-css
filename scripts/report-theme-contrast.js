/*
 * Non-blocking soft-contrast report across the shipped preset themes.
 *
 * The default theme carries a blocking contrast gate (tests/browser/
 * soft-recipe.test.js); presets are reference/demo material, so this tool only
 * REPORTS their resting and hovered soft pairs — light and dark where a theme
 * defines both — and exits 0 whatever it finds. Use it to decide where a
 * preset's character survives a soft-ink correction.
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

const ROOT = join(import.meta.dirname, "..");
const THEMES_DIR = join(ROOT, "src", "css", "themes");
const INTENTS = ["primary", "secondary", "success", "warning", "danger", "neutral"];
const OUT_HTML = join(ROOT, "tmp", "theme-contrast.html");

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (rgb) => {
  const [r, g, b] = rgb
    .map(Number)
    .map((v) => v / 255)
    .map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const themes = readdirSync(THEMES_DIR)
  .filter((file) => /^[a-z-]+\.css$/.test(file) && file !== "index.css")
  .map((file) => {
    const css = readFileSync(join(THEMES_DIR, file), "utf8");
    return { name: file.replace(".css", ""), hasDark: /light-dark\(/.test(css) };
  });

function island(theme, scheme) {
  const schemeAttr = ` style="color-scheme: ${scheme}"`;
  return `<div data-theme="${theme.name}"${schemeAttr} id="island-${theme.name}-${scheme}">
    ${INTENTS.map((i) => `<span data-ink="${i}" style="color: var(--${i})"></span>`).join("")}
    ${INTENTS.map((i) => `<span class="badge ${i}" data-badge="${i}">t</span>`).join("")}
    ${INTENTS.map((i) => `<button class="btn soft ${i}" data-hover="${i}" type="button">t</button>`).join("")}
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
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const x = c.getContext("2d", { willReadFrequently: true });
        const norm = (value) => {
          x.clearRect(0, 0, 1, 1);
          x.fillStyle = value;
          x.fillRect(0, 0, 1, 1);
          return [...x.getImageData(0, 0, 1, 1).data.slice(0, 3)];
        };
        const root = document.getElementById("${id}");
        const cs = (el) => getComputedStyle(el);
        const rest = {};
        for (const el of root.querySelectorAll("[data-badge]"))
          rest[el.dataset.badge] = { fg: norm(cs(el).color), bg: norm(cs(el).backgroundColor) };
        return rest;
      })()`);

    const readHover = (id) =>
      view.evaluate(`(() => {
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const x = c.getContext("2d", { willReadFrequently: true });
        const norm = (value) => {
          x.clearRect(0, 0, 1, 1);
          x.fillStyle = value;
          x.fillRect(0, 0, 1, 1);
          return [...x.getImageData(0, 0, 1, 1).data.slice(0, 3)];
        };
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
  },
  { artifactName: "theme-contrast" },
);
