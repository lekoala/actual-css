/*
 * Single-entry release: `bun run release minor|patch|major`.
 *
 * package.json#version is the only version source. Everything else is
 * derived: CDN pins move to the new minor, [Unreleased] is dated, artifacts
 * rebuild through build:all, and the version commit plus the bare tag follow
 * the .npmrc shape (no `v` prefix, message is the bare version).
 *
 * Pushing stays manual — pushing the tag is what publishes the GitHub
 * release (CI job `release`). After the script, preview with
 * `bun run release:notes`, then push the branch and the tag to the branch's
 * upstream remote (the script prints the exact command).
 *
 * Usage:
 *   bun run release minor   # 0.11.0 -> 0.12.0 (pins move to @0.12)
 *   bun run release patch   # 0.11.0 -> 0.11.1 (pins unchanged)
 *   bun run release major   # 0.11.0 -> 1.0.0
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { minorOf } from "./utils/cdn.js";

const ROOT = join(import.meta.dirname, "..");

/* The same file set check:docs gates for pins: README, llms.txt, the docs
   pages, and skills. check:docs stays authoritative; this list only writes
   what it reads. */
const SCAN_FILES = [join(ROOT, "README.md"), join(ROOT, "llms.txt")];
const SCAN_DIRS = [join(ROOT, "docs", "pages"), join(ROOT, "skills")];

function fail(message) {
  console.error(`release: ${message}`);
  process.exit(1);
}

function run(command, args) {
  execFileSync(command, args, { cwd: ROOT, stdio: "inherit" });
}

function git(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function collectMarkdown(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectMarkdown(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function bump(version, level) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
    fail(`cannot bump non-semver version "${version}".`);
  }
  const [major, minor, patch] = parts;
  if (level === "major") return `${major + 1}.0.0`;
  if (level === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const level = process.argv[2];
if (!["patch", "minor", "major"].includes(level)) {
  fail("usage: bun run release <patch|minor|major>.");
}

/* `npm version` demands this too: the version commit must hold the release. */
if (git("status", "--porcelain") !== "") {
  fail("worktree not clean — commit or stash first.");
}

const pkgPath = join(ROOT, "package.json");
const pkgRaw = readFileSync(pkgPath, "utf8");
const current = JSON.parse(pkgRaw).version;
const next = bump(current, level);
const oldMinor = minorOf(current);
const newMinor = minorOf(next);

if (oldMinor !== newMinor) {
  const oldPin = `actual-css@${oldMinor}`;
  let files = 0;
  let pins = 0;
  for (const file of [...SCAN_FILES, ...SCAN_DIRS.flatMap((dir) => collectMarkdown(dir))]) {
    const text = readFileSync(file, "utf8");
    if (!text.includes(oldPin)) continue;
    writeFileSync(file, text.replaceAll(oldPin, `actual-css@${newMinor}`));
    files += 1;
    pins += text.split(oldPin).length - 1;
  }
  console.log(`release: moved ${pins} pin(s) in ${files} file(s) to @${newMinor}.`);
}

/* Date [Unreleased], unless the target section is already dated (replay). */
const changelogPath = join(ROOT, "CHANGELOG.md");
const changelog = readFileSync(changelogPath, "utf8");
const datedTarget = new RegExp(
  `^## \\[${next.replace(/\./g, "\\.")}\\] - \\d{4}-\\d{2}-\\d{2}`,
  "m",
);
if (datedTarget.test(changelog)) {
  console.log(`release: CHANGELOG [${next}] already dated.`);
} else {
  const body = /^## \[Unreleased\]\s*\n([\s\S]*?)(?=^## )/m.exec(changelog)?.[1] ?? "";
  if (!body.trim()) fail("CHANGELOG.md has no non-empty [Unreleased] section to date.");
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(
    changelogPath,
    changelog.replace(/^## \[Unreleased\]\s*\n/m, `## [Unreleased]\n\n## [${next}] - ${today}\n`),
  );
  console.log(`release: dated CHANGELOG [${next}] ${today}.`);
}

/* String replace keeps package.json formatting byte-identical otherwise. */
if (!pkgRaw.includes(`"version": "${current}"`)) fail("package.json version field not found.");
writeFileSync(pkgPath, pkgRaw.replace(`"version": "${current}"`, `"version": "${next}"`));

run("bun", ["run", "build:all"]);
run("bun", ["run", "release:notes"]);

run("git", ["add", "-A"]);
console.log(git("status", "--porcelain"));
run("git", ["commit", "-m", next]);
run("git", ["tag", next]);
/* Read, never assumed: a hard-coded `origin main` named a mirror remote and a
   branch this repository does not have, so the tag never reached GitHub. */
const branch = git("rev-parse", "--abbrev-ref", "HEAD");
let remote = "";
try {
  remote = git("config", `branch.${branch}.remote`);
} catch {}
console.log(
  remote
    ? `release: committed and tagged ${next} — preview above, then: git push ${remote} ${branch} ${next}`
    : `release: committed and tagged ${next} — ${branch} has no upstream; push it and the tag ${next} to the GitHub remote.`,
);
