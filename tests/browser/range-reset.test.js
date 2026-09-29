import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;

// Exercise the source without depending on a rebuilt distribution bundle.
const bundle = await Bun.build({
  entrypoints: ["src/js/range.js"],
  format: "iife",
  write: false,
});
if (!bundle.success) throw new AggregateError(bundle.logs, "Range test bundle failed");
const source = await bundle.outputs[0].text();

const withRange = (run) =>
  withBrowserPage(fixtureUrl("tests/browser/range-reset.html"), async (view) => {
    await view.evaluate(`(() => { ${source} })()`);
    await view.evaluate(`(() => {
      window.readRange = (id) => {
        const input = document.getElementById(id);
        return {
          value: input.value,
          progress: parseFloat(input.style.getPropertyValue("--range-progress")),
          label: input.getAttribute("aria-valuetext"),
          output: document.querySelector('output[for="' + id + '"]').textContent,
        };
      };
      for (const input of document.querySelectorAll("input")) {
        input.value = "3";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    })()`);
    await run(view);
  });

it("a native reset updates internal and externally associated ranges", async () => {
  await withRange(async (view) => {
    const at = await view.evaluate(`(() => {
      const r = document.getElementById("reset-range").getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    // Native input catches microtask timing that el.click() cannot reproduce.
    for (const type of ["mousePressed", "mouseReleased"]) {
      await view.cdp("Input.dispatchMouseEvent", { ...at, type, button: "left", clickCount: 1 });
    }
    await waitForBrowser(
      view,
      `readRange("inside").label === "Standard" && readRange("outside").label === "High"`,
    );
    for (const [id, value, label] of [
      ["inside", 1, "Standard"],
      ["outside", 2, "High"],
    ]) {
      const state = await view.evaluate(`readRange(${JSON.stringify(id)})`);
      expect(state.value).toBe(String(value));
      expect(state.progress).toBeCloseTo((value / 3) * 100);
      expect(state.label).toBe(label);
      expect(state.output).toBe(label);
    }
  });
}, 60_000);

it("reset follows a range moved to another form", async () => {
  await withRange(async (view) => {
    await view.evaluate(`(() => {
      document.getElementById("second").append(document.getElementById("inside"));
      document.getElementById("second").reset();
    })()`);
    await waitForBrowser(view, `readRange("inside").label === "Standard"`);
    expect((await view.evaluate(`readRange("inside")`)).output).toBe("Standard");
    expect((await view.evaluate(`readRange("outside")`)).label).toBe("Maximum");
  });
}, 60_000);

it("canceled resets and removal do not overwrite author state", async () => {
  await withRange(async (view) => {
    const states = await view.evaluate(`(async () => {
      const form = document.getElementById("first");
      const input = document.getElementById("inside");
      input.setAttribute("aria-valuetext", "Author");
      form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
      form.reset();
      // Queue behind the reset task: these unchanged-state assertions must
      // run after any pending reset write, not before it gets a chance to run.
      await new Promise((resolve) => setTimeout(resolve, 0));
      const canceled = readRange("inside");
      form.reset();
      input.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));
      return {
        canceled,
        removedLabel: input.getAttribute("aria-valuetext"),
        removedOutput: document.querySelector('output[for="inside"]').textContent,
      };
    })()`);
    expect(states.canceled).toEqual({
      value: "3",
      progress: 100,
      label: "Author",
      output: "Maximum",
    });
    expect(states.removedLabel).toBe("Author");
    expect(states.removedOutput).toBe("Original inside");
  });
}, 60_000);

it("a canceled reset does not discard an earlier successful reset", async () => {
  await withRange(async (view) => {
    await view.evaluate(`(() => {
      const form = document.getElementById("first");
      form.reset();
      form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
      form.reset();
    })()`);
    await waitForBrowser(view, `readRange("inside").label === "Standard"`);
    expect((await view.evaluate(`readRange("inside")`)).output).toBe("Standard");
  });
}, 60_000);
