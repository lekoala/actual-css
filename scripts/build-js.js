import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

export const ENTRY = join(ROOT, "src", "js", "index.js");
export const FULL_ENTRY = join(ROOT, "src", "js", "full.js");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export async function buildBundle({ entrypoint, naming, outdir = DIST }) {
  const result = await Bun.build({
    entrypoints: [entrypoint],
    outdir,
    minify: true,
    target: "browser",
    naming: `[dir]/${naming}`,
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error(`Bundle failed for ${entrypoint}`);
  }

  return result;
}

async function build() {
  await mkdir(DIST, { recursive: true });

  // clean old JS artifacts only, leave CSS intact
  for (const f of await readdir(DIST)) {
    if (f.endsWith(".js")) {
      await rm(join(DIST, f), { force: true });
    }
  }

  const bundles = [
    { entry: ENTRY, naming: "actual.[ext]" },
    { entry: FULL_ENTRY, naming: "actual.full.[ext]" },
  ];

  for (const { entry, naming } of bundles) {
    await buildBundle({ entrypoint: entry, naming });

    const outName = naming.replace(".[ext]", ".js");
    const path = join(DIST, outName);
    const st = await stat(path);
    const code = await new Response(Bun.file(path)).bytes();
    const brotli = brotliCompressSync(code).length;

    console.log(`Built ${outName} (${formatBytes(st.size)}) — brotli ${formatBytes(brotli)}`);
  }
}

if (import.meta.main) {
  build();
}