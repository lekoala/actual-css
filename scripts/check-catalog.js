import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, buildTokens, CATALOG_FAMILIES } from "./build-catalog.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const derived = {};
for (const family of CATALOG_FAMILIES) derived[`${family}.json`] = await buildCatalog(ROOT, family);
derived["tokens.json"] = await buildTokens(ROOT);

const drifted = [];
for (const [file, generated] of Object.entries(derived)) {
  const committed = JSON.parse(await readFile(join(ROOT, file), "utf8"));
  if (JSON.stringify(committed) !== JSON.stringify(generated)) drifted.push(file);
}

if (drifted.length) {
  console.error("Component catalog check failed.");
  console.error(
    `Run "bun run generate:catalog" to refresh ${drifted.join(", ")} from src/css, src/js, and the package exports.`,
  );
  process.exit(1);
}

const counts = CATALOG_FAMILIES.map((family) => `${derived[`${family}.json`].length} ${family}`);
console.log(
  `Component catalog check passed (${counts.join(", ")}, ${derived["tokens.json"].global.length} global tokens).`,
);
