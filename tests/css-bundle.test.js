import { afterAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { inlineImports } from "../src/tooling/css-bundle.js";

const ROOT = join(import.meta.dir, "..");
const roots = [];

// Fixtures live inside the repo on purpose: bare specifiers such as
// "actual-css/css" then resolve through the package's own exports map, the
// same way they resolve from a consumer's node_modules.
async function fixture(files) {
  const parent = join(ROOT, "tmp");
  await mkdir(parent, { recursive: true });

  const root = await mkdtemp(join(parent, "actual-bundle-"));
  roots.push(root);

  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content);
  }

  return root;
}

async function spawn(cmd, args, opts = {}) {
  const proc = Bun.spawn([cmd, ...args], { stdout: "pipe", stderr: "pipe", ...opts });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  return { code: await proc.exited, stdout, stderr };
}

afterAll(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
});

test("inlineImports resolves Actual CSS subpaths and relative files", async () => {
  const root = await fixture({
    "entry.css": ['@import "actual-css/css";', '@import "./local.css";'].join("\n"),
    "local.css": ".app { color: red; }\n",
  });

  const bundled = await inlineImports(join(root, "entry.css"));

  expect(bundled).toContain(".app { color: red; }");
  expect(bundled).not.toContain('@import "actual-css/css";');
  expect(bundled).not.toContain('@import "./local.css";');
});

test("inlineImports resolves relative files written without a ./ prefix", async () => {
  const root = await fixture({
    "entry.css": '@import "local.css";\n',
    "local.css": ".app { color: red; }\n",
  });

  const bundled = await inlineImports(join(root, "entry.css"));

  expect(bundled).toContain(".app { color: red; }");
  expect(bundled).not.toContain("@import");
});

test("inlineImports keeps imports carrying a trailing comment", async () => {
  const root = await fixture({
    "entry.css": '@import "./local.css";   /* my styles */\n',
    "local.css": ".app { color: red; }\n",
  });

  const bundled = await inlineImports(join(root, "entry.css"));

  expect(bundled).toContain(".app { color: red; }");
  expect(bundled).not.toContain("@import");
});

test("inlineImports hoists preserved remote imports above every rule", async () => {
  const root = await fixture({
    "entry.css": [
      '@import "actual-css/css/components/button";',
      '@import "https://example.com/fonts.css";',
      '@import "./local.css";',
      '@import "./other.css";',
    ].join("\n"),
    "local.css": '@import "https://example.com/fonts.css";\n.app { color: red; }\n',
    "other.css": ".other { color: blue; }\n",
  });

  const bundled = await inlineImports(join(root, "entry.css"));
  const lines = bundled.split("\n");

  // An @import that follows a rule is dropped by browsers, so the surviving
  // statement must lead the bundle — and appear only once.
  expect(lines[0]).toBe('@import "https://example.com/fonts.css";');
  expect(bundled.match(/@import/g)).toHaveLength(1);
  expect(bundled).toContain(".app { color: red; }");
  expect(bundled).toContain(".other { color: blue; }");
});

test("inlineImports keeps @charset ahead of hoisted imports", async () => {
  const root = await fixture({
    "entry.css": [
      '@charset "utf-8";',
      '@import "https://example.com/fonts.css";',
      '@import "./local.css";',
    ].join("\n"),
    "local.css": ".app { color: red; }\n",
  });

  const bundled = await inlineImports(join(root, "entry.css"));

  expect(bundled.startsWith('@charset "utf-8";\n@import "https://example.com/fonts.css";')).toBe(
    true,
  );
});

test("inlineImports rejects modified local imports", async () => {
  const root = await fixture({
    "entry.css": '@import "./local.css" layer(actual);',
    "local.css": ".app { color: red; }\n",
  });

  await expect(inlineImports(join(root, "entry.css"))).rejects.toThrow(
    "Unsupported CSS @import modifiers",
  );
});

test("inlineImports reports unresolvable imports without leaking internals", async () => {
  const root = await fixture({
    "entry.css": '@import "not-a-real-package/style.css";\n',
  });

  const failure = await inlineImports(join(root, "entry.css")).catch((error) => error);

  expect(failure.message).toContain('Cannot resolve CSS @import "not-a-real-package/style.css"');
  expect(failure.message).not.toContain("__actual_css_resolve__");
});

test("the public CLI bundles custom stylesheets", async () => {
  const root = await fixture({
    "entry.css": '@import "actual-css/css/components/button";\n@import "./local.css";\n',
    "local.css": "/* remove me */\n.app { color: red; }\n",
  });
  const out = join(root, "dist", "custom.css");

  const run = await spawn(
    "node",
    [
      join(ROOT, "src", "cli", "actual-css.js"),
      "bundle",
      join(root, "entry.css"),
      "--out",
      out,
      "--minify",
    ],
    { cwd: ROOT },
  );

  expect(run.code, run.stderr).toBe(0);
  expect(run.stdout).toContain("Bundled");

  const bundled = await readFile(out, "utf8");
  expect(bundled).toContain(".app { color: red; }");
  expect(bundled).not.toContain("remove me");
  expect(bundled).not.toContain('@import "./local.css";');
});
