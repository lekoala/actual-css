/*
 * Material theme table hover, driven over Bun.WebView with dispatched pointer
 * moves (`:hover` only follows real input).
 *
 * The theme replaces the core per-row hover with one layer anchored to the
 * hovered body row: it covers that row, slides to the next one through a
 * transition, hides when no row is hovered, and never answers another table's
 * row.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/material-table.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

async function pointAt(view, selector) {
  const point = await view.evaluate(`(() => {
    const rect = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  })()`);
  await view.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
}

/* The layer's insets against the row's box, both relative to the table. */
const layer = (table, row) => `(() => {
  const table = document.getElementById(${JSON.stringify(table)});
  const box = table.getBoundingClientRect();
  const cs = getComputedStyle(table, "::after");
  const row = ${row ? `document.getElementById(${JSON.stringify(row)}).getBoundingClientRect()` : "null"};
  return {
    opacity: Number(cs.opacity),
    top: Number.parseFloat(cs.top),
    bottom: Number.parseFloat(cs.bottom),
    rowTop: row && row.top - box.top,
    rowBottom: row && box.bottom - row.bottom,
    rowBg: ${row ? `getComputedStyle(document.getElementById(${JSON.stringify(row)})).backgroundColor` : "null"},
    // Chrome reports the block insets as physical longhands (top, bottom).
    sliding: document.getAnimations().some(
      (a) => a.effect?.pseudoElement === "::after" && a.transitionProperty !== "opacity",
    ),
  };
})()`;

/* Settled on the row: no transition left and the layer matches its box. */
const coversRow = (table, row) => `(() => {
  if (document.getAnimations().length > 0) return false;
  const s = ${layer(table, row)};
  return s.opacity === 1 && Math.abs(s.top - s.rowTop) <= 1 && Math.abs(s.bottom - s.rowBottom) <= 1;
})()`;

it("one layer covers the hovered row, slides between rows and hides on leave", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      expect((await view.evaluate(layer("invoices"))).opacity).toBe(0);

      await pointAt(view, "#row-1");
      await waitForBrowser(view, coversRow("invoices", "row-1"));
      // The layer paints the hover, so the core row background steps aside.
      expect((await view.evaluate(layer("invoices", "row-1"))).rowBg).toBe("rgba(0, 0, 0, 0)");
      // The other table keeps its layer hidden: anchors are scoped per table.
      expect((await view.evaluate(layer("other"))).opacity).toBe(0);

      // Row to row is a transition on the insets, not a switch; the taller
      // row proves the layer follows the row's real height.
      await pointAt(view, "#row-3");
      expect((await view.evaluate(layer("invoices"))).sliding).toBe(true);
      await waitForBrowser(view, coversRow("invoices", "row-3"));

      await pointAt(view, "thead th");
      await waitForBrowser(view, `${layer("invoices")}.opacity === 0`);
    },
    { artifactName: "material-table" },
  );
});
