/*
 * Tooltip stacking over a surface — a regression the surface migration left.
 *
 * The z-index scale states the intent: --z-tooltip: 50 sits above
 * --z-menu: 20. That comparison stopped meaning anything when surface.js
 * moved to popover="manual": the panel is promoted to the top layer, which
 * paints above every z-index in the document. A tooltip opened from inside a
 * flyout is still an ordinary fixed element, so it is occluded by the panel
 * it belongs to.
 *
 * Only a real browser can see this. happy-dom neither lays out nor hit-tests,
 * and no DOM assertion distinguishes "painted above" from "painted below" —
 * hence the elementFromPoint probe rather than a class or attribute check.
 *
 * The modal case carries a second contract that must survive the fix: the
 * shorthand tip is created inside the dialog subtree. Top-layer promotion does
 * not lift an element out of a modal dialog's inertness, which is DOM-based;
 * only membership in the dialog subtree does.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/tooltip-stacking.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withPage = (name, run) =>
  withBrowserPage(fixtureUrl(FIXTURE), run, {
    artifactName: `tooltip-stacking-${name}`,
    mediaFeatures: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });

// Hover is what the delegated listener listens for; the 150ms show delay plus
// the first positioning tick is what the sleep covers.
const hover = (view, id) =>
  view.evaluate(`document.getElementById("${id}").dispatchEvent(
    new MouseEvent("mouseover", { bubbles: true })
  )`);

/*
 * Probes the tip's own centre. Reported as a bundle rather than a single
 * boolean so a failure says which of the three ways this can go wrong it was:
 * the tip never showed, it showed without overlapping the panel (the geometry
 * assumption broke), or it showed, overlapped, and lost the hit test.
 */
const probe = (view, panelId) =>
  view
    .evaluate(`(() => {
      const panel = document.getElementById("${panelId}");
      const tip = panel.ownerDocument.querySelector('[role="tooltip"]');
      if (!tip) return JSON.stringify({ tip: false });

      const t = tip.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      const x = Math.round(t.left + t.width / 2);
      const y = Math.round(t.top + t.height / 2);
      const at = tip.ownerDocument.elementFromPoint(x, y);

      return JSON.stringify({
        tip: true,
        shown: !tip.hidden && t.width > 0,
        // The fixture places the tip below an item near the panel top, so it
        // must land over the items underneath for the probe to mean anything.
        overlapsPanel: t.left < p.right && t.right > p.left && t.top < p.bottom && t.bottom > p.top,
        winsHitTest: at ? tip === at || tip.contains(at) : false,
        hitElement: at ? at.id || at.className || at.tagName : null,
        parentIsDialog: tip.parentElement?.tagName === "DIALOG",
      });
    })()`)
    .then(JSON.parse);

it("a tooltip opened from a flyout paints above the panel", async () => {
  await withPage("plain", async (view) => {
    await view.evaluate(`document.getElementById("plain-trigger").click()`);
    await sleep(300);
    await hover(view, "plain-tip-trigger");
    await sleep(400);

    const state = await probe(view, "plain-panel");

    expect(state.tip).toBe(true);
    expect(state.shown).toBe(true);
    expect(state.overlapsPanel).toBe(true);
    expect(state.winsHitTest).toBe(true);
  });
});

it("a tooltip opened from a flyout inside a modal dialog paints above the panel", async () => {
  await withPage("modal", async (view) => {
    await view.evaluate(`document.getElementById("open-dialog").click()`);
    await sleep(300);
    await view.evaluate(`document.getElementById("dlg-trigger").click()`);
    await sleep(300);
    await hover(view, "dlg-tip-trigger");
    await sleep(400);

    const state = await probe(view, "dlg-panel");

    expect(state.tip).toBe(true);
    expect(state.shown).toBe(true);
    // Created inside the dialog, not at body level: outside it the tip would
    // be inert, and elementFromPoint would fail for that reason instead.
    expect(state.parentIsDialog).toBe(true);
    expect(state.overlapsPanel).toBe(true);
    expect(state.winsHitTest).toBe(true);
  });
});
