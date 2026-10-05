import { afterAll, expect, test } from "bun:test";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

mkdirSync("tmp", { recursive: true });
const directory = mkdtempSync(resolve("tmp/commit-hook-"));
mkdirSync(join(directory, "scripts"));
copyFileSync("scripts/check-commit-message.js", join(directory, "scripts/check-commit-message.js"));
const hooksPath = resolve(".githooks");
chmodSync(join(hooksPath, "commit-msg"), 0o755);
function git(args) {
  return Bun.spawnSync(
    [
      "git",
      "-c",
      `core.hooksPath=${hooksPath}`,
      "-c",
      "user.name=Hook Test",
      "-c",
      "user.email=hook@example.com",
      ...args,
    ],
    { cwd: directory },
  );
}
expect(git(["init"]).exitCode).toBe(0);
afterAll(() => rmSync(directory, { recursive: true, force: true }));

test("Git accepts ordinary messages and rejects co-author lines without creating a commit", () => {
  const accepted = git([
    "commit",
    "--allow-empty",
    "-m",
    "Mention co-authored-by in ordinary prose",
  ]);
  expect(accepted.exitCode).toBe(0);
  const head = git(["rev-parse", "HEAD"]).stdout.toString();
  for (const credit of [
    "Co-Authored-By: Claude <noreply@anthropic.com>",
    "  co-authored-by : Another Author <author@example.com>",
  ]) {
    const rejected = git(["commit", "--allow-empty", "-m", `Fix something\r\n\r\n${credit}`]);
    expect(rejected.exitCode).not.toBe(0);
    expect(rejected.stderr.toString()).toContain("Commit rejected:");
    expect(git(["rev-parse", "HEAD"]).stdout.toString()).toBe(head);
  }
});
