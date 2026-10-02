/*
 * Design-tool export for one theme: Figma and Penpot tokens, the measured
 * component spec, and the Penpot plugin that builds it. Shared by the CLI
 * (`actual-css design`) and the repository script (`bun run export:design`).
 * Bun only: values are read in headless Chrome through Bun.WebView.
 */
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inlineImports } from "./css-bundle.js";
import { measureComponents } from "./design-components.js";
import {
  coreTokenCss,
  linkTokens,
  resolveTokens,
  themeNameOf,
  toFigma,
  toPenpot,
} from "./design-tokens.js";

const FRAMEWORK = fileURLToPath(new URL("../css/actual.full.css", import.meta.url));
const PLUGIN = fileURLToPath(new URL("./penpot-plugin/", import.meta.url));

/*
 * Writes, under `out`:
 *   figma/foundations.tokens.json, figma/<scheme>.tokens.json
 *   penpot/tokens.json
 *   penpot/plugin/ (manifest.json, plugin.js, ui.html, spec.json)
 * Without `themeFile`, exports the default theme. `name` overrides the
 * data-theme name read from the theme file. Returns the written paths.
 */
export async function exportDesign({ themeFile, name, out }) {
  const themeCss = themeFile ? await inlineImports(themeFile) : "";
  const theme = themeFile ? themeNameOf(themeCss, name) : null;
  const css = `${await inlineImports(FRAMEWORK)}\n${themeCss}`;

  const resolved = await resolveTokens({
    css,
    theme,
    aliasSources: [await coreTokenCss(), themeFile ? await readFile(themeFile, "utf8") : ""],
  });
  const linked = linkTokens(resolved);
  const { recipes, spec } = await measureComponents({ css, resolved, linked });

  const documents = {
    ...Object.fromEntries(
      Object.entries(toFigma(linked, recipes)).map(([file, doc]) => [
        `figma/${file}.tokens.json`,
        doc,
      ]),
    ),
    "penpot/tokens.json": toPenpot(linked, recipes),
    "penpot/plugin/spec.json": spec,
  };

  const written = [];
  for (const [path, doc] of Object.entries(documents)) {
    const file = join(out, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(doc, null, 2)}\n`);
    written.push(file);
  }
  for (const entry of await readdir(PLUGIN)) {
    const file = join(out, "penpot", "plugin", entry);
    await copyFile(join(PLUGIN, entry), file);
    written.push(file);
  }
  return written;
}
