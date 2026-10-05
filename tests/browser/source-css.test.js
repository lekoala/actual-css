/*
 * --src-css: demo pages link dist/ and the demo themes bundle, which agents do
 * not rebuild, so a probe or shot of a demo silently measured the last build.
 * The swap must cover every built stylesheet and resolve only once the sources
 * have loaded, or it trades the stale read for a race.
 *
 * Served over HTTP rather than file://: every file is its own origin under
 * file://, which hides the cssRules this test reads.
 */
import { afterAll, beforeAll, expect, test } from "bun:test";
import { join } from "node:path";
import { browserAvailable, withBrowserPage } from "../../scripts/utils/browser.js";

const ROOT = join(import.meta.dirname, "..", "..");
const baseTest = (await browserAvailable()) ? test : test.skip;

let server;
beforeAll(() => {
  server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(request) {
      const file = Bun.file(join(ROOT, decodeURIComponent(new URL(request.url).pathname)));
      return (await file.exists())
        ? new Response(file)
        : new Response("Not found", { status: 404 });
    },
  });
});
afterAll(() => server?.stop(true));

baseTest(
  "sourceCss swaps core and themes for their sources before the caller runs",
  async () => {
    const result = await withBrowserPage(
      new URL("/tests/browser/source-css.html", server.url).href,
      (view) =>
        view.evaluate(`(() => {
          // A source entry is a tree of @import rules; a built bundle inlines
          // them and has none. Read synchronously, with no wait: every import
          // must already hold its rules, or the swap returned before loading.
          // Holds whatever dist/ currently contains.
          const imports = (sheet) =>
            [...sheet.cssRules]
              .filter((rule) => rule instanceof CSSImportRule)
              .flatMap((rule) => [rule, ...(rule.styleSheet ? imports(rule.styleSheet) : [])]);
          const links = [...document.querySelectorAll('link[rel~="stylesheet"]')];
          return {
            sheets: links.map((link) => new URL(link.href).pathname),
            imports: links.map((link) => imports(link.sheet).length),
            unloaded: links
              .flatMap((link) => imports(link.sheet))
              .filter((rule) => !rule.styleSheet?.cssRules.length)
              .map((rule) => rule.href),
            // The swap restyles the page; a shot taken mid-transition showed
            // filled buttons half-faded.
            running: document
              .getAnimations()
              .filter((a) => a instanceof CSSTransition && a.playState === "running").length,
          };
        })()`),
      { sourceCss: true },
    );

    expect(result.sheets).toEqual(["/src/css/actual.full.css", "/src/css/themes/index.css"]);
    for (const count of result.imports) expect(count).toBeGreaterThan(1);
    expect(result.unloaded).toEqual([]);
    expect(result.running).toBe(0);
  },
  60_000,
);
