import { chmodSync } from "node:fs";

const current = Bun.spawnSync(["git", "config", "--get", "core.hooksPath"]);
if (current.exitCode !== 0 && current.exitCode !== 1) {
  console.error(current.stderr.toString());
  process.exit(1);
}
const hooksPath = current.stdout.toString().trim();
if (hooksPath && hooksPath !== ".githooks") {
  console.error(`Hooks already configured at ${hooksPath}; integrate .githooks/commit-msg there.`);
  process.exit(1);
}

// Git ignores non-executable hooks on Unix, including fresh Windows-authored checkouts.
chmodSync(new URL("../.githooks/commit-msg", import.meta.url), 0o755);
const result = Bun.spawnSync(["git", "config", "--local", "core.hooksPath", ".githooks"]);
if (result.exitCode !== 0) {
  console.error(result.stderr.toString());
  process.exit(1);
}
console.log("Git hooks installed: commit messages cannot contain Co-Authored-By lines.");
