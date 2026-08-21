import { afterAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { analyzeCss } from "../scripts/check-css-architecture.js";

const roots = [];

async function fixture(files) {
  const root = await mkdtemp(join(tmpdir(), "actual-arch-"));
  roots.push(root);
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content);
  }
  return root;
}

const FULL_CSS = [
  '@import "./actual.css";',
  '@import "./typography/index.css";',
  '@import "./layout/index.css";',
  '@import "./forms/index.css";',
  '@import "./components/index.css";',
  '@import "./effects/index.css";',
  '@import "./utilities/index.css";',
].join("\n");

const base = {
  "actual.css": '@import "./core/index.css";',
  "actual.full.css": FULL_CSS,
  "core/index.css": '@import "./reset.css";',
  "core/reset.css": "",
  "typography/index.css": '@import "./prose.css";',
  "typography/prose.css": "",
  "layout/index.css": '@import "./stack.css";',
  "layout/stack.css": "",
  "forms/index.css": '@import "./base.css";',
  "forms/base.css": '@import "./control.css";',
  "forms/control.css": "",
  "components/index.css": '@import "./button.css";',
  "components/button.css": "",
  "effects/index.css": '@import "./aura.css";',
  "effects/aura.css": "",
  "utilities/index.css": '@import "./base.css";',
  "utilities/base.css": "",
};

test("a conforming tree has no issues", async () => {
  const issues = await fixture(base)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues).toEqual([]);
});

test("a family leaf missing from the full bundle is reported", async () => {
  const files = { ...base, "layout/grid.css": "" };
  const issues = await fixture(files)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues.join("\n")).toContain("layout/grid.css: missing from the actual.full.css bundle");
});

test("a leaf imported twice is reported", async () => {
  const files = {
    ...base,
    "layout/index.css": '@import "./stack.css";\n@import "./stack.css";',
  };
  const issues = await fixture(files)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues.join("\n")).toContain("layout/stack.css: appears 2 times");
});

test("a family manifest importing outside its directory is reported", async () => {
  const files = {
    ...base,
    "layout/index.css": '@import "./cluster.css";',
    "layout/cluster.css": "",
    "components/index.css": '@import "../layout/stack.css";',
  };
  const issues = await fixture(files)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues.join("\n")).toContain("components/index.css: imports outside its directory");
});

test("an optional directory is reported", async () => {
  const files = { ...base, "optional/index.css": '@import "./widget.css";' };
  const issues = await fixture(files)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues.join("\n")).toContain("optional");
});

test("a class selector in core/print.css is reported", async () => {
  const files = {
    ...base,
    "core/index.css": '@import "./reset.css";\n@import "./print.css";',
    "core/print.css": ":root, body { margin: 0 }\n.foo { color: #fff }",
  };
  const issues = await fixture(files)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues.join("\n")).toContain("core/print.css contains a class or id selector");
});

test("a generic core/print.css passes", async () => {
  const files = {
    ...base,
    "core/index.css": '@import "./reset.css";\n@import "./print.css";',
    "core/print.css": "@media print {\n  :root, body { margin: 0 }\n}",
  };
  const issues = await fixture(files)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues).toEqual([]);
});

test("an import in a leaf module is reported", async () => {
  const files = { ...base, "core/reset.css": '@import "./tokens.css";' };
  const issues = await fixture(files)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues.join("\n")).toContain("core/reset.css: leaf modules cannot import");
});

test("a utilities/base.css leaf that imports is reported", async () => {
  const files = { ...base, "utilities/base.css": '@import "./spacing.css";' };
  const issues = await fixture(files)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues.join("\n")).toContain("utilities/base.css: leaf modules cannot import");
});

test("a leaf importing with a layer() modifier is still reported", async () => {
  const files = { ...base, "layout/stack.css": '@import "./cluster.css" layer(layout);' };
  const issues = await fixture(files)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues.join("\n")).toContain("layout/stack.css: leaf modules cannot import");
});

test("a manifest importing with layer() is still parsed into the graph", async () => {
  const files = { ...base, "layout/index.css": '@import "./stack.css" layer(layout);' };
  const issues = await fixture(files)
    .then(analyzeCss)
    .then((r) => r.issues);
  expect(issues).toEqual([]);
});

afterAll(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
});
