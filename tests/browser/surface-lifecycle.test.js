import { expect } from "bun:test";
import { waitForBrowser } from "../../scripts/utils/browser.js";
import { browserSuite } from "./browser-suite.js";

const { it, withBrowserPage } = await browserSuite();
const bundle = await Bun.build({ entrypoints: ["src/js/full.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Runtime test bundle failed");
const runtime = `(() => {
  ${await bundle.outputs[0].text()}
})()`;

it("moving an open panel that the browser closes ends its opening and allows reopening", async () => {
  await withBrowserPage("about:blank", async (view) => {
    await view.evaluate(`document.body.innerHTML = \`
      <button id="trigger" data-enhance="flyout" aria-controls="panel">Open</button>
      <div id="host"><div id="panel" class="flyout">Panel</div></div>
      <div id="destination"></div>
    \``);
    await view.evaluate(runtime);
    await waitForBrowser(view, 'document.querySelector("#trigger[aria-expanded=false]") !== null');

    await view.evaluate('document.getElementById("trigger").click()');
    await waitForBrowser(view, 'document.querySelector("#panel:popover-open") !== null');

    await view.evaluate(
      `document.getElementById("destination").append(document.getElementById("host"))`,
    );
    await waitForBrowser(
      view,
      'document.querySelector("#destination #panel:not(.is-open):not(:popover-open)") !== null',
    );
    expect(
      await view.evaluate('document.getElementById("trigger").getAttribute("aria-expanded")'),
    ).toBe("false");

    await view.evaluate('document.getElementById("trigger").click()');
    await waitForBrowser(view, 'document.querySelector("#panel.is-open:popover-open") !== null');
    expect(
      await view.evaluate('document.getElementById("trigger").getAttribute("aria-expanded")'),
    ).toBe("true");
  });
});
