/*
 * Static JavaScript runtime-floor guard.
 *
 * The JS runtime targets the Degraded tier (Firefox 78+, Safari 14+,
 * Chromium 88+). This test reads the source modules and fails when any of
 * them uses a syntax or API above that floor, so the floor is enforced at
 * test time instead of by eye at each release.
 *
 * Deliberately small and conservative: it scans source text for a banned
 * token set. It does not type-check or parse — a false negative here simply
 * means the floor is enforced by review. The set must stay tiny, otherwise
 * the guard itself becomes a maintenance burden.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "bun:test";

const JS_DIR = join(import.meta.dir, "..", "src", "js");

const BANNED = [
  {
    label: "logical assignment (??=)",
    pattern: /\?\?=|&&=|\|\|=/,
    floor: "Firefox 79+ (logical assignment); floor is Firefox 78",
  },
  {
    label: "Array.prototype.at()",
    pattern: /\.at\(/,
    floor: "Safari 15.4+; floor is Safari 14",
  },
  {
    label: "Object.hasOwn()",
    pattern: /Object\.hasOwn\(/,
    floor: "Safari 15.4+; floor is Safari 14",
  },
];

const files = readdirSync(JS_DIR).filter((name) => name.endsWith(".js"));

test("JS runtime floor: no syntax/API above the Degraded tier", () => {
  const offenders = [];

  for (const file of files) {
    const source = readFileSync(join(JS_DIR, file), "utf8");
    for (const { label, pattern } of BANNED) {
      const match = pattern.exec(source);
      if (match) {
        offenders.push(`${file}: banned ${label} (${match[0].trim()})`);
      }
    }
  }

  if (offenders.length) {
    throw new Error(`JS runtime floor violated:\n${offenders.join("\n")}`);
  }
});

test("compat guard detects each representative banned token", () => {
  const samples = [
    ["logical assignment (??=)", "x ??= 1"],
    ["Array.prototype.at()", "items.at(-1)"],
    ["Object.hasOwn()", "Object.hasOwn(obj, key)"],
  ];
  for (const [label, sample] of samples) {
    const entry = BANNED.find((b) => b.label === label);
    expect(entry, `rule exists for ${label}`).toBeDefined();
    expect(entry.pattern.test(sample), `detects ${label}`).toBe(true);
  }
});
