/*
 * Page screenshot — renders a page in headless Chrome and saves a full-page
 * PNG. Use it to eyeball a demo page or doc example after a change without
 * opening a browser. The CDP plumbing mirrors forced-colors-shot.js, which
 * exists for the forced-colors emulation this script intentionally skips.
 *
 * Usage:
 *   bun scripts/page-shot.js [page] [--scheme light|dark] [--out file.png]
 *
 *   page      path or URL to capture (default: demo/templates/kitchen-sink.html)
 *   --scheme  prefers-color-scheme to emulate (default: browser default)
 *   --out     output file (default: tmp/page-shot.png)
 *
 * Chrome is looked up in the standard install locations; set the CHROME env
 * variable to use another Chromium binary.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const scheme = readFlag("--scheme", "");
const out = readFlag("--out", join(ROOT, "tmp", "page-shot.png"));
const page = args[0] ?? join(ROOT, "demo", "templates", "kitchen-sink.html");
const pageUrl = /^https?:/.test(page)
  ? page
  : pathToFileURL(isAbsolute(page) ? page : join(process.cwd(), page)).href;

const chrome =
  process.env.CHROME ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find(existsSync);
if (!chrome) {
  console.error("Chrome not found — set the CHROME env variable.");
  process.exit(1);
}

const profile = await mkdtemp(join(tmpdir(), "actual-shot-"));
const proc = spawn(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--window-size=1100,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function cleanup() {
  proc.kill();
  await wait(200);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

try {
  // Chrome writes the picked port to DevToolsActivePort inside the profile.
  let port;
  for (let i = 0; i < 50 && !port; i++) {
    await wait(200);
    port = await readFile(join(profile, "DevToolsActivePort"), "utf8")
      .then((text) => text.split("\n")[0].trim())
      .catch(() => undefined);
  }
  if (!port) throw new Error("Chrome did not expose a DevTools port.");

  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const target = targets.find((t) => t.type === "page");
  if (!target) throw new Error("No page target found.");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let messageId = 0;
  const pending = new Map();
  let loaded;
  const loadEvent = new Promise((resolve) => {
    loaded = resolve;
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++messageId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Page.loadEventFired") loaded();
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  };
  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  if (scheme === "light" || scheme === "dark") {
    await send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: scheme }],
    });
  }
  await send("Page.enable");
  await send("Page.navigate", { url: pageUrl });
  await Promise.race([loadEvent, wait(8000)]);
  await wait(400); // fonts / paint settle

  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(shot.data, "base64"));
  console.log(`Saved ${out} (${pageUrl}${scheme ? `, ${scheme}` : ""})`);
  ws.close();
} finally {
  await cleanup();
}
