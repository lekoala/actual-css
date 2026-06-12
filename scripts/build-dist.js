import { mkdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENTRY = join(ROOT, "src", "actual.css");
const DIST = join(ROOT, "dist");

async function build({ minify, naming }) {
  const result = await Bun.build({
    entrypoints: [ENTRY],
    outdir: DIST,
    target: "browser",
    minify,
    naming,
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    throw new Error("Build failed");
  }

  return result.outputs[0].path;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  if (existsSync(DIST)) {
    await rm(DIST, { recursive: true, force: true });
  }
  await mkdir(DIST, { recursive: true });

  const devPath = await build({ minify: false, naming: "[name].[ext]" });
  const minPath = await build({ minify: true, naming: "[name].min.[ext]" });

  const [devStat, minStat] = await Promise.all([stat(devPath), stat(minPath)]);
  const ratio = ((1 - minStat.size / devStat.size) * 100).toFixed(1);

  console.log(`Built ${devPath} (${formatBytes(devStat.size)})`);
  console.log(`Built ${minPath} (${formatBytes(minStat.size)}) — ${ratio}% smaller`);
}

main();
