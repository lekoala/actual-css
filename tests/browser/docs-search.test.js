import { expect, test } from "bun:test";
import { searchEntries } from "../../scripts/docs/search.js";
import {
  browserAvailable,
  clickSelector,
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

const withSearch = (run, text = "select", url = fixtureUrl("site/index.html")) =>
  withBrowserPage(url, async (view) => {
    await key(view, "/", 191);
    await waitForBrowser(
      view,
      `document.activeElement === document.querySelector('${INPUT}') &&
       getComputedStyle(document.getElementById("docs-search-dialog")).opacity === "1"`,
    );
    await view.cdp("Input.insertText", { text });
    // Quick links are already options before the query, so "more than one
    // li" is not evidence that the results replaced them. Wait for the label
    // to leave the empty state as well.
    await waitForBrowser(
      view,
      `document.querySelector("[data-docs-search-label]").hidden === true &&
       document.querySelectorAll("[data-docs-search-results] li").length > 1`,
    );
    return run(view);
  });

const withOpenSearch = (run, url = fixtureUrl("site/index.html")) =>
  withBrowserPage(url, async (view) => {
    await key(view, "/", 191);
    await waitForBrowser(
      view,
      `document.activeElement === document.querySelector('${INPUT}') &&
       document.querySelector("[data-docs-search-label]").hidden === false &&
       getComputedStyle(document.getElementById("docs-search-dialog")).opacity === "1"`,
    );
    return run(view);
  });

it("opens on quick links and restores them when the query clears", async () => {
  await withOpenSearch(async (view) => {
    const count = `document.querySelectorAll("[data-docs-search-results] li").length`;
    expect(await view.evaluate(count)).toBeGreaterThanOrEqual(5);
    expect(
      await view.evaluate(`document.querySelector('${INPUT}').getAttribute("aria-expanded")`),
    ).toBe("true");
    expect(
      await view.evaluate(`document.querySelector("[data-docs-search-empty]").textContent`),
    ).toBe("");

    await view.cdp("Input.insertText", { text: "select" });
    await waitForBrowser(
      view,
      `document.querySelector("[data-docs-search-label]").hidden === true &&
       document.querySelectorAll("[data-docs-search-results] li").length > 1`,
    );

    await view.evaluate(`(() => {
      const input = document.querySelector('${INPUT}');
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await waitForBrowser(
      view,
      `document.querySelector("[data-docs-search-label]").hidden === false &&
       document.querySelectorAll("[data-docs-search-results] li").length >= 5`,
    );
    expect(
      await view.evaluate(`document.querySelector("[data-docs-search-empty]").textContent`),
    ).toBe("");
  });
}, 60_000);

it("a query with no results leaves the panel compact", async () => {
  await withOpenSearch(async (view) => {
    await view.cdp("Input.insertText", { text: "zzzzzz" });
    await waitForBrowser(
      view,
      `document.querySelector("[data-docs-search-empty]").textContent.length > 0 &&
       document.querySelectorAll("[data-docs-search-results] li").length === 0`,
    );
    const shape = await view.evaluate(`(() => {
      const dialog = document.getElementById("docs-search-dialog").getBoundingClientRect();
      return { height: dialog.height, viewport: innerHeight };
    })()`);
    // The panel shrinks to its content: no result-area min height reserved.
    expect(shape.height).toBeLessThan(shape.viewport / 2);
  });
}, 60_000);

it("quick links are keyboard navigable and Enter opens the selected one", async () => {
  await withOpenSearch(async (view) => {
    await key(view, "ArrowDown", 38);
    await waitForBrowser(
      view,
      `document.querySelector('${INPUT}').getAttribute("aria-activedescendant") === "docs-search-opt-0"`,
    );
    const href = await view.evaluate(`document.querySelector("#docs-search-opt-0 a").href`);
    await key(view, "Enter", 13);
    await waitForBrowser(view, `location.href === ${JSON.stringify(href)}`);
    expect(await view.evaluate("location.href")).toBe(href);
  });
}, 60_000);

it("the close matches the field edge and the footer stays while results scroll", async () => {
  await withOpenSearch(async (view) => {
    const edges = await view.evaluate(`(() => {
      const close = document.querySelector("#docs-search-dialog .docs-search-header .close");
      const rect = close.getBoundingClientRect();
      const input = document.querySelector('${INPUT}').getBoundingClientRect();
      const style = getComputedStyle(close);
      return {
        close: rect.right,
        input: input.right,
        position: style.position,
        background: style.backgroundColor,
      };
    })()`);
    expect(Math.abs(edges.close - edges.input)).toBeLessThanOrEqual(1);
    // In-flow and bare: the corner overlay would sit a --space-20 inset off
    // the field edge and paint --surface-subtle behind the X.
    expect(edges.position).toBe("static");
    expect(edges.background).toBe("rgba(0, 0, 0, 0)");
    // The form is not a scrollport: .scrollable would otherwise clip the
    // field's focus ring.
    expect(
      await view.evaluate(`getComputedStyle(document.querySelector(".docs-search-form")).overflow`),
    ).toBe("visible");

    await view.cdp("Emulation.setDeviceMetricsOverride", {
      width: 480,
      height: 380,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await view.cdp("Input.insertText", { text: "class" });
    await waitForBrowser(
      view,
      `document.querySelector("[data-docs-search-label]").hidden === true &&
       (() => {
         const body = document.querySelector("[data-docs-search-body]");
         return body.scrollHeight > body.clientHeight;
       })()`,
    );

    const before = await view.evaluate(
      `document.querySelector(".docs-search-footer").getBoundingClientRect().top`,
    );
    await view.evaluate(`document.querySelector("[data-docs-search-body]").scrollTop = 9999`);
    const after = await view.evaluate(
      `document.querySelector(".docs-search-footer").getBoundingClientRect().top`,
    );
    expect(after).toBe(before);

    await view.cdp("Emulation.setDeviceMetricsOverride", {
      width: 320,
      height: 640,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await waitForBrowser(
      view,
      `getComputedStyle(document.querySelector(".docs-search-hint-label")).display === "none"`,
    );
    const width = await view.evaluate(`(() => {
      const panel = document.getElementById("docs-search-dialog").getBoundingClientRect();
      return { left: panel.left, right: panel.right, viewport: innerWidth };
    })()`);
    expect(width.left).toBeGreaterThanOrEqual(0);
    expect(width.right).toBeLessThanOrEqual(width.viewport);
  });
}, 60_000);

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

// Trap: the link carried the matched section's #id while Enter navigated to
// the bare page URL, so click and keyboard opened different places.
it("Enter opens the same #section the result link points to", async () => {
  await withSearch(async (view) => {
    const href = await view.evaluate(`document.querySelector("#docs-search-opt-0 a").href`);
    expect(href).toContain("#class-reference");
    await key(view, "Enter", 13);
    await waitForBrowser(view, `location.href === ${JSON.stringify(href)}`);
    expect(await view.evaluate("location.href")).toBe(href);
  }, "class reference");
}, 60_000);

// Trap: a #section on the current page navigates without unloading, so the
// modal stayed open over the section it had just scrolled to.
for (const via of ["Enter", "click"]) {
  it(`${via} on a result in the current page closes the search`, async () => {
    const page = await withSearch(
      (view) => view.evaluate(`document.querySelector("#docs-search-opt-0 a").href.split("#")[0]`),
      "class reference",
    );
    await withSearch(
      async (view) => {
        const href = await view.evaluate(`document.querySelector("#docs-search-opt-0 a").href`);
        expect(href.split("#")[0]).toBe(page);
        if (via === "Enter") await key(view, "Enter", 13);
        else await clickSelector(view, "#docs-search-opt-0 a");
        await waitForBrowser(view, `location.href === ${JSON.stringify(href)}`);
        await waitForBrowser(view, `!document.getElementById("docs-search-dialog").open`);
      },
      "class reference",
      page,
    );
  }, 60_000);
}

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

/* search.js is the executable spec of the ranking; docs.js ships an
 * autonomous copy (no bundler, file://-safe). This test locks the invariant:
 * the same index and the same queries produce the same ordered URLs. */
it("ranks the same ordered URLs as searchEntries() for index-derived queries", async () => {
  await withSearch(async (view) => {
    const index = await view.evaluate("window.__SEARCH_INDEX__ ?? []");
    expect(index.length).toBeGreaterThan(0);

    const queries = [];
    for (const entry of index) {
      if (entry.title && queries.length < 3) queries.push(entry.title);
    }
    const seen = new Set(queries);
    for (const entry of index) {
      for (const alias of entry.aliases ?? []) {
        if (!seen.has(alias) && queries.length < 6) {
          seen.add(alias);
          queries.push(alias);
        }
      }
      if (queries.length >= 6) break;
    }
    for (const entry of index) {
      for (const token of entry.title
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean)) {
        if (!seen.has(token) && queries.length < 8) {
          seen.add(token);
          queries.push(token);
        }
      }
      if (queries.length >= 8) break;
    }
    if (index.some((entry) => entry.aliases?.includes("custom select"))) {
      queries.push("custom select");
    }
    expect(queries.length).toBeGreaterThan(0);

    for (const query of queries) {
      const expected = searchEntries(index, query).map((entry) => entry.url);
      await view.evaluate(`(() => {
        const input = document.querySelector('${INPUT}');
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      })()`);
      await view.cdp("Input.insertText", { text: query });
      await waitForBrowser(
        view,
        `document.querySelectorAll("[data-docs-search-results] li").length === ${expected.length}`,
      );
      const hrefs = await view.evaluate(
        `[...document.querySelectorAll("[data-docs-search-results] li a")].map((a) => a.getAttribute("href"))`,
      );
      // Ranking parity is per page; a result may add the #id of its matched
      // section, which must be one of that page's indexed anchors.
      const pages = hrefs.map((href) => href.split("#")[0]);
      expect({ query, hrefs: pages }).toEqual({ query, hrefs: expected });
      for (const href of hrefs) {
        const [url, hash] = href.split("#");
        if (!hash) continue;
        const entry = index.find((item) => url.endsWith(item.url));
        expect(entry?.anchors).toContain(hash);
      }
    }
  });
}, 120_000);
