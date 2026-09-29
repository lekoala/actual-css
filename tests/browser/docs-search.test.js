import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;
const INPUT = '#docs-search-dialog input[type="search"]';

async function key(view, name, code, modifiers = 0) {
  for (const type of ["keyDown", "keyUp"]) {
    await view.cdp("Input.dispatchKeyEvent", {
      type,
      key: name,
      code: name,
      windowsVirtualKeyCode: code,
      modifiers,
      text: type === "keyDown" && name === "Enter" ? "\r" : "",
    });
  }
}

const withSearch = (run) =>
  withBrowserPage(fixtureUrl("site/index.html"), async (view) => {
    await key(view, "/", 191);
    await waitForBrowser(view, `document.activeElement === document.querySelector('${INPUT}')`);
    await view.cdp("Input.insertText", { text: "select" });
    await waitForBrowser(
      view,
      `document.querySelectorAll("[data-docs-search-results] li").length > 1`,
    );
    await run(view);
  });

it("Enter on the search close button closes without navigating", async () => {
  await withSearch(async (view) => {
    await key(view, "Tab", 9, 8);
    await waitForBrowser(
      view,
      `document.activeElement?.getAttribute("aria-label") === "Close search"`,
    );
    const before = await view.evaluate("location.href");
    await key(view, "Enter", 13);
    await waitForBrowser(
      view,
      `location.href !== ${JSON.stringify(before)} || !document.getElementById("docs-search-dialog").open`,
    );
    expect(await view.evaluate("location.href")).toBe(before);
    expect(await view.evaluate(`document.getElementById("docs-search-dialog").open`)).toBe(false);
  });
}, 60_000);

it("search arrows keep input focus and Enter follows the selected result", async () => {
  await withSearch(async (view) => {
    await key(view, "ArrowUp", 38);
    const readActive = `document.querySelector('${INPUT}').getAttribute("aria-activedescendant")`;
    expect(await view.evaluate(readActive)).toBe(
      await view.evaluate(`document.querySelector("[data-docs-search-results] li:last-child").id`),
    );
    await key(view, "ArrowDown", 40);
    await key(view, "ArrowDown", 40);
    expect(await view.evaluate(readActive)).toBe("docs-search-opt-1");
    expect(
      await view.evaluate(`document.activeElement === document.querySelector('${INPUT}')`),
    ).toBe(true);
    const href = await view.evaluate(`document.querySelector("#docs-search-opt-1 a").href`);
    await key(view, "Enter", 13);
    await waitForBrowser(view, `location.href === ${JSON.stringify(href)}`);
    expect(await view.evaluate("location.href")).toBe(href);
  });
}, 60_000);

it("IME confirmation and canceled keys are not result navigation", async () => {
  await withSearch(async (view) => {
    const accepted = await view.evaluate(`(() => {
      const input = document.querySelector('${INPUT}');
      const dispatch = (key, options) => input.dispatchEvent(new KeyboardEvent("keydown", {
        key, bubbles: true, cancelable: true, ...options,
      }));
      const composing = ["ArrowDown", "ArrowUp", "Home", "End", "Enter"].map(
        (key) => dispatch(key, { isComposing: true }),
      );
      const ending = dispatch("Enter", { keyCode: 229 });
      input.addEventListener("keydown", (event) => event.preventDefault(), { capture: true, once: true });
      dispatch("ArrowDown");
      return { composing, ending, active: input.getAttribute("aria-activedescendant") };
    })()`);
    expect(accepted.composing).toEqual([true, true, true, true, true]);
    expect(accepted.ending).toBe(true);
    expect(accepted.active).toBeNull();
  });
}, 60_000);
