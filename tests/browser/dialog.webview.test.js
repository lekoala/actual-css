/*
 * Real-browser Dialog scroll/lifecycle contract, driven over Bun.WebView.
 *
 * POC port of the most historically suspect dialog test (scroll preservation
 * across open) against the Chrome backend of Bun.WebView. Clicks stay on the
 * evaluate path for parity: the fixture is scrolled before clicking, so a
 * native selector click would wait on actionability of an off-viewport button.
 * Run a stress pass with STRESS_REPEATS before removing it.
 */
import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/dialog.html";
const STRESS_REPEATS = 20;
const TIMEOUT = 60_000 + STRESS_REPEATS * 10_000;

const hasWebView = await browserAvailable();
const distReady = existsSync("dist/actual.full.js");
const skip = !hasWebView || !distReady;
const baseTest = skip ? test.skip : test;
const it = (name, run, options = {}) =>
  baseTest(name, run, { timeout: TIMEOUT, ...options });

const scrollTo1200 = (view) =>
  view.evaluate("(() => { window.scrollTo(0, 1200); return window.scrollY; })()");

it("open from a scrolled page keeps the scroll position and locks the page", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const evalIn = (expression) => view.evaluate(expression);
      const settle = () => view.evaluate("new Promise((r) => setTimeout(r, 60))");
      const snapshot = (id) =>
        evalIn(`(() => {
          const d = document.getElementById(${JSON.stringify(id)});
          const rect = d?.getBoundingClientRect();
          return {
            scrollY: window.scrollY,
            open: d ? d.open : null,
            staticClass: d ? d.classList.contains("is-static") : null,
            modalLock: document.documentElement.classList.contains("has-modal-open"),
            activeId: document.activeElement?.id ?? document.activeElement?.tagName ?? null,
            position: d ? getComputedStyle(d).position : null,
            inViewport: rect
              ? rect.top >= 0 && rect.left >= 0 && rect.bottom <= innerHeight && rect.right <= innerWidth
              : null,
          };
        })()`);

      const trace = [];
      trace.push(["before", await scrollTo1200(view)]);
      await evalIn("document.getElementById('open-dismissible').click()");
      await settle();
      trace.push(["afterOpen", await evalIn("window.scrollY")]);
      const state = await snapshot("dlg-dismissible");

      expect(state.open).toBe(true);
      expect(state.modalLock).toBe(true);
      expect(state.position).toBe("fixed");
      expect(state.inViewport).toBe(true);
      expect(state.scrollY).toBe(trace[0][1]);
      expect(state.scrollY).toBeGreaterThan(500);
    },
    {
      mediaFeatures: [{ name: "prefers-reduced-motion", value: "reduce" }],
      artifactName: "dialog-scroll",
    },
  );
}, { repeats: STRESS_REPEATS });