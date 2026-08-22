#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { inlineImports, minifyCss } from "../tooling/css-bundle.js";

function usage() {
  return [
    "actual-css bundle INPUT --out FILE [--minify]",
    "",
    "  -o, --out FILE   write the bundle to FILE (required)",
    "      --minify     collapse comments and whitespace",
    "  -h, --help       show this message",
    "      --version    print the actual-css version",
    "",
    "Bundle plain CSS @import chains from relative files and actual-css/css/* subpaths.",
    "A layer or layer(name) import is flattened into the @layer block it stands for.",
    "Remote imports are kept and hoisted to the top of the bundle.",
    "Leaves modern CSS syntax untouched; this is a bundler, not a transpiler.",
  ].join("\n");
}

async function version() {
  const pkg = await readFile(new URL("../../package.json", import.meta.url), "utf8");
  return JSON.parse(pkg).version;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;

  if (!command || command === "--help" || command === "-h") {
    return { help: true };
  }

  if (command === "--version" || command === "-v") {
    return { version: true };
  }

  if (command !== "bundle") {
    throw new Error(`Unknown command: ${command}`);
  }

  let input = "";
  let out = "";
  let minify = false;

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];

    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }

    if (arg === "--minify") {
      minify = true;
      continue;
    }

    if (arg === "--out" || arg === "-o") {
      const value = rest[i + 1];

      if (!value) {
        throw new Error("Missing value for --out.");
      }

      out = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (input) {
      throw new Error(`Unexpected extra argument: ${arg}`);
    }

    input = arg;
  }

  if (!input) {
    throw new Error("Missing input file.");
  }

  if (!out) {
    throw new Error("Missing required --out FILE option.");
  }

  return { help: false, input, out, minify };
}

async function bundle({ input, out, minify }) {
  const inputPath = resolve(input);
  const outputPath = resolve(out);
  const css = await inlineImports(inputPath);
  const code = minify ? minifyCss(css) : css;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, code);

  console.log(`Bundled ${inputPath} -> ${outputPath}${minify ? " (minified)" : ""}`);
}

async function main() {
  let args;

  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error("");
    console.error(usage());
    process.exit(1);
  }

  if (args.help) {
    console.log(usage());
    return;
  }

  if (args.version) {
    console.log(await version());
    return;
  }

  await bundle(args);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
