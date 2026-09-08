import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog } from "./build-catalog.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const JSON_FILE = join(ROOT, "components.json");

const committed = JSON.parse(await readFile(JSON_FILE, "utf8"));
const generated = await buildCatalog(ROOT);

if (JSON.stringify(committed) !== JSON.stringify(generated)) {
  console.error("Component catalog check failed.");
  console.error(
    `Run "bun run generate:catalog" to refresh ${JSON_FILE} from src/css, src/js, and the package exports.`,
  );
  process.exit(1);
}

console.log(`Component catalog check passed (${generated.length} components).`);
