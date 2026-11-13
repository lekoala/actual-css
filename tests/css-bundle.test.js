import { afterAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { inlineImports, minifyCss } from "../src/tooling/css-bundle.js";

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

test("inlineImports flattens a layer(name) import into an @layer block", async () => {
  const root = await fixture({
    "entry.css": ["@layer reset, actual, app;", '@import "./core.css" layer(actual);'].join("\n"),
    "core.css": [
      ".base { color: red; }",
      "",
      "@layer overrides {",
      "  .base { color: blue; }",
      "}",
    ].join("\n"),
  });

  const bundled = await inlineImports(join(root, "entry.css"));

  // The layer statement keeps its place, and a layer already inside the
  // imported file becomes a sublayer of the wrapper, as the import did.
  expect(bundled).toBe(
    [
      "@layer reset, actual, app;",
      "@layer actual {",
      "  .base { color: red; }",
      "",
      "  @layer overrides {",
      "    .base { color: blue; }",
      "  }",
      "}",
      "",
    ].join("\n"),
  );
});

test("inlineImports flattens the css/layer entrypoint", async () => {
  const root = await fixture({
    "entry.css": '@import "actual-css/css/layer";\n',
  });

  const bundled = await inlineImports(join(root, "entry.css"));

  expect(bundled).toContain("@layer actual {");
  expect(bundled).toContain("--icon-chevron:");
  expect(bundled).not.toContain("@import");
});

test("inlineImports flattens anonymous layer imports", async () => {
  for (const trailer of ["layer", "layer()"]) {
    const root = await fixture({
      "entry.css": `@import "./core.css" ${trailer};\n`,
      "core.css": ".base { color: red; }\n",
    });

    const bundled = await inlineImports(join(root, "entry.css"));

    expect(bundled, trailer).toBe(["@layer {", "  .base { color: red; }", "}", ""].join("\n"));
  }
});

test("inlineImports rejects conditional import modifiers", async () => {
  const trailers = [
    "supports(display: grid)",
    "screen",
    "layer(actual) supports(display: grid)",
    "layer(actual) screen",
  ];

  for (const trailer of trailers) {
    const root = await fixture({
      "entry.css": `@import "./local.css" ${trailer};\n`,
      "local.css": ".app { color: red; }\n",
    });

    const failure = await inlineImports(join(root, "entry.css")).catch((error) => error);

    expect(failure.message, trailer).toContain("Unsupported CSS @import modifiers");
  }
});

test("inlineImports rejects a remote import inside a layered subtree", async () => {
  const root = await fixture({
    "entry.css": '@import "./core.css" layer(actual);\n',
    "core.css": '@import "https://example.com/fonts.css";\n.base { color: red; }\n',
  });

  // Hoisting the remote import to the top of the bundle would move its rules
  // out of the layer, so the bundler refuses instead of changing meaning.
  const failure = await inlineImports(join(root, "entry.css")).catch((error) => error);

  expect(failure.message).toContain("Remote CSS @import inside a layered import");
});

test("inlineImports reports unresolvable imports without leaking internals", async () => {
  const root = await fixture({
    "entry.css": '@import "not-a-real-package/style.css";\n',
  });

  const failure = await inlineImports(join(root, "entry.css")).catch((error) => error);

  expect(failure.message).toContain('Cannot resolve CSS @import "not-a-real-package/style.css"');
  expect(failure.message).not.toContain("__actual_css_resolve__");
});

// Pass-through contract: the bundler flattens import graphs, it never rewrites
// the CSS language. Each snippet must come out of a real multi-file bundle
// character for character.
async function bundleSnippet(snippet) {
  const root = await fixture({
    "entry.css": '@import "actual-css/css/components/button";\n@import "./modern.css";\n',
    "modern.css": snippet,
  });

  return inlineImports(join(root, "entry.css"));
}

test("bundling preserves cascade layers and @scope", async () => {
  const snippet = [
    "@layer actual, app;",
    "",
    "@layer actual {",
    "  .card { padding: 1rem; }",
    "}",
    "",
    "@scope (.gallery) to (.gallery-item) {",
    "  :scope { display: grid; }",
    "",
    "  img { border-radius: 4px; }",
    "}",
  ].join("\n");

  expect(await bundleSnippet(snippet)).toContain(snippet);
});

test("bundling preserves native nesting", async () => {
  const snippet = [
    ".card {",
    "  color: red;",
    "",
    "  &:hover { color: blue; }",
    "",
    "  & .title { font-weight: 600; }",
    "",
    "  @media (width > 30rem) {",
    "    padding: 2rem;",
    "  }",
    "}",
  ].join("\n");

  expect(await bundleSnippet(snippet)).toContain(snippet);
});

test("bundling preserves container queries", async () => {
  const snippet = [
    ".panel { container: panel / inline-size; }",
    "",
    "@container panel (width > 30rem) {",
    "  .panel-body { display: flex; }",
    "}",
    "",
    "@container (width > 30rem) {",
    "  .panel-title { font-size: 1.5rem; }",
    "}",
  ].join("\n");

  expect(await bundleSnippet(snippet)).toContain(snippet);
});

test("bundling and minifying preserve modern color functions", async () => {
  const declarations = [
    "color: light-dark(#111, #eee);",
    "background: color-mix(in oklab, var(--brand) 60%, canvas);",
    "border-color: oklch(from var(--brand) l c h / 50%);",
    "outline-color: rgb(from var(--brand) r g b / 0.4);",
  ];
  const snippet = [".button {", ...declarations.map((line) => `  ${line}`), "}"].join("\n");

  const bundled = await bundleSnippet(snippet);
  expect(bundled).toContain(snippet);

  // Minifying only collapses comments and whitespace: no color function is
  // downgraded to an srgb fallback on the way out.
  const minified = minifyCss(bundled);
  for (const declaration of declarations) {
    expect(minified).toContain(declaration);
  }
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

test("inlineImports rebases relative url() onto the output directory", async () => {
  const root = await fixture({
    "src/entry.css": '@import "./fonts/sans.css";\n.hero { background: url(img/hero.webp); }\n',
    "src/fonts/sans.css": [
      "@font-face {",
      '  src: url("./files/sans.woff2") format("woff2"),',
      "    url('files/sans.woff?#iefix') format(\"woff\");",
      "}",
    ].join("\n"),
  });

  const bundled = await inlineImports(join(root, "src/entry.css"), {
    outDir: join(root, "public/build"),
  });

  expect(bundled).toContain('url("../../src/fonts/files/sans.woff2")');
  expect(bundled).toContain("url('../../src/fonts/files/sans.woff?#iefix')");
  expect(bundled).toContain("url(../../src/img/hero.webp)");
});

test("inlineImports leaves absolute, data and fragment url() alone", async () => {
  const css = [
    ".a { background: url(data:image/svg+xml,%3Csvg%3E); }",
    '.b { background: url("/fonts/sans.woff2"); }',
    ".c { background: url(https://cdn.example/x.png); }",
    ".d { mask: url(#clip); }",
  ].join("\n");
  const root = await fixture({ "src/entry.css": `${css}\n` });

  const bundled = await inlineImports(join(root, "src/entry.css"), {
    outDir: join(root, "elsewhere"),
  });

  expect(bundled).toBe(`${css}\n`);
});

test("inlineImports leaves the framework's data URIs intact when rebasing", async () => {
  const file = join(ROOT, "src/css/components/rating.css");

  const rebased = await inlineImports(file, { outDir: join(ROOT, "tmp/out") });

  // The outline star clips with url(%23c) inside its quoted data URI.
  expect(rebased).toContain("clip-path='url(%23c)'");
  expect(rebased).toBe(await inlineImports(file));
});

test("inlineImports rebases only url() references, never text that looks like one", async () => {
  const css = [
    '.a::before { content: "url(img/a.png)"; }',
    "/* url(img/b.png) */",
    "/* a comment over",
    "   two lines: url(img/c.png) */",
    ".d { --myurl: myurl(img/d.png); }",
    ".e { background: url(?v=1), url(''); }",
    ".f { background: url(img/f.png); }",
  ].join("\n");
  const root = await fixture({ "src/entry.css": `${css}\n` });

  const bundled = await inlineImports(join(root, "src/entry.css"), {
    outDir: join(root, "public"),
  });

  expect(bundled).toBe(`${css.replace("url(img/f.png)", "url(../src/img/f.png)")}\n`);
});

test("inlineImports quotes a rebased path an unquoted url() could not hold", async () => {
  const root = await fixture({ "my assets/entry.css": ".a { background: url(a.png); }\n" });

  const bundled = await inlineImports(join(root, "my assets/entry.css"), {
    outDir: join(root, "public"),
  });

  expect(bundled).toContain('url("../my assets/a.png")');
});

test("inlineImports refuses url() it cannot rebase faithfully", async () => {
  const escaped = await fixture({ "entry.css": ".a { background: url(a\\ b.png); }\n" });
  const packaged = await fixture({
    "entry.css": '@import "./node_modules/pkg/style.css";\n',
    "node_modules/pkg/style.css": ".a { background: url(./icon.svg); }\n",
  });
  const outDir = { outDir: join(escaped, "public") };

  await expect(inlineImports(join(escaped, "entry.css"), outDir)).rejects.toThrow(
    /Escaped characters/,
  );
  await expect(
    inlineImports(join(packaged, "entry.css"), { outDir: join(packaged, "public") }),
  ).rejects.toThrow(/node_modules stylesheet/);
});

test("the public CLI rebases url() from the --out directory", async () => {
  const root = await fixture({
    "src/entry.css": '@import "./fonts/sans.css";\n',
    "src/fonts/sans.css": '@font-face { src: url("files/sans.woff2"); }\n',
  });
  const out = join(root, "public", "build", "app.css");

  const run = await spawn(
    "node",
    [
      join(ROOT, "src", "cli", "actual-css.js"),
      "bundle",
      join(root, "src/entry.css"),
      "--out",
      out,
    ],
    { cwd: ROOT },
  );

  expect(run.code, run.stderr).toBe(0);
  expect(await readFile(out, "utf8")).toContain('url("../../src/fonts/files/sans.woff2")');
});

test("inlineImports keeps url() as written without an output directory", async () => {
  const root = await fixture({
    "entry.css": '@import "./fonts/sans.css";\n',
    "fonts/sans.css": '@font-face { src: url("./files/sans.woff2"); }\n',
  });

  const bundled = await inlineImports(join(root, "entry.css"));

  expect(bundled).toContain('url("./files/sans.woff2")');
});
