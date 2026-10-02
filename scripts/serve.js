/*
 * Static server for the repository, so a demo page can be opened from another
 * machine or a remote browser service. Serves files as they are on disk — no
 * build step, no watch, no transform.
 *
 * Usage:
 *   bun scripts/serve.js [--port 3000] [--cors]
 *
 * --cors lets another origin read the files — needed to load the Penpot
 * plugin (bun run export:design) into penpot.app. Off by default: with it,
 * any page open in a browser on the network can read the repository while
 * the server runs.
 *
 * For a device on the same network, use the LAN address it prints. For a
 * remote browser service, start that service's local tunnel first, then open
 * the localhost address inside the remote session.
 */
import { statSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { join, normalize, resolve, sep } from "node:path";
import { readFlags } from "./utils/browser.js";

const ROOT = join(import.meta.dirname, "..");

const args = process.argv.slice(2);
const { "--port": portArg, "--cors": cors } = readFlags(args, {
  "--port": { fallback: "3000" },
  "--cors": { boolean: true },
});
const port = Number(portArg);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`serve: --port expects a port number, received "${portArg}".`);
  process.exit(1);
}

function stat(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

/*
 * Resolves a request path inside ROOT, or null when it escapes. The server
 * binds to every interface so a phone can reach it, which is exactly when a
 * traversal outside the repository stops being theoretical.
 */
function resolveTarget(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const target = resolve(ROOT, `.${normalize(decoded)}`);
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;

  const info = stat(target);
  if (info?.isDirectory()) {
    const index = join(target, "index.html");
    return stat(index)?.isFile() ? index : null;
  }
  return info?.isFile() ? target : null;
}

function lanAddresses() {
  const addresses = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) addresses.push(entry.address);
    }
  }
  return addresses;
}

let server;
try {
  server = Bun.serve({
    port,
    hostname: "0.0.0.0",
    fetch(request) {
      /* Chrome preflights a public site's request to localhost (Private
         Network Access) and only proceeds on this explicit opt-in. */
      if (cors && request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "*",
            "access-control-allow-private-network": "true",
          },
        });
      }
      const { pathname } = new URL(request.url);
      const target = resolveTarget(pathname);
      console.log(`${target ? 200 : 404} ${pathname}`);
      if (!target) return new Response("Not found", { status: 404 });

      /* A test device that caches dist/ will keep reporting a result the
         working tree no longer produces. */
      const headers = { "cache-control": "no-store" };
      if (cors) headers["access-control-allow-origin"] = "*";
      return new Response(Bun.file(target), { headers });
    },
  });
} catch (error) {
  const hint = error.code === "EADDRINUSE" ? ` Port ${port} is in use — pass --port.` : "";
  console.error(`serve: ${error.message}.${hint}`);
  process.exit(1);
}

console.log(`Serving ${ROOT}${cors ? " (CORS: any origin)" : ""}`);
console.log(`  http://localhost:${server.port}/`);
for (const address of lanAddresses()) console.log(`  http://${address}:${server.port}/`);
console.log(`Demo pages: http://localhost:${server.port}/demo/templates/<name>.html`);
