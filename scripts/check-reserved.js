import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectReservedClasses } from "./utils/collect-reserved-classes.js";
import { loadReservedClasses } from "./utils/load-reserved-classes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const JSON_FILE = join(ROOT, "reserved-classes.json");

const committed = loadReservedClasses(JSON_FILE);
const generated = await collectReservedClasses(ROOT);

if (JSON.stringify(committed) !== JSON.stringify(generated)) {
  console.error("Reserved class check failed.");
  console.error(`Run "bun run generate:reserved" to refresh ${JSON_FILE} from src/css.`);
  process.exit(1);
}

console.log(`Reserved class check passed (${generated.length} classes).`);
