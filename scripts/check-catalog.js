import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, buildTokens } from "./build-catalog.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const JSON_FILE = join(ROOT, "components.json");
const TOKENS_FILE = join(ROOT, "tokens.json");

const committed = JSON.parse(await readFile(JSON_FILE, "utf8"));
const generated = await buildCatalog(ROOT);
const committedTokens = JSON.parse(await readFile(TOKENS_FILE, "utf8"));
const generatedTokens = await buildTokens(ROOT);

const drifted = [
  JSON.stringify(committed) !== JSON.stringify(generated) && JSON_FILE,
  JSON.stringify(committedTokens) !== JSON.stringify(generatedTokens) && TOKENS_FILE,
].filter(Boolean);

if (drifted.length) {
  console.error("Component catalog check failed.");
  console.error(
    `Run "bun run generate:catalog" to refresh ${drifted.join(" and ")} from src/css, src/js, and the package exports.`,
  );
  process.exit(1);
}

console.log(
  `Component catalog check passed (${generated.length} components, ${generatedTokens.global.length} global tokens).`,
);
