/*
 * Headless-Chrome screenshot plumbing shared by the shot: scripts.
 *
 * `capture` describes only the emulation and output; the CDP plumbing (spawn,
 * connect, navigate, cleanup) lives in chrome.js via `withChromePage`. The
 * shared helpers are re-exported here so existing importers keep working.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { withChromePage } from "./chrome.js";

export { findChrome, readFlags, toFileUrl, withChromePage } from "./chrome.js";

/*
 * Opens a headless Chrome, navigates to `pageUrl`, applies the given media
 * emulation, and saves a full-page screenshot to `out`.
 *
 * `beforeShot(send)` runs after load/settle and before the capture — use it to
 * set state that screenshots need (e.g. a theme), or to probe computed values.
 */
export async function capture(pageUrl, { out, mediaFeatures = [], settleMs = 400, beforeShot } = {}) {
  await withChromePage(pageUrl, { mediaFeatures, settleMs }, async ({ send }) => {
    if (beforeShot) await beforeShot(send);

    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, Buffer.from(shot.data, "base64"));
  });
  return out;
}