#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { inlineImports, minifyCss } from "../tooling/css-bundle.js";

function usage() {
  return [
    "actual-css bundle INPUT --out FILE [--minify]",
    "actual-css design [--theme FILE] [--name NAME] --out DIR",
    "actual-css contrast [--theme FILE] [--name NAME]",
    "",
    "  -o, --out FILE   write the bundle to FILE / the export to DIR (required)",
    "      --minify     collapse comments and whitespace",
    "      --theme FILE read this [data-theme] file instead of the default theme",
    "      --name NAME  the data-theme name, when the file declares several",
    "  -h, --help       show this message",
    "      --version    print the actual-css version",
    "",
    "bundle: flatten plain CSS @import chains from relative files and actual-css/css/*",
    "subpaths. A layer or layer(name) import is flattened into the @layer block it",
    "stands for. Remote imports are kept and hoisted to the top of the bundle.",
    "Leaves modern CSS syntax untouched; this is a bundler, not a transpiler.",
    "",
    "design: export a theme's tokens for Figma and Penpot, plus Button, Input, Badge,",
    "Alert and Card measured in headless Chrome and a Penpot plugin that builds them.",
    "Needs Bun (bunx --bun actual-css design ...).",
    "",
    "contrast: measure the pairs a theme tunes by hand in headless Chrome, in every",
    "scheme it declares: soft ink on its resting and hovered fill, the focus line on",
    "--surface and --surface-solid, the invalid-field focus line, and the inverse",
    "text. Exits 1 when a pair misses its threshold. Needs Bun (bunx --bun actual-css",
    "contrast ...).",
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

  if (command === "design" || command === "contrast") {
    return parseThemeArgs(command, rest);
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

  return { help: false, command: "bundle", input, out, minify };
}

function parseThemeArgs(command, rest) {
  const options = { help: false, command, themeFile: null, name: null, out: "" };
  const valued = { "--theme": "themeFile", "--name": "name" };
  if (command === "design") Object.assign(valued, { "--out": "out", "-o": "out" });

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--help" || arg === "-h") return { help: true };
    const key = valued[arg];
    if (!key) throw new Error(`Unknown option: ${arg}`);
    const value = rest[i + 1];
    if (!value) throw new Error(`Missing value for ${arg}.`);
    options[key] = value;
    i += 1;
  }

  if (command === "design" && !options.out) throw new Error("Missing required --out DIR option.");
  return options;
}

/* Checked before the tooling import: under Node those modules do not even
   parse (`await using`), and `bundle` must stay usable there. The shebang is
   Node for that reason, so plain `bunx` honors it and lands here: --bun is
   what makes Bun run the script. */
function requireBun(command) {
  if (typeof Bun === "undefined") {
    throw new Error(
      `actual-css ${command} needs Bun: it reads the theme in headless Chrome through Bun.WebView. Run it with bunx --bun actual-css ${command} ...`,
    );
  }
}

async function design({ themeFile, name, out }) {
  requireBun("design");
  const { exportDesign } = await import("../tooling/design-export.js");
  const written = await exportDesign({ themeFile, name, out: resolve(out) });
  console.log(`Exported ${written.length} files to ${resolve(out)}`);
}

async function contrast({ themeFile, name }) {
  requireBun("contrast");
  const { formatContrast, measureThemeFile } = await import("../tooling/theme-contrast.js");
  const { text, misses } = formatContrast(await measureThemeFile({ themeFile, name }));
  console.log(text);
  if (misses > 0) {
    console.error(`\n${misses} pair${misses === 1 ? "" : "s"} under threshold.`);
    process.exitCode = 1;
  }
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

  const commands = { bundle, contrast, design };
  await commands[args.command](args);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
