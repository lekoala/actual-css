/*
 * Design-tool export for one theme, into tmp/design/<theme>/. Run with
 * bun run export:design [--theme FILE] [--name NAME] [--out DIR].
 *
 * Same export as `actual-css design` (src/tooling/design-export.js). To load
 * the Penpot plugin from penpot.app, serve the repository with
 * `bun scripts/serve.js --cors` and open
 * http://localhost:3000/tmp/design/<theme>/penpot/plugin/manifest.json.
 */
import { join } from "node:path";
import { inlineImports } from "../src/tooling/css-bundle.js";
import { exportDesign } from "../src/tooling/design-export.js";
import { themeNameOf } from "../src/tooling/design-tokens.js";
import { readFlags } from "./utils/browser.js";

const args = process.argv.slice(2);
const flags = readFlags(args, {
  "--theme": { fallback: null },
  "--name": { fallback: null },
  "--out": { fallback: null },
});
if (args.length > 0) throw new Error(`Unknown arguments: ${args.join(" ")}`);

const themeFile = flags["--theme"];
const name =
  flags["--name"] ?? (themeFile ? themeNameOf(await inlineImports(themeFile)) : "default");
const out = flags["--out"] ?? join("tmp", "design", name);

for (const file of await exportDesign({ themeFile, name: flags["--name"], out })) {
  console.log(`Wrote ${file}`);
}
