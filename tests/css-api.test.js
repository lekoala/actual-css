import { expect, test } from "bun:test";
import { join } from "node:path";
import { analyzeCss } from "../scripts/check-css-api.js";

const fixture = (name) => join(import.meta.dir, "fixtures", "css-api", name);

test("classifying the hook as public satisfies the core contract", () => {
  const { issues } = analyzeCss(fixture("fallback-theme-only-public-pass"));
  expect(issues).toEqual([]);
});

test("a theme header cannot satisfy the core fallback-only guard", () => {
  const { issues } = analyzeCss(fixture("fallback-theme-only-fail"));
  expect(issues.some((issue) => issue.includes("--example-hook"))).toBe(true);
});

test("a theme-private fallback-only use does not fail the core contract", () => {
  const { issues } = analyzeCss(fixture("theme-private-fallback-pass"));
  expect(issues).toEqual([]);
});
