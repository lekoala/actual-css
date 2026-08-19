import { expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

function readJson(path) {
  return JSON.parse(readFileSync(join(ROOT, path), "utf8"));
}

test("package ships built assets and theme reference sources", () => {
  const pkg = readJson("package.json");
  const files = pkg.files;

  expect(files).toContain("dist");
  expect(files).toContain("src/css/*.css");
  expect(files).toContain("src/css/components");
  expect(files).toContain("src/css/forms");
  expect(files).toContain("src/css/optional");
  expect(files).toContain("src/css/themes");
  expect(files).not.toContain("src/css");
});

test("dist directory exists and contains actual.min.css", () => {
  expect(existsSync(join(ROOT, "dist", "actual.min.css"))).toBe(true);
});

test("every JS export path resolves to an existing source file", () => {
  const pkg = readJson("package.json");

  for (const [exportPath, target] of Object.entries(pkg.exports)) {
    if (target === null) continue;
    if (!exportPath.startsWith("./js/")) continue;

    const filePath = join(ROOT, target);
    expect(existsSync(filePath)).toBe(true);
  }
});

test("every non-null CSS export path resolves to an existing source file", () => {
  const pkg = readJson("package.json");

  for (const [exportPath, target] of Object.entries(pkg.exports)) {
    if (target === null) continue;
    if (!exportPath.startsWith("./css")) continue;
    // Skip glob patterns like ./css/* and ./css/themes/*
    if (exportPath.includes("*")) continue;

    const filePath = join(ROOT, target);
    expect(existsSync(filePath)).toBe(true);
  }
});

test("no demo or template file is present in the dist directory", () => {
  const distDir = join(ROOT, "dist");
  const files = readdirSync(distDir);
  const demoFiles = files.filter((f) => f.includes("demo") || f.includes("kitchen") || f.includes("template"));
  expect(demoFiles.length).toBe(0);
});
