/*
 * in-view is the only thing standing between a reveal effect and content that
 * never appears: it must not hide what is already visible, must release an
 * element on its first intersection, and must not leave a removed element
 * pending. Focus, an in-page anchor and find-in-page can all reach an element
 * before the observer does, so each path is exercised with real input.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  clickSelector,
  fixtureUrl,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";
import { contrast, RASTERIZE } from "../../src/tooling/color.js";

const FIXTURE = "tests/browser/in-view.html";
const MARK_FIXTURE = "tests/browser/mark-sweep.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

// Exercise the source runtime without depending on a rebuilt distribution.
const bundle = await Bun.build({ entrypoints: ["src/js/full.js"], format: "iife", write: false });
if (!bundle.success) throw new AggregateError(bundle.logs, "Runtime test bundle failed");
const source = await bundle.outputs[0].text();

const read = (id) =>
  `(() => {
    const el = document.getElementById(${JSON.stringify(id)});
    const style = getComputedStyle(el);
    return {
      pending: el.classList.contains("is-pending"),
      opacity: style.opacity,
      duration: style.transitionDuration,
    };
  })()`;

it("mark sweep keeps contrast on both sides of the moving edge in both schemes", async () => {
  await withBrowserPage(
    fixtureUrl(MARK_FIXTURE),
    async (view) => {
      const rows = await view.evaluate(`(() => {
        const rgba = ${RASTERIZE};
        return [...document.querySelectorAll(".mark-sweep")].map(el => {
          const style = getComputedStyle(el);
          // Resolve the hook as a color inside its own scheme before the
          // canvas rasterizer sees it; custom properties keep light-dark().
          const swatch = document.createElement("span");
          swatch.style.color = "var(--mark-bg)";
          el.append(swatch);
          const fill = rgba(getComputedStyle(swatch).color);
          swatch.remove();
          return {
            name: el.closest("[data-theme]").dataset.theme + " " + el.textContent,
            ink: rgba(style.color),
            surface: rgba(getComputedStyle(el.closest("section")).backgroundColor),
            fill,
            size: style.backgroundSize,
          };
        });
      })()`);
      expect(rows).toHaveLength(14);
      for (const row of rows) {
        expect(row.size, row.name).toBe("0px 100%");
        // During a wipe, glyphs cross the moving edge: the foreground must
        // contrast with both the bare surface and the fully painted fill.
        expect(contrast(row.ink, row.surface), `${row.name} uncovered`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(row.ink, row.fill), `${row.name} highlighted`).toBeGreaterThanOrEqual(4.5);
      }
    },
    { width: 1100, height: 900, artifactName: "mark-sweep-contrast" },
  );
});

it("visible content is never hidden, and off-screen content is released once", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // Before any runtime: nothing is hidden.
      expect(await view.evaluate(read("visible"))).toMatchObject({
        pending: false,
        opacity: "1",
      });

      // Focus already inside an off-screen element before registration: it
      // must not be hidden behind the focused content.
      await view.evaluate(`document.getElementById("prefocused").focus({ preventScroll: true })`);

      await view.evaluate(`(() => { ${source} })()`);
      await waitForBrowser(
        view,
        `document.getElementById("offscreen").classList.contains("is-pending")`,
      );

      expect(await view.evaluate(read("prefocused"))).toMatchObject({
        pending: false,
        opacity: "1",
      });
      expect(await view.evaluate(`window.__pendingLog.includes("prefocused")`)).toBe(false);

      expect(await view.evaluate(read("visible"))).toMatchObject({ pending: false, opacity: "1" });
      // The class fades the element out; it is off screen, so the test waits
      // for the end state instead of sampling the transition's start.
      await waitForBrowser(
        view,
        `getComputedStyle(document.getElementById("offscreen")).opacity === "0"`,
      );
      expect(await view.evaluate(read("offscreen"))).toMatchObject({ pending: true, opacity: "0" });
      // A group hides its direct children, not itself.
      await waitForBrowser(
        view,
        `[...document.getElementById("group").children].every(child => getComputedStyle(child).opacity === "0")`,
      );
      expect(
        await view.evaluate(
          `[...document.getElementById("group").children].map(child => getComputedStyle(child).opacity)`,
        ),
      ).toEqual(["0", "0", "0"]);
      // Visible at load never entered the pending state, so it never flickered.
      expect(await view.evaluate(`window.__pendingLog.includes("visible")`)).toBe(false);
      expect(await view.evaluate(`window.__pendingLog.includes("offscreen")`)).toBe(true);

      // Element cleanup releases the state even if the element is torn down
      // before it ever intersects.
      await waitForBrowser(
        view,
        `document.getElementById("removed").classList.contains("is-pending")`,
      );
      await view.evaluate(
        `(() => { window.__removed = document.getElementById("removed"); window.__removed.remove(); })()`,
      );
      await waitForBrowser(view, `!window.__removed.classList.contains("is-pending")`);

      await view.evaluate(
        `document.getElementById("offscreen").scrollIntoView({ block: "center" })`,
      );
      await waitForBrowser(
        view,
        `!document.getElementById("offscreen").classList.contains("is-pending")`,
      );
      await waitForBrowser(
        view,
        `getComputedStyle(document.getElementById("offscreen")).opacity === "1"`,
      );

      // Released once: leaving the viewport and returning never re-hides it.
      await view.evaluate(`scrollTo(0, 0)`);
      await view.evaluate(
        `document.getElementById("offscreen").scrollIntoView({ block: "center" })`,
      );
      expect(
        await view.evaluate(`window.__pendingLog.filter(id => id === "offscreen").length`),
      ).toBe(1);
    },
    { width: 900, height: 700, artifactName: "in-view-lifecycle" },
  );
});

it("an entrance margin waits inside the viewport without hiding initially visible content", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`(() => {
        const edge = document.createElement("p");
        edge.id = "visible-edge";
        edge.className = "reveal";
        edge.dataset.enhance = "in-view";
        edge.dataset.inViewMargin = "0px 0px -64px 0px";
        edge.style.cssText = "position: fixed; bottom: 8px; margin: 0";
        edge.textContent = "Visible at the bottom edge";
        document.body.append(edge);
        document.getElementById("offscreen").dataset.inViewMargin = edge.dataset.inViewMargin;
      })()`);
      await view.evaluate(`(() => { ${source} })()`);
      await waitForBrowser(
        view,
        "document.getElementById('offscreen').classList.contains('is-pending')",
      );
      expect(await view.evaluate(read("visible-edge"))).toMatchObject({
        pending: false,
        opacity: "1",
      });
      expect(await view.evaluate("window.__pendingLog.includes('visible-edge')")).toBe(false);
      await waitForBrowser(
        view,
        "getComputedStyle(document.getElementById('offscreen')).opacity === '0'",
      );

      // Wait for a full-viewport observer to confirm that the element is on
      // screen; the inset observer must still keep the entrance pending.
      await view.evaluate(`(() => {
        const el = document.getElementById("offscreen");
        scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight + 24);
        return new Promise(resolve => {
          const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            observer.disconnect();
            resolve(true);
          });
          observer.observe(el);
        });
      })()`);
      expect(await view.evaluate(read("offscreen"))).toMatchObject({ pending: true, opacity: "0" });

      await view.evaluate(`(() => {
        const el = document.getElementById("offscreen");
        scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight + 96);
      })()`);
      await waitForBrowser(
        view,
        "!document.getElementById('offscreen').classList.contains('is-pending')",
      );
    },
    { width: 900, height: 700, artifactName: "in-view-margin" },
  );
});

it("pending content stays visible under reduced motion and in print", async () => {
  const pending = `(() => {
    document.getElementById("static-pending").classList.add("is-pending");
    document.getElementById("mark").classList.add("is-pending");
  })()`;
  const read = `({
    opacity: getComputedStyle(document.getElementById("static-pending")).opacity,
    mark: getComputedStyle(document.getElementById("mark")).backgroundSize,
  })`;
  const expected = { opacity: "1", mark: "100% 100%" };

  expect(
    await withBrowserPage(
      fixtureUrl(FIXTURE),
      async (view) => {
        await view.evaluate(pending);
        return view.evaluate(read);
      },
      {
        width: 900,
        height: 700,
        mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }],
        artifactName: "in-view-reduced",
      },
    ),
  ).toEqual(expected);

  expect(
    await withBrowserPage(
      fixtureUrl(FIXTURE),
      async (view) => {
        await view.evaluate(pending);
        return view.evaluate(read);
      },
      { width: 900, height: 700, media: "print", artifactName: "in-view-print" },
    ),
  ).toEqual(expected);
});

it("Tab releases a pending element before focus lands inside it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`(() => { ${source} })()`);
      await waitForBrowser(
        view,
        `document.getElementById("focus-zone").classList.contains("is-pending")`,
      );

      // scrollIntoView inside Tab would also satisfy the observer; the state
      // read below has to prove the focus path, so it asserts the CSS snapshot
      // that only :focus-within produces.
      expect(await tabUntil(view, `document.activeElement?.id === "focus-link"`)).toBe(true);
      expect(await view.evaluate(read("focus-zone"))).toEqual({
        pending: false,
        opacity: "1",
        duration: "0s",
      });
    },
    { width: 900, height: 700, artifactName: "in-view-focus" },
  );
});

it("an in-page anchor releases a pending target", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`(() => { ${source} })()`);
      await waitForBrowser(
        view,
        `document.getElementById("anchor-target").classList.contains("is-pending")`,
      );

      await clickSelector(view, "#anchor-link");
      await waitForBrowser(view, `location.hash === "#anchor-target"`);
      await waitForBrowser(
        view,
        `!document.getElementById("anchor-target").classList.contains("is-pending")`,
      );
      await waitForBrowser(
        view,
        `getComputedStyle(document.getElementById("anchor-target")).opacity === "1"`,
      );
    },
    { width: 900, height: 700, artifactName: "in-view-anchor" },
  );
});

it("find-in-page matches pending text and releases it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`(() => { ${source} })()`);
      // The phrase is still in the rendered layer while pending, so find
      // matches it and scrolling to the match releases the element.
      await waitForBrowser(
        view,
        `document.getElementById("mark").classList.contains("is-pending")`,
      );
      expect(
        await view.evaluate(`window.find("Needle phrase", false, false, true, false, true, false)`),
      ).toBe(true);
      await waitForBrowser(
        view,
        `!document.getElementById("mark").classList.contains("is-pending")`,
      );
      await waitForBrowser(
        view,
        `getComputedStyle(document.getElementById("mark")).backgroundSize === "100% 100%"`,
      );
    },
    { width: 900, height: 700, artifactName: "in-view-find" },
  );
});
