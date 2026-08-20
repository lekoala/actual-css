import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectReservedClasses } from "./utils/collect-reserved-classes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(__dirname, "reserved-classes.json");

const classes = await collectReservedClasses(ROOT);
await writeFile(OUT, `${JSON.stringify(classes, null, 2)}\n`);
console.log(`Wrote ${classes.length} reserved classes to ${OUT}`);
