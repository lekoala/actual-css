/*
 * The docs customizer on the built site: one config drives the page, the
 * copied CSS and the share link. Reads site/, so it runs after build:docs.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  setViewport,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const it = (await browserAvailable()) ? test : test.skip;
const PAGE = fixtureUrl("site/forms/overview.html");
const KEY = "actual-docs-customizer";

/* Storage outlives a view on the file origin: start each test empty. */
async function fresh(view, url = PAGE) {
  await view.evaluate("(() => { localStorage.clear(); sessionStorage.clear(); return true; })()");
  await view.navigate(url);
}

const rootToken = (name) =>
  `getComputedStyle(document.documentElement).getPropertyValue("${name}").trim()`;

/* Clipboard writes are captured in the page; headless Chrome has no
   clipboard permission. */
const stubClipboard = `(() => {
  window.__copied = [];
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (text) => { window.__copied.push(text); } },
  });
  return true;
})()`;

async function choose(view, name, value) {
  await view.evaluate(`(() => {
    const form = document.querySelector("[data-docs-customizer-form]");
    form.elements.namedItem(${JSON.stringify(name)}).value = ${JSON.stringify(value)};
    form.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`);
}

async function openPanel(view) {
  await clickSelector(view, "[data-docs-customize]");
  // The drawer slides in: a click during the transition misses its controls.
  await waitForBrowser(
    view,
    `(() => {
      const panel = document.getElementById("docs-customizer");
      return panel.open && !panel.getAnimations().some((a) => a.playState === "running");
    })()`,
  );
}

it("applies the saved config before the first paint and renders the copied CSS", async () => {
  await withBrowserPage(PAGE, async (view) => {
    const config = {
      version: 1,
      theme: "plush",
      scheme: "system",
      radius: "square",
      density: "compact",
      fields: "edge",
      elevation: "default",
      finish: "default",
      font: "default",
    };
    await fresh(view);
    await view.evaluate(
      `(() => { localStorage.setItem("${KEY}", ${JSON.stringify(JSON.stringify(config))}); return true; })()`,
    );
    await view.navigate(PAGE);

    const state = await view.evaluate(`(() => {
      const script = document.querySelector('script[src$="docs-customizer.js"]');
      const style = document.getElementById("docs-customizer-style");
      return {
        blocking: script.parentElement === document.head && !script.async && !script.defer && script.type === "",
        styleInHead: style?.parentElement === document.head,
        theme: document.documentElement.dataset.theme,
        rendered: style.textContent,
        expected: ActualDocsCustomizer.cssText(${JSON.stringify(config)}),
        radius: ${rootToken("--radius")},
        controlSize: ${rootToken("--control-size")},
      };
    })()`);

    // Parser-blocking in <head>: the config lands before the body renders.
    expect(state.blocking).toBe(true);
    expect(state.styleInHead).toBe(true);
    expect(state.theme).toBe("plush");
    expect(state.rendered).toBe(state.expected);
    expect(state.radius).toBe("0");
    expect(state.controlSize).toBe("2rem");

    await view.evaluate(stubClipboard);
    await openPanel(view);
    await clickSelector(view, '[data-docs-customizer-action="copy"]');
    await waitForBrowser(view, "window.__copied.length === 1");
    expect(await view.evaluate("window.__copied[0]")).toBe(state.rendered);
  });
});

it("Default follows the theme and an explicit value survives a theme switch", async () => {
  await withBrowserPage(PAGE, async (view) => {
    await fresh(view);
    await openPanel(view);
    await choose(view, "theme", "plush");
    expect(await view.evaluate(rootToken("--radius-lg"))).toBe("1.5rem");

    await choose(view, "radius", "small");
    await choose(view, "theme", "tactile");
    expect(await view.evaluate(rootToken("--radius-lg"))).toBe("0.375rem");

    await choose(view, "theme", "plush");
    await choose(view, "radius", "default");
    expect(await view.evaluate(rootToken("--radius-lg"))).toBe("1.5rem");
  });
});

it("Reset restores the theme as shipped", async () => {
  await withBrowserPage(PAGE, async (view) => {
    await fresh(view);
    const initial = await view.evaluate(rootToken("--radius"));
    await openPanel(view);
    await choose(view, "theme", "tactile");
    await choose(view, "scheme", "dark");
    await choose(view, "radius", "large");
    await choose(view, "finish", "gloss");
    expect(await view.evaluate(`localStorage.getItem("${KEY}") !== null`)).toBe(true);

    await clickSelector(view, '[data-docs-customizer-action="reset"]');
    const state = await view.evaluate(`({
      theme: document.documentElement.getAttribute("data-theme"),
      scheme: document.documentElement.style.colorScheme,
      css: document.getElementById("docs-customizer-style").textContent,
      saved: localStorage.getItem("${KEY}"),
      radius: ${rootToken("--radius")},
      field: document.getElementById("docs-customizer-theme").value,
    })`);
    expect(state).toEqual({
      theme: null,
      scheme: "",
      css: "",
      saved: null,
      radius: initial,
      field: "default",
    });
  });
});

it("a share link reproduces the config and leaves a clean address", async () => {
  await withBrowserPage(PAGE, async (view) => {
    await fresh(view);
    await view.evaluate(stubClipboard);
    await openPanel(view);
    await choose(view, "theme", "tactile");
    await choose(view, "fields", "recessed");
    await clickSelector(view, '[data-docs-customizer-action="share"]');
    await waitForBrowser(view, "window.__copied.length === 1");
    const link = await view.evaluate("window.__copied[0]");
    expect(link).toContain("customize=1%2Ctheme%3Atactile%2Cfields%3Arecessed");

    await view.evaluate("(() => { localStorage.clear(); return true; })()");
    await view.navigate(link);
    const state = await view.evaluate(`({
      theme: document.documentElement.dataset.theme,
      search: location.search,
      saved: JSON.parse(localStorage.getItem("${KEY}")).fields,
    })`);
    expect(state).toEqual({ theme: "tactile", search: "", saved: "recessed" });
  });
});

it("opens beside the page on desktop and as a modal on phones, with its own tokens", async () => {
  await withBrowserPage(
    PAGE,
    async (view) => {
      await fresh(view);
      await setViewport(view, { width: 1400 });
      await openPanel(view);
      await choose(view, "radius", "large");
      await choose(view, "density", "compact");
      const desktop = await view.evaluate(`(() => {
        const panel = document.getElementById("docs-customizer");
        const style = getComputedStyle(panel);
        const content = document.querySelector(".docs-article").getBoundingClientRect();
        return {
          modal: panel.matches(":modal"),
          // The page under the content is not covered by a backdrop.
          reachable: !!document.elementFromPoint(content.left + 20, content.top + 20)?.closest(".docs-article"),
          radius: style.getPropertyValue("--radius").trim(),
          controlSize: style.getPropertyValue("--control-size").trim(),
          pageRadius: ${rootToken("--radius")},
        };
      })()`);
      expect(desktop).toEqual({
        modal: false,
        reachable: true,
        radius: "0.5rem",
        controlSize: "2.375rem",
        pageRadius: "0.875rem",
      });

      await view.evaluate(
        `(() => { document.getElementById("docs-customizer").close(); return true; })()`,
      );
      await setViewport(view, { width: 600 });
      await openPanel(view);
      expect(
        await view.evaluate(`document.getElementById("docs-customizer").matches(":modal")`),
      ).toBe(true);
    },
    { width: 1400 },
  );
});
