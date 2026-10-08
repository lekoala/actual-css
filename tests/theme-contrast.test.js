import { expect, test } from "bun:test";
import { composite, contrast } from "../src/tooling/color.js";
import { formatContrast } from "../src/tooling/theme-contrast.js";

const row = (soft) => ({
  theme: "probe",
  scheme: "light",
  soft: [{ intent: "primary", surface: "surface-subtle", ...soft }],
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

test("selected ink gates text at 4.5:1 and the step ring at 3:1", () => {
  const selected = (kind, min, value) => ({
    ...row({ rest: 5, hover: 5 }),
    selected: [{ kind, surface: "surface-subtle", min, value }],
  });
  expect(formatContrast([selected("tab", 4.5, 4.4)]).misses).toBe(1);
  expect(formatContrast([selected("step ring", 3, 3.2)]).misses).toBe(0);
  expect(formatContrast([selected("step ring", 3, 2.9)]).misses).toBe(1);
});

// A gradient fill has no single color: it is reported n/a, never passed.
test("a solid pair on a gradient fill reads n/a and is not a miss", () => {
  const solid = (value) => ({
    ...row({ rest: 5, hover: 5 }),
    solid: [{ intent: "warning", value }],
  });
  expect(formatContrast([solid(4.2)]).misses).toBe(1);
  const { text, misses } = formatContrast([solid(null)]);
  expect(misses).toBe(0);
  expect(text).toMatch(/warning\s+n\/a/);
});

test("each soft row names the surface it was composited on", () => {
  expect(formatContrast([row({ rest: 5, hover: 5 })]).text).toContain("surface-subtle");
});

// A translucent soft fill has no ratio of its own: the same tint reads
// differently on each surface, so it is measured after compositing.
test("composite() resolves a translucent fill over its backdrop", () => {
  const tint = [0, 0, 255, 51];
  const white = [255, 255, 255, 255];
  const grey = [200, 200, 200, 255];
  expect(composite(tint, white)).toEqual([204, 204, 255, 255]);
  expect(composite(tint, grey)).toEqual([160, 160, 211, 255]);
  expect(composite(white, grey)).toEqual(white);
  expect(() => contrast(tint, white)).toThrow();
  // A translucent backdrop stays translucent, so it is still unmeasurable.
  expect(composite(tint, [255, 255, 255, 128])[3]).toBeLessThan(255);
});
