/*
 * --src-css: demo pages link dist/ and the demo themes bundle, which agents do
 * not rebuild, so a probe or shot of a demo silently measured the last build.
 * The swap must cover every built stylesheet and resolve only once the sources
 * have loaded, or it trades the stale read for a race.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const baseTest = (await browserAvailable()) ? test : test.skip;

baseTest(
  "sourceCss swaps core and themes for their sources before the caller runs",
  async () => {
    const result = await withBrowserPage(
      fixtureUrl("tests/browser/source-css.html"),
      (view) =>
        view.evaluate(`(() => {
          document.documentElement.dataset.theme = "bootstrap-v6";
          return {
            sheets: [...document.querySelectorAll('link[rel~="stylesheet"]')].map((link) =>
              new URL(link.href).pathname.split("/").slice(-3).join("/"),
            ),
            // Only the source theme sets this step; read synchronously, with no
            // wait, so a swap that returned before loading would fail here.
            themeStep: getComputedStyle(document.documentElement)
              .getPropertyValue("--control-pad-x-md")
              .trim(),
            display: getComputedStyle(document.querySelector(".btn")).display,
          };
        })()`),
      { sourceCss: true },
    );

    expect(result.sheets).toEqual(["src/css/actual.full.css", "css/themes/index.css"]);
    expect(result.themeStep).toBe("0.75rem");
    expect(result.display).toBe("inline-flex");
  },
  60_000,
);
