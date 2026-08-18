/*
 * Headless-Chrome screenshot plumbing shared by the shot: scripts.
 *
 * Every screenshot script needs the same steps: locate Chrome, spawn it with a
 * throwaway profile, connect over the DevTools WebSocket, emulate media, and
 * capture a full-page PNG. Keeping that here means a new script only describes
 * its emulation and output, not the CDP plumbing.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function findChrome() {
  const path = process.env.CHROME ?? CHROME_CANDIDATES.find(existsSync);
  if (!path) {
    throw new Error("Chrome not found — set the CHROME env variable.");
  }
  return path;
}

export function toFileUrl(page, cwd = process.cwd()) {
  if (/^https?:/.test(page)) return page;
  return pathToFileURL(isAbsolute(page) ? page : join(cwd, page)).href;
}

/*
 * Consumes `--flag value` pairs out of `args` (in place) and returns them keyed
 * by flag, falling back to `fallback` when the flag is absent.
 */
export function readFlags(args, spec) {
  const values = {};
  for (const [flag, { fallback }] of Object.entries(spec)) {
    const index = args.indexOf(flag);
    values[flag] = index === -1 ? fallback : args[index + 1];
    if (index !== -1) args.splice(index, 2);
  }
  return values;
}

/*
 * Opens a headless Chrome, navigates to `pageUrl`, applies the given media
 * emulation, and saves a full-page screenshot to `out`. Always cleans up the
 * temporary profile, even on failure.
 *
 * `beforeShot(send)` runs after load/settle and before the capture — use it to
 * set state that screenshots need (e.g. a theme), or to probe computed values.
 */
export async function capture(pageUrl, { out, mediaFeatures = [], settleMs = 400, beforeShot } = {}) {
  const chrome = findChrome();
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

    if (mediaFeatures.length > 0) {
      await send("Emulation.setEmulatedMedia", { features: mediaFeatures });
    }
    await send("Page.enable");
    await send("Page.navigate", { url: pageUrl });
    await Promise.race([loadEvent, wait(8000)]);
    await wait(settleMs); // fonts / paint settle

    if (beforeShot) await beforeShot(send);

    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, Buffer.from(shot.data, "base64"));
    ws.close();
    return out;
  } finally {
    proc.kill();
    await wait(200);
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}