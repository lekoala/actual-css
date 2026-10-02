/*
 * Non-blocking contrast report across the shipped preset themes.
 *
 * The default theme carries blocking gates (tests/browser/soft-recipe.test.js,
 * tests/browser/field-focus.test.js); presets are reference/demo material, so
 * this tool only REPORTS their pairs (src/tooling/theme-contrast.js lists
 * them) and exits 0 whatever it finds. Use it to decide where a preset's
 * character survives a correction. An adopter measures their own theme with
 * `actual-css contrast --theme FILE`, which runs the same measurement.
 *
 * Each island resolves its own tokens plus the default theme's inherited
 * --*-soft-fg hooks (a preset that wants its own soft ink overrides them), so
 * the numbers are the behavior an adopter actually ships.
 *
 * Usage: bun run report:theme-contrast
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { inlineImports } from "../src/tooling/css-bundle.js";
import { formatContrast, measureContrast } from "../src/tooling/theme-contrast.js";

const ROOT = join(import.meta.dirname, "..");
const THEMES_DIR = join(ROOT, "src", "css", "themes");

const names = readdirSync(THEMES_DIR)
  .filter((file) => /^[a-z0-9-]+\.css$/.test(file) && file !== "index.css")
  .map((file) => file.replace(".css", ""));

const sheets = [
  join(ROOT, "src", "css", "actual.full.css"),
  ...names.map((n) => join(THEMES_DIR, `${n}.css`)),
];
const css = (await Promise.all(sheets.map((file) => inlineImports(file)))).join("\n");

const rows = await measureContrast({ css, themes: names });
console.log("Report only — no gate.\n");
console.log(formatContrast(rows).text);
