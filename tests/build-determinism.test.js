import { afterAll, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildBundle, ENTRY } from "../scripts/build-js.js";

const dirs = [];

async function buildOnce() {
  const dir = await mkdtemp(join(tmpdir(), "actual-build-"));
  dirs.push(dir);
  await buildBundle({ entrypoint: ENTRY, naming: "actual.[ext]", outdir: dir });
  return readFile(join(dir, "actual.js"), "utf8");
}

afterAll(async () => {
  await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

test("the JS bundle build is byte-deterministic", async () => {
  const first = await buildOnce();
  const second = await buildOnce();

  expect(first.length).toBeGreaterThan(1000);
  expect(second).toBe(first);
  expect(first).not.toContain("debugId");
  expect(first).not.toContain("sourceMappingURL");
});
