import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
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
  expect(files).toContain("src/cli");
  expect(files).toContain("src/tooling");
  expect(files).not.toContain("src/css/themes");
  expect(files).toContain("scripts/reserved-classes.json");
  expect(files).not.toContain("src/css");
  expect(files).not.toContain("src/css/optional");
  expect(pkg.exports["./reserved-classes.json"]).toBe("./scripts/reserved-classes.json");
  expect(existsSync(join(ROOT, pkg.exports["./reserved-classes.json"]))).toBe(true);
  expect(pkg.bin["actual-css"]).toBe("./src/cli/actual-css.js");
  expect(existsSync(join(ROOT, pkg.bin["actual-css"]))).toBe(true);

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

/*
 * End-to-end packaging check: actually pack the package (npm pack honors the
 * `files` allowlist and runs no prepublishOnly), then inspect the tarball for
 * the files backing the critical public exports. This guards the real
 * distribution, not just the package.json manifest.
 */
async function spawn(cmd, args, opts = {}) {
  const proc = Bun.spawn([cmd, ...args], { stdout: "pipe", stderr: "pipe", ...opts });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  return { code: await proc.exited, stdout, stderr };
}

let packTools;
async function packAvailable() {
  if (packTools !== undefined) return packTools;
  try {
    const npm = await spawn("npm", ["--version"]);
    const tar = await spawn("tar", ["--version"]);
    packTools = npm.code === 0 && tar.code === 0;
  } catch {
    packTools = false;
  }
  return packTools;
}

const packTest = (await packAvailable()) ? test : test.skip;

packTest("packed tarball ships every critical public export", async () => {
  const dir = mkdtempSync(join(tmpdir(), "actual-pack-"));
  try {
    const pack = await spawn("npm", ["pack", "--pack-destination", dir], { cwd: ROOT });
    expect(pack.code, `npm pack failed:\n${pack.stderr}`).toBe(0);

    const tarball = readdirSync(dir).find((file) => file.endsWith(".tgz"));
    expect(tarball, "npm pack must produce a tarball").toBeTruthy();

    // Relative name plus cwd: GNU tar reads an absolute Windows path
    // ("C:\...") as a remote host spec and refuses to open it.
    const list = await spawn("tar", ["-tzf", tarball], { cwd: dir });
    expect(list.code, `tar must list the tarball:\n${list.stderr}`).toBe(0);
    const entries = list.stdout.split(/\r?\n/);

    const critical = [
      "package/dist/actual.css", // actual-css
      "package/dist/actual.full.css", // actual-css/full
      "package/dist/actual.js", // actual-css/js
      "package/dist/actual.full.js", // actual-css/js/full
      "package/src/cli/actual-css.js", // actual-css bin
      "package/src/css/layout/index.css", // actual-css/css/layout
      "package/src/css/layout/column-layout.css", // actual-css/css/layout/column-layout
      "package/src/tooling/css-bundle.js", // shared bundler for CLI and build scripts
      "package/scripts/reserved-classes.json", // actual-css/reserved-classes.json
    ];
    for (const entry of critical) {
      expect(entries, `tarball must contain ${entry}`).toContain(entry);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// The CLI is only useful if bare specifiers resolve from an installed package:
// inside the repo they would resolve by self-reference, which proves nothing
// about what `files` and `exports` actually publish.
packTest("the packed CLI bundles a consumer stylesheet from node_modules", async () => {
  const dir = mkdtempSync(join(tmpdir(), "actual-consumer-"));
  try {
    const pack = await spawn("npm", ["pack", "--pack-destination", dir], { cwd: ROOT });
    expect(pack.code, `npm pack failed:\n${pack.stderr}`).toBe(0);

    const tarball = readdirSync(dir).find((file) => file.endsWith(".tgz"));
    expect(tarball, "npm pack must produce a tarball").toBeTruthy();

    const modules = join(dir, "node_modules");
    mkdirSync(modules, { recursive: true });
    const extract = await spawn("tar", ["-xzf", tarball, "-C", "node_modules"], { cwd: dir });
    expect(extract.code, `tar failed:\n${extract.stderr}`).toBe(0);
    renameSync(join(modules, "package"), join(modules, "actual-css"));

    writeFileSync(
      join(dir, "entry.css"),
      [
        '@import "actual-css/css" layer(actual);',
        '@import "actual-css/css/components/button" layer(actual);',
        '@import "https://example.com/fonts.css";',
        '@import "app.css";',
        '@import "./theme.css";   /* project theme */',
      ].join("\n"),
    );
    writeFileSync(join(dir, "app.css"), ".app { color: red; }\n");
    writeFileSync(join(dir, "theme.css"), ":root { --brand: teal; }\n");

    const run = await spawn(
      "node",
      [
        join(modules, "actual-css", "src", "cli", "actual-css.js"),
        "bundle",
        "entry.css",
        "--out",
        join(dir, "out", "bundle.css"),
      ],
      { cwd: dir },
    );
    expect(run.code, `CLI failed:\n${run.stderr}`).toBe(0);

    const bundled = readFileSync(join(dir, "out", "bundle.css"), "utf8");
    expect(bundled.split("\n")[0]).toBe('@import "https://example.com/fonts.css";');
    expect(bundled.match(/@import/g), "only the remote import may survive").toHaveLength(1);
    expect(bundled).toContain(".app { color: red; }");
    expect(bundled).toContain("--brand: teal;");
    expect(bundled).toContain("@layer actual {");
    expect(bundled).toContain(".btn");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
