import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectReservedClasses } from "./utils/collect-reserved-classes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const JSON_FILE = join(__dirname, "reserved-classes.json");

const committed = JSON.parse(readFileSync(JSON_FILE, "utf8"));
const generated = await collectReservedClasses(ROOT);

if (JSON.stringify(committed) !== JSON.stringify(generated)) {
  console.error("Reserved class check failed.");
  console.error(`Run "bun run generate:reserved" to refresh ${JSON_FILE} from src/css.`);
  process.exit(1);
}

console.log(`Reserved class check passed (${generated.length} classes).`);
