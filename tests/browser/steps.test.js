/*
 * Real-browser .steps connector contract, driven over Bun.WebView.
 *
 * Guards the --step-connector inheritance bug: the connector background must
 * follow the step's own --step-line (resolved at use site), so a .complete
 * step's connector turns the selected color while a normal step's connector
 * keeps the border color. A fixed parent default would freeze both to the
 * border color.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/steps.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("a complete step's connector follows its selected line color", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const steps = document.querySelectorAll(".steps > li");
        const after = (el) => getComputedStyle(el, "::after").backgroundColor;
        // The connector traces the marker's border, not its fill: for a normal
        // step the marker is a filled disc with a --border ring.
        const markerBorder = (el) => getComputedStyle(el, "::before").borderTopColor;
        return {
          completeAfter: after(steps[0]),
          completeMarkerBorder: markerBorder(steps[0]),
          // steps[2] is the unmarked future step — a plain connector and marker.
          normalAfter: after(steps[2]),
          normalMarkerBorder: markerBorder(steps[2]),
          // The connector box exists with no mark set. Guards the alt-text
          // @supports block: ungated, the alt-text grammar fails at
          // computed-value time on browsers without it and takes the default
          // line down to content none, which no colour check would see.
          plainContent: getComputedStyle(steps[0], "::after").content,
        };
      })()`);

      // A complete step's connector matches its selected marker ring.
      expect(result.completeAfter).toBe(result.completeMarkerBorder);
      // A normal step's connector matches its (border-color) marker ring.
      expect(result.normalAfter).toBe(result.normalMarkerBorder);
      // The two connectors are visibly different: complete = selected,
      // normal = border.
      expect(result.completeAfter).not.toBe(result.normalAfter);
      expect(result.plainContent).not.toBe("none");
    },
    { artifactName: "steps" },
  );
});

/*
 * A connector mark shares the line's box, so its two guards are that the glyph
 * carries the line's state colour, and that it stays inside the marker row —
 * .steps sets overflow-x: auto, which computes overflow-y to auto, so a mark
 * that outgrew --step-size would be silently clipped instead of overflowing.
 */
it("a connector mark takes the line's color and stays inside the marker row", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const ol = document.getElementById("marked");
        const items = [...ol.children];
        const after = (el) => getComputedStyle(el, "::after");
        const markerBorder = (el) => getComputedStyle(el, "::before").borderTopColor;
        return {
          completeMark: after(items[0]).content,
          completeMarkColor: after(items[0]).color,
          completeMarkerBorder: markerBorder(items[0]),
          normalMarkColor: after(items[2]).color,
          normalMarkerBorder: markerBorder(items[2]),
          // --step-connector: none leaves the glyph alone on a bare box.
          completeMarkBg: after(items[0]).backgroundColor,
          // No connector past the final step, mark or line.
          lastMark: after(items[2]).content,
          markerRow: getComputedStyle(items[0], "::before").blockSize,
          markBlockSize: after(items[0]).blockSize,
          // Content taller than the row would push scrollHeight past clientHeight.
          overflows: ol.scrollHeight > ol.clientHeight || ol.scrollWidth > ol.clientWidth,
        };
      })()`);

      // Alt text where supported, bare glyph below — either way the mark is
      // present and the final step has no connector at all.
      expect(result.completeMark).toMatch(/^"›"( \/ "")?$/);
      expect(result.lastMark).toBe("none");
      // The mark carries state exactly like the segment it replaces.
      expect(result.completeMarkColor).toBe(result.completeMarkerBorder);
      expect(result.normalMarkColor).toBe(result.normalMarkerBorder);
      expect(result.completeMarkColor).not.toBe(result.normalMarkColor);
      // The line is gone; only the glyph is painted.
      expect(result.completeMarkBg).toBe("rgba(0, 0, 0, 0)");
      // The box stays a hairline — the glyph overflows it, not the list.
      expect(Number.parseFloat(result.markBlockSize)).toBeLessThan(
        Number.parseFloat(result.markerRow),
      );
      expect(result.overflows).toBe(false);
    },
    { artifactName: "steps-mark" },
  );
});

/*
 * Collapse guards, in order of what would break silently:
 *
 * - The threshold is the scroll threshold. Items hold at --step-min, so the row
 *   is count x --step-min wide and the collapse must engage on exactly that
 *   pixel — 560px for five steps. Drifting off it would leave a band that both
 *   scrolls and shows every label.
 * - Collapsing must actually remove the overflow, and must not trade it for a
 *   cross-axis scrollbar (overflow-x: auto computes overflow-y to auto).
 * - The current label survives, the others keep their accessible text.
 * - Bare text falls back to scroll rather than shrinking with nothing to hide.
 * - Six steps is outside the 2..5 contract, so no rule fires.
 * - All three grant routes behave the same: the class on the row, the name
 *   declared in a stylesheet, and a wrapper carrying the shared name — that
 *   last one reaches the row and measures its region.
 */
it("a granted query container trades scroll for a compact row at the threshold", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const read = (id) => {
          const ol = document.getElementById(id);
          const items = [...ol.children];
          const other = items.find((li) => li.getAttribute("aria-current") !== "step");
          const current = items.find((li) => li.getAttribute("aria-current") === "step");
          const labelOf = (li) => li.querySelector(".step-label");
          const hidden = (li) => {
            const el = labelOf(li);
            return el ? getComputedStyle(el).position === "absolute" : null;
          };
          return {
            stepMin: getComputedStyle(other).getPropertyValue("--step-min").trim(),
            otherLabelHidden: hidden(other),
            currentLabelHidden: hidden(current),
            overflowPx: ol.scrollWidth - ol.clientWidth,
            // A horizontal scrollbar steals block space from the row.
            scrollbarPx: ol.offsetHeight - ol.clientHeight,
            // Every step's text stays in the DOM, collapsed or not.
            textPresent: items.every((li) => li.textContent.trim().length > 0),
          };
        };
        return {
          collapsed: read("collapsed"),
          expanded: read("expanded"),
          bare: read("bare-collapse"),
          six: read("six"),
          // Same behaviour when the anchor is named from a stylesheet.
          stylesheet: read("stylesheet-route"),
          // A wrapper grant measures that zone; the row fills it.
          ancestor: read("ancestor-grant"),
        };
      })()`);

      // 559px: one pixel under the five-step budget, so the row collapses.
      expect(result.collapsed.stepMin).toBe("1.75rem");
      expect(result.collapsed.otherLabelHidden).toBe(true);
      expect(result.collapsed.currentLabelHidden).toBe(false);
      expect(result.collapsed.overflowPx).toBe(0);
      expect(result.collapsed.scrollbarPx).toBe(0);
      expect(result.collapsed.textPresent).toBe(true);

      // 561px: above the budget, nothing collapses and nothing scrolls.
      expect(result.expanded.stepMin).toBe("7rem");
      expect(result.expanded.otherLabelHidden).toBe(false);
      expect(result.expanded.overflowPx).toBe(0);

      // Bare text keeps its budget and scrolls instead of half-collapsing.
      expect(result.bare.stepMin).toBe("7rem");
      expect(result.bare.overflowPx).toBeGreaterThan(0);

      // Six steps is outside the contract: no rule fires.
      expect(result.six.stepMin).toBe("7rem");
      expect(result.six.overflowPx).toBeGreaterThan(0);

      // The class is a convenience, not the API: naming the anchor in CSS is
      // equivalent.
      expect(result.stylesheet.stepMin).toBe("1.75rem");
      expect(result.stylesheet.otherLabelHidden).toBe(true);
      expect(result.stylesheet.overflowPx).toBe(0);

      // actual-container is shared, so a wrapper grant reaches the row inside
      // it — the width measured is the zone the row was allocated.
      expect(result.ancestor.stepMin).toBe("1.75rem");
      expect(result.ancestor.otherLabelHidden).toBe(true);
    },
    { artifactName: "steps-collapse" },
  );
});

/*
 * The collapse must never hide a focusable label. .sr-only leaves the element
 * in the tab order at 1x1 with clip-path: inset(50%), so the focus ring is
 * clipped to nothing and a keyboard user lands somewhere invisible. The flow
 * refuses to become a query container instead, keeping its labels and its
 * scroll. Guards the whole feature, since the docs invite an <a> as a label.
 */
it("an interactive flow gives its container name back", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const ol = document.getElementById("interactive");
        const link = ol.querySelector("a.step-label");
        link.focus();
        const r = link.getBoundingClientRect();
        const s = getComputedStyle(link);
        return {
          focused: document.activeElement === link,
          w: Math.round(r.width),
          h: Math.round(r.height),
          clipPath: s.clipPath,
          position: s.position,
          stepMin: getComputedStyle(link.parentElement)
            .getPropertyValue("--step-min").trim(),
          // Labels kept means the row scrolls, exactly as without the opt-in.
          overflowPx: ol.scrollWidth - ol.clientWidth,
        };
      })()`);

      expect(result.focused).toBe(true);
      // A focus ring needs a box appreciably larger than the 1x1 sr-only one.
      expect(result.w).toBeGreaterThan(10);
      expect(result.h).toBeGreaterThan(10);
      expect(result.clipPath).toBe("none");
      expect(result.position).not.toBe("absolute");
      // Nothing collapsed: full budget kept, scroll is the fallback.
      expect(result.stepMin).toBe("7rem");
      expect(result.overflowPx).toBeGreaterThan(0);
    },
    { artifactName: "steps-collapse-interactive" },
  );
});

/*
 * The guard reads structure, never state — one link anywhere refuses the whole
 * flow. That matters beyond symmetry: aria-current moves as the workflow
 * advances, so a guard keyed on state would switch the collapse on and off
 * under the user as the same link went future -> current -> complete. The
 * current-step case is conservative on purpose: its label is never hidden
 * (the collapse rules exclude it), so refusing is not strictly required, but a
 * flow that will collapse differently at step 3 than at step 4 is worse than
 * one that never collapses.
 */
it("the collapse guard ignores step state", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const read = (id) => {
          const ol = document.getElementById(id);
          const items = [...ol.children];
          // Read a non-current label: the one the collapse would have hidden.
          const other = items.find((li) => li.getAttribute("aria-current") !== "step");
          const label = other.querySelector(".step-label");
          return {
            stepMin: getComputedStyle(other).getPropertyValue("--step-min").trim(),
            labelHidden: getComputedStyle(label).position === "absolute",
            overflowPx: ol.scrollWidth - ol.clientWidth,
          };
        };
        return {
          completeLink: read("interactive"),
          futureLink: read("future-link"),
          currentLink: read("current-link"),
          // The control: same width, same count, no link at all.
          noLink: read("collapsed"),
        };
      })()`);

      for (const key of ["completeLink", "futureLink", "currentLink"]) {
        expect(result[key].stepMin).toBe("7rem");
        expect(result[key].labelHidden).toBe(false);
        expect(result[key].overflowPx).toBeGreaterThan(0);
      }

      // And the guard is the reason, not the width: without a link it collapses.
      expect(result.noLink.stepMin).toBe("1.75rem");
      expect(result.noLink.labelHidden).toBe(true);
      expect(result.noLink.overflowPx).toBe(0);
    },
    { artifactName: "steps-collapse-states" },
  );
});
