import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

function readJson(path) {
  return JSON.parse(readFileSync(join(ROOT, path), "utf8"));
}

function exportTarget(spec, exact, wildcards) {
  if (exact[spec]) return exact[spec];
  const matches = wildcards
    .filter(([key]) => {
      const [prefix, suffix] = key.split("*");
      return spec.startsWith(prefix) && spec.endsWith(suffix);
    })
    .sort(([a], [b]) => b.replace("*", "").length - a.replace("*", "").length);
  if (matches.length === 0) return null;
  const [key, target] = matches[0];
  const [prefix, suffix] = key.split("*");
  return target.replace("*", spec.slice(prefix.length, spec.length - suffix.length));
}

test("package ships built assets, not theme demo sources", () => {
  const pkg = readJson("package.json");
  const files = pkg.files;

  expect(files).toContain("dist");
  expect(files).toContain("src/css/*.css");
  expect(files).toContain("src/css/core");
  expect(files).toContain("src/css/layout");
  expect(files).toContain("src/css/typography");
  expect(files).toContain("src/css/forms");
  expect(files).toContain("src/css/components");
  expect(files).toContain("src/css/effects");
  expect(files).toContain("src/css/utilities");
  expect(files).not.toContain("src/css/themes");
  expect(files).toContain("scripts/reserved-classes.json");
  expect(files).not.toContain("src/css");
  expect(files).not.toContain("src/css/optional");
  expect(pkg.exports["./reserved-classes.json"]).toBe("./scripts/reserved-classes.json");
  expect(existsSync(join(ROOT, pkg.exports["./reserved-classes.json"]))).toBe(true);

  // The preset palettes are reference/demo material, not importable
  // entrypoints and not shipped sources: the theme contract is the
  // deliverable. Asserted so restoring either has to be a deliberate change.
  expect(pkg.exports["./css/themes"]).toBeNull();
  expect(pkg.exports["./css/themes/*"]).toBeNull();
});

test("dist contains exactly the six published artifacts", () => {
  const files = readdirSync(join(ROOT, "dist")).sort();
  expect(files).toEqual([
    "actual.css",
    "actual.full.css",
    "actual.full.js",
    "actual.full.min.css",
    "actual.js",
    "actual.min.css",
  ]);
});

test("every JS export path resolves to an existing source file", () => {
  const pkg = readJson("package.json");

  for (const [exportPath, target] of Object.entries(pkg.exports)) {
    if (target === null) continue;
    if (!(exportPath === "./js" || exportPath.startsWith("./js/"))) continue;

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

test("every CSS family leaf resolves through an export", () => {
  const pkg = readJson("package.json");
  const exact = {};
  const wildcards = [];
  for (const [exportPath, target] of Object.entries(pkg.exports)) {
    if (target === null || !exportPath.startsWith("./css")) continue;
    if (exportPath.includes("*")) wildcards.push([exportPath, target]);
    else exact[exportPath] = target;
  }

  const cssDir = join(ROOT, "src", "css");
  for (const family of ["layout", "typography", "forms", "components", "effects", "utilities"]) {
    const dir = join(cssDir, family);
    for (const entry of readdirSync(dir)) {
      if (!entry.endsWith(".css")) continue;
      const basename = entry.replace(/\.css$/, "");
      const spec = `./css/${family}/${basename}`;
      const target = exportTarget(spec, exact, wildcards);
      expect(target, `${spec} must resolve through an export`).toBeTruthy();
      expect(existsSync(join(ROOT, target)), `${spec} must resolve to an existing file`).toBe(true);
    }
  }
});

test("every public CSS wildcard export matches existing files", () => {
  const pkg = readJson("package.json");

  for (const [exportPath, target] of Object.entries(pkg.exports)) {
    if (target === null || !exportPath.startsWith("./css")) continue;
    if (!exportPath.includes("*")) continue;

    const [prefix, suffix] = exportPath.split("*");
    const [targetPrefix, targetSuffix] = target.split("*");
    const dir = join(ROOT, targetPrefix);
    expect(existsSync(dir), `directory for ${exportPath} must exist`).toBe(true);

    const files = readdirSync(dir).filter((file) => file.endsWith(targetSuffix));
    expect(files.length, `${exportPath} must match at least one file`).toBeGreaterThan(0);

    for (const file of files) {
      const basename = file.slice(0, -targetSuffix.length);
      const spec = `${prefix}${basename}${suffix}`;
      const resolved = join(ROOT, `${targetPrefix}${basename}${targetSuffix}`);
      expect(existsSync(resolved), `${spec} must resolve to an existing file`).toBe(true);
    }
  }
});

test("the js entry split keeps the loader and built-ins separate", () => {
  const indexJs = readFileSync(join(ROOT, "src/js/index.js"), "utf8");
  const fullJs = readFileSync(join(ROOT, "src/js/full.js"), "utf8");
  const imports = (src) =>
    [...src.matchAll(/import\s+(?:[^"']+\s+from\s+)?["']([^"']+)["']/g)].map((match) => match[1]);

  expect(imports(indexJs)).toEqual(["./enhancement-loader.js"]);

  const builtins = [
    "./flyout.js",
    "./context-menu.js",
    "./dialog.js",
    "./dismiss.js",
    "./tab.js",
    "./tooltip.js",
    "./scrollspy.js",
    "./filter.js",
    "./mask.js",
    "./password.js",
    "./validation.js",
    "./status.js",
  ];
  const fullImports = imports(fullJs);
  expect(fullImports.slice(0, -1)).toEqual(builtins);
  expect(fullImports.at(-1)).toBe("./index.js");
});
