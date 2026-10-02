import { expect, test } from "bun:test";
import { formatContrast } from "../src/tooling/theme-contrast.js";

const row = (soft) => ({
  theme: "probe",
  scheme: "light",
  soft: [{ intent: "primary", ...soft }],
  focusSurface: 3,
  focusSolid: 3,
  invalidFocus: 3,
  inverse: 4.5,
});

// Trap: the resting soft pair was formatted against a threshold of 0, so a
// 1:1 resting ink passed whenever its hovered pair held.
test("a resting soft pair under 4.5:1 counts as a miss", () => {
  expect(formatContrast([row({ rest: 1, hover: 5 })]).misses).toBe(1);
  expect(formatContrast([row({ rest: 5, hover: 1 })]).misses).toBe(1);
  expect(formatContrast([row({ rest: 4.5, hover: 4.5 })]).misses).toBe(0);
});

test("a translucent pair reads n/a and is not a miss", () => {
  const { text, misses } = formatContrast([row({ rest: null, hover: 5 })]);
  expect(misses).toBe(0);
  expect(text).toContain("n/a");
});
