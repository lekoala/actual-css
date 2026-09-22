/*
 * Print the changelog section for a released version, for `gh release create
 * --notes-file`. Run it before pushing a tag to read exactly what the release
 * page will say:
 *
 *   bun run release:notes          # the version in package.json
 *   bun run release:notes 0.9.2
 *
 * It is also the release guard: a tag whose version is not in package.json, or
 * whose changelog section is missing, still sitting under [Unreleased] or
 * undated, fails here instead of producing an empty GitHub release.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function fail(message) {
  console.error(`release-notes: ${message}`);
  process.exit(1);
}

const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
const version = process.argv[2]?.trim() || pkg.version;

/* Release tags carry no v prefix, so a `v0.9.2` tag is a mistake worth naming
   rather than silently trimming. */
if (version !== pkg.version) {
  fail(`version ${version} does not match package.json (${pkg.version}).`);
}

const changelog = await readFile(join(ROOT, "CHANGELOG.md"), "utf8");
const heading = new RegExp(
  `^## \\[${version.replace(/\./g, "\\.")}\\] - (\\d{4}-\\d{2}-\\d{2})\\s*$`,
  "m",
);
const match = heading.exec(changelog);

if (!match) {
  fail(`CHANGELOG.md has no dated "## [${version}] - YYYY-MM-DD" section.`);
}

const body = changelog
  .slice(match.index + match[0].length)
  .split(/^## /m)[0]
  .trim();

if (!body) {
  fail(`the [${version}] changelog section is empty.`);
}

console.log(body);
