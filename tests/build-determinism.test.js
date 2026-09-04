/*
 * What this proves, and what it cannot.
 *
 * Two builds in the same process on the same tree with the same bun: identical
 * bytes, no debugId, no sourceMappingURL. That is same-run reproducibility, so
 * it catches a nondeterministic bundler input — a hash seed, a timestamp, a
 * directory-order dependency.
 *
 * It is blind to drift *between* toolchain versions, because both builds are
 * produced by the toolchain currently installed. `check:sync` is blind to the
 * same thing for the same reason: it compares files inside one tree. Nothing in
 * the pipeline asserts that bun 1.4.1 and bun 1.5 emit the same bundle, and
 * they do not have to — the minifier changed the bytes between 0.6.0 and 0.7.0
 * with no source change.
 *
 * Two things cover that instead, both outside the test suite: `packageManager`
 * in package.json pins the version, and `dist/` is committed, so a toolchain
 * upgrade shows up as a reviewable diff rather than as a silent rebuild. If
 * `dist/` ever stops being committed, that second half is gone and this note
 * becomes a real gap.
 */
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
