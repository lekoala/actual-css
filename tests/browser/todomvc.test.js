import { expect } from "bun:test";
import { fixtureUrl, waitForBrowser } from "../../scripts/utils/browser.js";
import { browserSuite } from "./browser-suite.js";

const { it, clickSelector, pressKey, setViewport, tabUntil, withBrowserPage } =
  await browserSuite();
const playwright = Boolean(process.env.ACTUAL_TEST_BROWSER);
const url = fixtureUrl("demo/templates/todomvc.html");
const visibleTitles = `[...document.querySelectorAll("#todo-list li:not([hidden]) .todo-title")]
  .map(title => title.textContent)`;
const activeFilter = `document.querySelector('[aria-current="page"]').hash`;

const navigate = (view, target) => (playwright ? view.goto(target) : view.navigate(target));
const waitFor = (view, condition) =>
  playwright ? view.waitForFunction(condition) : waitForBrowser(view, condition);

const withTodos = (run) =>
  withBrowserPage(url, async (view) => {
    await view.evaluate(`localStorage.removeItem("todos-actual-css")`);
    await navigate(view, "about:blank");
    await navigate(view, url);
    await waitFor(view, `document.activeElement.id === "todo-new"`);
    await run(view);
  });

async function submitTitle(view, title) {
  await view.evaluate(`document.activeElement.value = ${JSON.stringify(title)}`);
  await pressKey(view, "Enter");
}

async function expectVisible(view, selector, visible) {
  expect(
    await view.evaluate(
      `(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        return element.getClientRects().length > 0 && getComputedStyle(element).visibility === "visible";
      })()`,
    ),
  ).toBe(visible);
}

it("starts empty, rejects blank titles, and adds trimmed text in order", async () => {
  await withTodos(async (view) => {
    await expectVisible(view, "#todo-all", false);
    await expectVisible(view, "#todo-count", false);
    await submitTitle(view, "   ");
    expect(await view.evaluate(visibleTitles)).toEqual([]);
    await submitTitle(view, "  <First>  ");
    expect(await view.evaluate("document.activeElement.value")).toBe("");
    expect(await view.evaluate(`document.querySelector("#todo-count").textContent`)).toBe(
      "1 item left",
    );
    await submitTitle(view, "Second");
    expect(await view.evaluate(visibleTitles)).toEqual(["<First>", "Second"]);
    expect(await view.evaluate(`document.querySelector("#todo-count strong").textContent`)).toBe(
      "2",
    );
    await expectVisible(view, "#todo-all", true);
    await expectVisible(view, "#todo-clear", false);
  });
});

it("keeps the card and filter links in place when Clear completed appears", async () => {
  await withTodos(async (view) => {
    await submitTitle(view, "First");

    const geometry = `[...document.querySelectorAll(".todo-card, .todo-filters a, .todo-page > footer")]
      .map(element => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return [x, y, width, height];
      })`;

    for (const width of [1100, 320]) {
      await setViewport(view, { width });
      await waitFor(view, `innerWidth === ${width}`);
      await expectVisible(view, "#todo-clear", false);
      const before = await view.evaluate(geometry);
      await clickSelector(view, '[aria-label="Complete: First"]');
      await expectVisible(view, "#todo-clear", true);
      expect(await view.evaluate(geometry)).toEqual(before);
      await clickSelector(view, '[aria-label="Complete: First"]');
      await expectVisible(view, "#todo-clear", false);
      expect(await view.evaluate(geometry)).toEqual(before);
    }
  });
});

it("derives completion presentation and clears matching tasks across filters", async () => {
  await withTodos(async (view) => {
    await submitTitle(view, "First");
    await submitTitle(view, "Second");
    await clickSelector(view, '[aria-label="Complete: First"]');
    expect(
      await view.evaluate(
        `getComputedStyle(document.querySelector(".todo-title")).textDecorationLine`,
      ),
    ).toBe("line-through");
    expect(await view.evaluate(`document.querySelector("#todo-all").indeterminate`)).toBe(true);
    await clickSelector(view, 'a[href="#/active"]');
    await waitFor(view, `${activeFilter} === "#/active"`);
    expect(await view.evaluate(visibleTitles)).toEqual(["Second"]);
    await expectVisible(view, "#todo-clear", true);
    await clickSelector(view, "#todo-clear");
    expect(await view.evaluate(visibleTitles)).toEqual(["Second"]);
    expect(await view.evaluate(`document.activeElement.id`)).toBe("todo-new");
    await clickSelector(view, "#todo-all");
    expect(await view.evaluate(visibleTitles)).toEqual([]);
    expect(await view.evaluate(`document.querySelector("#todo-all").checked`)).toBe(true);
    expect(await view.evaluate(`document.querySelector("#todo-count").textContent`)).toBe(
      "0 items left",
    );
    await clickSelector(view, "#todo-all");
    expect(await view.evaluate(visibleTitles)).toEqual(["Second"]);
    await clickSelector(view, '[aria-label="Complete: Second"]');
    expect(await view.evaluate(`document.activeElement.id`)).toBe("todo-new");
    await clickSelector(view, "#todo-clear");
    await expectVisible(view, "#todo-count", false);
    expect(await view.evaluate(`document.querySelector("#todo-all").checked`)).toBe(false);
  });
});

it("edits by keyboard and double-click, cancels with Escape, and supports deletion", async () => {
  await withTodos(async (view) => {
    await submitTitle(view, "First");
    await submitTitle(view, "Second");
    expect(
      await tabUntil(view, `document.activeElement.getAttribute("aria-label") === "Edit: First"`),
    ).toBe(true);
    await pressKey(view, "Enter");
    expect(await view.evaluate(`document.activeElement.getAttribute("aria-label")`)).toBe(
      "Edit todo title",
    );
    await expectVisible(view, '[aria-label="Complete: First"]', false);
    await submitTitle(view, "  Revised  ");
    expect(await view.evaluate(visibleTitles)).toEqual(["Revised", "Second"]);
    expect(await view.evaluate(`document.activeElement.getAttribute("aria-label")`)).toBe(
      "Edit: Revised",
    );

    const title = ".todo-title";
    if (playwright) {
      await view.locator(title).first().dblclick();
    } else {
      const point = await view.evaluate(`(() => {
        const { x, y, width, height } = document.querySelector(".todo-title").getBoundingClientRect();
        return {x: x + width / 2, y: y + height / 2};
      })()`);
      for (const type of ["mousePressed", "mouseReleased"]) {
        await view.cdp("Input.dispatchMouseEvent", {
          type,
          ...point,
          button: "left",
          clickCount: 2,
        });
      }
    }
    await waitFor(view, `document.activeElement.getAttribute("aria-label") === "Edit todo title"`);
    await view.evaluate(`document.activeElement.value = "  Saved on blur  "`);
    await clickSelector(view, "#todo-new");
    expect(await view.evaluate(visibleTitles)).toEqual(["Saved on blur", "Second"]);

    expect(
      await tabUntil(
        view,
        `document.activeElement.getAttribute("aria-label") === "Edit: Saved on blur"`,
      ),
    ).toBe(true);
    await pressKey(view, "Enter");
    await view.evaluate(`document.activeElement.value = "Canceled"`);
    await pressKey(view, "Escape");
    expect(await view.evaluate(visibleTitles)).toEqual(["Saved on blur", "Second"]);
    await pressKey(view, "Enter");
    await submitTitle(view, "   ");
    expect(await view.evaluate(visibleTitles)).toEqual(["Second"]);
    expect(
      await tabUntil(
        view,
        `document.activeElement.getAttribute("aria-label") === "Delete: Second"`,
      ),
    ).toBe(true);
    await pressKey(view, "Enter");
    expect(await view.evaluate(visibleTitles)).toEqual([]);
    expect(await view.evaluate("document.activeElement.id")).toBe("todo-new");
  });
});

it("keeps records and hash routes across reload and browser history", async () => {
  await withTodos(async (view) => {
    await submitTitle(view, "First");
    await submitTitle(view, "Second");
    await clickSelector(view, '[aria-label="Complete: Second"]');
    await clickSelector(view, 'a[href="#/completed"]');
    await waitFor(view, `${activeFilter} === "#/completed"`);
    expect(await view.evaluate(visibleTitles)).toEqual(["Second"]);
    await navigate(view, "about:blank");
    await navigate(view, `${url}#/completed`);
    await waitFor(view, `${activeFilter} === "#/completed"`);
    expect(await view.evaluate(visibleTitles)).toEqual(["Second"]);
    expect(
      await view.evaluate(`document.querySelector('[aria-label="Complete: Second"]').checked`),
    ).toBe(true);
    await clickSelector(view, 'a[href="#/"]');
    await waitFor(view, `${activeFilter} === "#/"`);
    expect(await view.evaluate(visibleTitles)).toEqual(["First", "Second"]);
    await view.evaluate("history.back()");
    await waitFor(view, `${activeFilter} === "#/completed"`);
    expect(await view.evaluate(visibleTitles)).toEqual(["Second"]);
  });
});
