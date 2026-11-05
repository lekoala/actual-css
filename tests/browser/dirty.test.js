import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;

// Exercise the source without depending on a rebuilt distribution bundle.
const bundle = await Bun.build({ entrypoints: ["src/js/dirty.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Dirty test bundle failed");
const source = await bundle.outputs[0].text();

const withForm = (run) =>
  withBrowserPage(fixtureUrl("tests/browser/dirty.html"), async (view) => {
    await view.evaluate(`(() => { ${source} })()`);
    await view.evaluate(`(() => {
      window.edit = (id, value) => {
        const input = document.getElementById(id);
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return document.getElementById("profile").hasAttribute("data-dirty");
      };
    })()`);
    await run(view);
  });

it("a reset button click returns the form to clean", async () => {
  await withForm(async (view) => {
    expect(await view.evaluate(`edit("name", "Alicia")`)).toBe(true);
    // Real input: a user-initiated reset runs microtasks between listeners,
    // before the controls revert, which form.reset() cannot reproduce.
    await clickSelector(view, "#reset");
    await waitForBrowser(view, `!document.getElementById("profile").hasAttribute("data-dirty")`);
    expect(await view.evaluate(`document.getElementById("name").value`)).toBe("Alice");
  });
}, 60_000);

it("a control associated through form= counts", async () => {
  await withForm(async (view) => {
    expect(await view.evaluate(`edit("outside", "2")`)).toBe(true);
    expect(await view.evaluate(`edit("outside", "1")`)).toBe(false);
  });
}, 60_000);
