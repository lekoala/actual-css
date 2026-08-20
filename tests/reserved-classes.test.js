import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectReservedClasses } from "../scripts/utils/collect-reserved-classes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const JSON_FILE = join(__dirname, "..", "scripts", "reserved-classes.json");

test("reserved-classes.json matches the classes extracted from src/css", async () => {
  const committed = JSON.parse(readFileSync(JSON_FILE, "utf8"));
  const generated = await collectReservedClasses(ROOT);
  expect(generated).toEqual(committed);
});

test("reserved-classes.json is sorted and unique", () => {
  const classes = JSON.parse(readFileSync(JSON_FILE, "utf8"));
  expect(classes).toEqual([...new Set(classes)].sort());
});
