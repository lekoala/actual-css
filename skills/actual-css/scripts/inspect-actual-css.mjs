#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function exists(file) {
  try {
    return fs.existsSync(file);
  } catch {
    return false;
  }
}

function detectRoot(start = process.cwd()) {
  const explicit = process.env.ACTUAL_CSS_ROOT;
  if (explicit) {
    const root = path.resolve(explicit);
    if (!exists(path.join(root, "package.json"))) {
      throw new Error(`ACTUAL_CSS_ROOT does not contain package.json: ${root}`);
    }
    return root;
  }

  let dir = path.resolve(start);
  while (true) {
    const localPkg = path.join(dir, "package.json");
    if (exists(localPkg)) {
      try {
        const pkg = readJson(localPkg);
        if (pkg.name === "actual-css" && exists(path.join(dir, "components.json"))) {
          return dir;
        }
      } catch {
        // Ignore malformed unrelated package.json files while walking.
      }
    }

    const installed = path.join(dir, "node_modules", "actual-css");
    if (exists(path.join(installed, "package.json"))) {
      return installed;
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage() {
  process.stdout.write(`Actual CSS inspector\n\n`);
  process.stdout.write(`Usage:\n`);
  process.stdout.write(`  inspect-actual-css.mjs --source\n`);
  process.stdout.write(`  inspect-actual-css.mjs <component>\n`);
  process.stdout.write(`  inspect-actual-css.mjs --class <class>\n`);
  process.stdout.write(`  inspect-actual-css.mjs --exports\n`);
  process.stdout.write(`  inspect-actual-css.mjs --enhancements\n`);
  process.stdout.write(`  inspect-actual-css.mjs --list\n\n`);
  process.stdout.write(`Set ACTUAL_CSS_ROOT to inspect a specific checkout/package.\n`);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  usage();
  process.exit(0);
}

const root = detectRoot();
if (!root) {
  fail("Could not find Actual CSS. Run inside its repository/a consuming project or set ACTUAL_CSS_ROOT.");
  process.exit(1);
}

const pkg = readJson(path.join(root, "package.json"));
const componentsPath = path.join(root, "components.json");
const reservedPath = path.join(root, "reserved-classes.json");
const components = exists(componentsPath) ? readJson(componentsPath) : [];
const reservedRaw = exists(reservedPath) ? readJson(reservedPath) : [];
const reserved = Array.isArray(reservedRaw)
  ? reservedRaw
  : Array.isArray(reservedRaw.classes)
    ? reservedRaw.classes
    : Object.keys(reservedRaw);

if (args.length === 0 || args[0] === "--list") {
  print({
    version: pkg.version,
    root,
    components: components.map((item) => item.name),
  });
  process.exit(0);
}

if (args[0] === "--source") {
  print({
    name: pkg.name,
    version: pkg.version,
    root,
    packageJson: path.join(root, "package.json"),
    componentsJson: exists(componentsPath) ? componentsPath : null,
    reservedClassesJson: exists(reservedPath) ? reservedPath : null,
  });
  process.exit(0);
}

if (args[0] === "--exports") {
  print({ version: pkg.version, exports: pkg.exports ?? {} });
  process.exit(0);
}

if (args[0] === "--enhancements") {
  const matches = components
    .filter((item) => item.jsImport || (item.enhancements && item.enhancements.length))
    .map((item) => ({
      name: item.name,
      jsImport: item.jsImport ?? null,
      enhancements: item.enhancements ?? [],
      states: item.states ?? [],
    }));
  print({ version: pkg.version, components: matches });
  process.exit(0);
}

if (args[0] === "--class") {
  const className = (args[1] ?? "").replace(/^\./, "");
  if (!className) {
    fail("--class requires a class name");
    process.exit(1);
  }
  const owners = components
    .filter((item) => (item.classes ?? []).includes(className))
    .map((item) => item.name);
  print({
    version: pkg.version,
    class: className,
    reserved: reserved.includes(className),
    owners,
  });
  process.exit(0);
}

const name = args[0];
const exact = components.find((item) => item.name === name);
if (exact) {
  print({ version: pkg.version, component: exact });
  process.exit(0);
}

const byClass = components.filter((item) => (item.classes ?? []).includes(name));
if (byClass.length) {
  print({ version: pkg.version, query: name, matchedByClass: byClass });
  process.exit(0);
}

fail(`No component or owned class matched: ${name}`);
process.exit(1);
