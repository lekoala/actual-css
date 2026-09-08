import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectReservedClasses } from "../scripts/utils/collect-reserved-classes.js";
import { loadReservedClasses } from "../scripts/utils/load-reserved-classes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const JSON_FILE = join(ROOT, "reserved-classes.json");

test("reserved-classes.json matches the classes extracted from src/css", async () => {
  const committed = JSON.parse(readFileSync(JSON_FILE, "utf8"));
  const generated = await collectReservedClasses(ROOT);
  expect(generated).toEqual(committed);
});

test("reserved-classes.json is sorted and unique", () => {
  const classes = JSON.parse(readFileSync(JSON_FILE, "utf8"));
  expect(classes).toEqual([...new Set(classes)].sort());
});

/* The loader must fail rather than hand a checker a weak list: a missing,
   empty, or malformed file is a broken contract, not a signal to run with a
   reduced class set. Each case asserts the throw so future lazy-read
   refactors cannot silently weaken check:doc-classes. */
test("loadReservedClasses accepts a valid list", () => {
  const dir = mkdtempSync(join(tmpdir(), "reserved-ok-"));
  try {
    const file = join(dir, "reserved-classes.json");
    writeFileSync(file, JSON.stringify(["alert", "badge", "btn"]));
    expect(loadReservedClasses(file)).toEqual(["alert", "badge", "btn"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadReservedClasses throws on a missing file", () => {
  expect(() => loadReservedClasses(join(ROOT, "no-such-list.json"))).toThrow(
    /Cannot read reserved class list/,
  );
});

test("loadReservedClasses throws on an empty list", () => {
  const dir = mkdtempSync(join(tmpdir(), "reserved-empty-"));
  try {
    const file = join(dir, "reserved-classes.json");
    writeFileSync(file, "[]");
    expect(() => loadReservedClasses(file)).toThrow(/non-empty array/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadReservedClasses throws on an object-shaped list", () => {
  const dir = mkdtempSync(join(tmpdir(), "reserved-object-"));
  try {
    const file = join(dir, "reserved-classes.json");
    writeFileSync(file, '{"classes": ["alert"]}');
    expect(() => loadReservedClasses(file)).toThrow(/non-empty array/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadReservedClasses throws on a non-string entry", () => {
  const dir = mkdtempSync(join(tmpdir(), "reserved-typed-"));
  try {
    const file = join(dir, "reserved-classes.json");
    writeFileSync(file, JSON.stringify(["alert", 42]));
    expect(() => loadReservedClasses(file)).toThrow(/non-string entry/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
