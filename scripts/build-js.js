import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync } from "node:zlib";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const ENTRY = join(ROOT, "src", "js", "index.js");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function build() {
  await mkdir(DIST, { recursive: true });

  // clean old JS artifacts only, leave CSS intact
  if (existsSync(DIST)) {
    for (const f of await readdir(DIST)) {
      if (f.endsWith(".js") || f.endsWith(".js.map")) {
        await rm(join(DIST, f), { force: true });
      }
    }
  }

  await buildEntry(ENTRY, "actual.[ext]");
}

async function buildEntry(entrypoint, naming) {
  const result = await Bun.build({
    entrypoints: [entrypoint],
    outdir: DIST,
    minify: true,
    target: "browser",
    naming: `[dir]/${naming}`,
    sourcemap: "external",
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }

  const file = naming.replace("[ext]", "js");
  const path = join(DIST, file);
  const st = await stat(path);
  const code = await new Response(Bun.file(path)).bytes();
  const brotli = brotliCompressSync(code).length;

  console.log(`Built ${file} (${formatBytes(st.size)}) — brotli ${formatBytes(brotli)}`);
}

build();
