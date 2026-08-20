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
 *
 * --width forces the exact layout viewport width with device metrics. It is
 * more reliable than --window-size alone: headless Chrome clamps the window
 * flag to a platform minimum (e.g. ~512px on Windows), which makes a
 * "360px" probe silently render at ~512px.
 */

import { readFile } from "node:fs/promises";
import { readFlags, toFileUrl, withChromePage } from "./utils/chrome.js";

const args = process.argv.slice(2);
const flags = readFlags(args, {
  "--url": { fallback: undefined },
  "--script": { fallback: undefined },
  "--expr": { fallback: undefined },
  "--settle": { fallback: "400" },
  "--window-size": { fallback: "1100,900" },
  "--width": { fallback: undefined },
});

const page = flags["--url"] ?? args[0] ?? "site/index.html";
const settleMs = Number(flags["--settle"]);

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

let ok = false;
try {
  await withChromePage(
    toFileUrl(page),
    { windowSize: flags["--window-size"], settleMs },
    async ({ send }) => {
      if (flags["--width"]) {
        await send("Emulation.setDeviceMetricsOverride", {
          width: Number(flags["--width"]),
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
      }

      const result = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });

      if (result.exceptionDetails) {
        console.error(
          result.exceptionDetails.exception?.description ??
            result.exceptionDetails.text,
        );
        process.exitCode = 1;
      } else {
        console.log(JSON.stringify(result.result?.value ?? null, null, 2));
        ok = true;
      }
    },
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

process.exit(ok ? 0 : 1);