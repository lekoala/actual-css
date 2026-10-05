/*
 * A breadcrumb that does not fit stays one line and truncates instead of
 * scrolling: ancestors give up their characters before the current page, a
 * label shorter than the floor keeps its own width, and the ellipsis never
 * clips a link's focus line.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  tabUntil,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/breadcrumb.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

// Shrinks a box by a share of its ancestor labels' natural width, then reads
// which labels truncate and whether the trail still fits. Half the ancestors
// stays inside their slack above the floor, and is a deficit large enough
// that a shrink ratio of 1000 still handed the current page a fraction of a
// pixel — the trap the huge ratio exists for.
const SQUEEZE = `(id, share) => {
  const list = document.getElementById(id);
  const box = list.closest(".box");
  box.style.inlineSize = "max-content";
  const natural = list.getBoundingClientRect().width;
  const ancestors = [...list.children].slice(0, -1)
    .reduce((sum, li) => sum + li.querySelector("a, span").getBoundingClientRect().width, 0);
  box.style.inlineSize = natural - Math.max(40, ancestors * share) + "px";
  // Fractional on purpose: scrollWidth and clientWidth round to integers and
  // missed the sub-pixel cut that already drew an ellipsis.
  const cut = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const text = range.getBoundingClientRect().width;
    const style = getComputedStyle(el);
    const content = el.getBoundingClientRect().width
      - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    return text > content + 0.01;
  };
  return {
    overflows: list.scrollWidth > list.clientWidth,
    lastChildEnd: list.lastElementChild.getBoundingClientRect().right - list.getBoundingClientRect().right,
    labels: [...list.children].map((li) => cut(li.querySelector("a, span") ?? li)),
  };
}`;

it("ancestors truncate before the current page, which truncates last", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const squeeze = ${SQUEEZE};
        return { ancestors: squeeze("ancestors", 0.5), bare: squeeze("bare", 0.5) };
      })()`);

      // Ancestors absorb the squeeze; not a fraction of a pixel reaches the
      // current page, or its ellipsis would show while ancestors had room.
      expect(result.ancestors.overflows).toBe(false);
      expect(result.ancestors.lastChildEnd).toBeLessThanOrEqual(0.5);
      expect(result.ancestors.labels.slice(0, -1)).toContain(true);
      expect(result.ancestors.labels.at(-1)).toBe(false);

      // Nothing left to take from one-letter ancestors: the bare-text current
      // page truncates on its own item.
      expect(result.bare.overflows).toBe(false);
      expect(result.bare.labels).toEqual([false, false, true]);
    },
    { artifactName: "breadcrumb-truncate" },
  );
});

it("a label shorter than the floor keeps its own width", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const result = await view.evaluate(`(() => {
        const label = document.getElementById("short-label");
        const range = document.createRange();
        range.selectNodeContents(label);
        return { box: label.getBoundingClientRect().width, text: range.getBoundingClientRect().width };
      })()`);
      // The floor only stops a long label collapsing; it pads no short one.
      expect(result.box - result.text).toBeLessThanOrEqual(1);
    },
    { artifactName: "breadcrumb-short" },
  );
});

/* Both places a link can sit: an ancestor label, and the current page's link
   inside an <li aria-current>. The bare-text rule once matched that item too,
   and its overflow cut the link's focus line. */
it("a link keeps its whole focus line, wherever aria-current sits", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`(() => {
        const squeeze = ${SQUEEZE};
        squeeze("ancestors", 0.5);
        squeeze("item-current", 0.5);
      })()`);
      for (const id of ["truncated-link", "item-current-link"]) {
        expect(await tabUntil(view, `document.activeElement?.id === ${JSON.stringify(id)}`)).toBe(
          true,
        );
        const result = await view.evaluate(`(() => {
          const link = document.activeElement;
          const clippers = [];
          for (let el = link.parentElement; el && el !== document.body; el = el.parentElement) {
            if (getComputedStyle(el).overflow !== "visible") clippers.push(el.tagName);
          }
          return { outline: parseFloat(getComputedStyle(link).outlineWidth), clippers };
        })()`);
        expect(result.outline, id).toBeGreaterThan(0);
        // The link clips its own text but never its own outline; an ancestor
        // with overflow would cut the line drawn outside the link box.
        expect(result.clippers, id).toEqual([]);
      }
    },
    { artifactName: "breadcrumb-focus" },
  );
});

it("a link inside an aria-current item still truncates as a label", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // Ancestors squeezed to their floor, so the current page must give way.
      const result = await view.evaluate(`(${SQUEEZE})("item-current", 1)`);
      expect(result.overflows).toBe(false);
      expect(result.labels.at(-1)).toBe(true);
    },
    { artifactName: "breadcrumb-item-current" },
  );
});
