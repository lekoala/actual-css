/*
 * Run a JavaScript program inside a headless Chrome page and print its return
 * value as JSON. The "measure without screenshots" counterpart to shot:page:
 * for probes that only need numbers (a rect, a computed style, a class list)
 * this avoids improvising a one-off CDP script each time.
 *
 * The program runs as the body of an async function inside the page, so it can
 * interact (clicks, focus) and `await sleep(...)` before returning its result:
 *
 *   document.querySelector("[data-docs-search]").click();
 *   await sleep(400);
 *   return document.getElementById("docs-search-dialog").getBoundingClientRect();
 *
 * Anything JSON-serializable may be returned; exceptions are printed with a
 * non-zero exit. Chrome is located the same way as the shot: scripts.
 */

import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findChrome, readFlags, toFileUrl } from "./utils/chrome-shot.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const args = process.argv.slice(2);
const flags = readFlags(args, {
  "--url": { fallback: undefined },
  "--script": { fallback: undefined },
  "--expr": { fallback: undefined },
  "--settle": { fallback: "400" },
  "--window-size": { fallback: "1100,900" },
});

const page = flags["--url"] ?? args[0] ?? "docs/site/index.html";
const settleMs = Number(flags["--settle"]);
const [width, height] = flags["--window-size"].split(",").map(Number);

const program =
  flags["--script"] !== undefined
    ? await readFile(flags["--script"], "utf8")
    : flags["--expr"];
if (program === undefined) {
  console.error("probe: pass a program via --expr or --script.");
  process.exit(1);
}

const expression = `(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  ${program}
})()`;

const chrome = findChrome();
const profile = await mkdtemp(join(tmpdir(), "actual-probe-"));
const proc = spawn(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

let ok = false;
try {
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

  await send("Page.enable");
  const url = toFileUrl(page);
  await send("Page.navigate", { url });
  await Promise.race([loadEvent, wait(8000)]);
  await wait(settleMs);

  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    console.error(result.exceptionDetails.exception?.description ??
      result.exceptionDetails.text);
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(result.result?.value ?? null, null, 2));
    ok = true;
  }
  ws.close();
} finally {
  proc.kill();
  await wait(200);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}