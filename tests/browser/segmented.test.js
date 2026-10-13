/*
 * Real-browser .segmented contract, driven over Bun.WebView.
 *
 * One row of equal shares at least --control-size tall, inside a <fieldset>
 * whose sr-only legend takes no column. Under constraint the labels wrap and
 * the control stays inside its container. The three anatomies read their
 * selected state from :checked, aria-selected and aria-current; keyboard focus
 * draws an inset ring that a selected segment keeps distinct from its fill,
 * including in forced colors.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  pressKey,
  tabUntil,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/segmented.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

const ARROW_RIGHT = { code: "ArrowRight", windowsVirtualKeyCode: 39 };

const track = (id) => `(() => {
  const el = document.getElementById(${JSON.stringify(id)});
  const box = el.getBoundingClientRect();
  const pad = parseFloat(getComputedStyle(el).paddingInlineStart) + el.clientLeft;
  const segments = [...el.querySelectorAll(".segment")].map((s) => {
    const r = s.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(s);
    return {
      left: r.left,
      right: r.right,
      top: r.top,
      width: r.width,
      height: r.height,
      lines: Math.round(range.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight)),
    };
  });
  const probe = document.createElement("div");
  probe.style.blockSize = "var(--control-size)";
  el.append(probe);
  const controlSize = probe.getBoundingClientRect().height;
  probe.remove();
  const cs = getComputedStyle(el);
  const inner = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  return { left: box.left, right: box.right, height: box.height, inner, pad, controlSize, segments };
})()`;

const paint = (id) => `(() => {
  const cs = getComputedStyle(document.getElementById(${JSON.stringify(id)}));
  return {
    bg: cs.backgroundColor,
    color: cs.color,
    shadow: cs.boxShadow,
    borderColor: cs.borderTopColor,
    outlineStyle: cs.outlineStyle,
    outlineColor: cs.outlineColor,
    outlineOffset: parseFloat(cs.outlineOffset),
    outlineWidth: parseFloat(cs.outlineWidth),
  };
})()`;

it("one row of equal shares, control height, legend outside the grid", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      for (const id of ["radios", "small", "tabs", "nav"]) {
        const t = await view.evaluate(track(id));
        const widths = t.segments.map((s) => s.width);
        expect(new Set(t.segments.map((s) => Math.round(s.top))).size).toBe(1);
        // Equal shares although "Fiscal quarter" is far longer than "Day".
        for (const w of widths) expect(w).toBeCloseTo(widths[0], 0);
        // A minimum met exactly while every label holds on one line.
        expect(t.segments.every((s) => s.lines === 1)).toBe(true);
        expect(t.height).toBeCloseTo(t.controlSize, 0);
        // Segments fill the track: on a <fieldset>, a minimum on the track
        // alone left them short of it.
        for (const s of t.segments) expect(s.height).toBeCloseTo(t.inner, 0);
        // The sr-only legend is out of flow: the first segment starts at the
        // track's border and padding, not after an empty column.
        expect(t.segments[0].left - t.left).toBeCloseTo(t.pad, 0);
      }
      const regular = await view.evaluate(track("radios"));
      const small = await view.evaluate(track("small"));
      expect(small.height).toBeLessThan(regular.height);
    },
    { artifactName: "segmented-geometry" },
  );
});

it("a constrained track wraps its labels and stays inside its container", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const t = await view.evaluate(track("narrow"));
      const box = await view.evaluate(
        `(() => { const r = document.getElementById("narrow-box").getBoundingClientRect(); return { left: r.left, right: r.right }; })()`,
      );
      expect(t.right).toBeLessThanOrEqual(box.right + 0.5);
      expect(Math.max(...t.segments.map((s) => s.lines))).toBeGreaterThan(1);
      expect(t.segments[0].width).toBeCloseTo(t.segments[1].width, 0);
      // The row grew with the wrapped label; every segment spans it.
      expect(t.height).toBeGreaterThan(t.controlSize);
      expect(t.segments[1].height).toBeCloseTo(t.segments[0].height, 0);
    },
    { artifactName: "segmented-narrow" },
  );
});

it("selection follows :checked, aria-selected and aria-current", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const selected = await view.evaluate(paint("week"));
      const idle = await view.evaluate(paint("day"));
      expect(selected.bg).not.toBe(idle.bg);
      expect(selected.shadow).not.toBe("none");
      expect((await view.evaluate(paint("t1"))).bg).toBe(selected.bg);
      expect((await view.evaluate(paint("t2"))).bg).toBe(idle.bg);
      const navLinks = `document.querySelectorAll("#nav .segment")`;
      expect(await view.evaluate(`getComputedStyle(${navLinks}[0]).backgroundColor`)).toBe(
        selected.bg,
      );

      // The radio is still the control: it submits, and a disabled one dims.
      await view.evaluate(`document.getElementById("day").click()`);
      expect((await view.evaluate(paint("day"))).bg).toBe(selected.bg);
      expect(await view.evaluate(`new FormData(document.getElementById("form")).get("span")`)).toBe(
        "day",
      );
      expect(
        Number(await view.evaluate(`getComputedStyle(document.getElementById("year")).opacity`)),
      ).toBeLessThan(1);

      // The tablist takes the tabs runtime unchanged.
      await view.evaluate(`document.getElementById("t2").click()`);
      await waitForBrowser(view, `document.getElementById("p2").hidden === false`);
      expect((await view.evaluate(paint("t2"))).bg).toBe(selected.bg);
    },
    { artifactName: "segmented-selection" },
  );
});

it("keyboard focus draws an inset ring and arrows move the selection", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      expect(await tabUntil(view, `document.activeElement?.id === "week-input"`)).toBe(true);
      const ring = await view.evaluate(paint("week"));
      expect(ring.outlineStyle).toBe("solid");
      // Inset: an offset ring would cross the track padding onto a neighbour.
      expect(ring.outlineOffset).toBe(-ring.outlineWidth);
      expect((await view.evaluate(paint("day"))).outlineStyle).toBe("none");

      await pressKey(view, "ArrowRight", ARROW_RIGHT);
      await waitForBrowser(view, `document.querySelector("#quarter input").checked`);
      expect((await view.evaluate(paint("quarter"))).outlineStyle).toBe("solid");
      expect((await view.evaluate(paint("week"))).outlineStyle).toBe("none");
    },
    { artifactName: "segmented-focus" },
  );
});

it("forced colors mark selection with a fill and keep focus visible on it", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      expect(await tabUntil(view, `document.activeElement?.id === "week-input"`)).toBe(true);
      const selected = await view.evaluate(paint("week"));
      const idle = await view.evaluate(paint("day"));
      expect(selected.bg).not.toBe(idle.bg);
      // Focus and selection use separate channels: the ring is drawn in the
      // highlight's text color, so it never matches the fill it sits on.
      expect(selected.outlineStyle).toBe("solid");
      expect(selected.outlineColor).toBe(selected.color);
      expect(selected.outlineColor).not.toBe(selected.bg);
      // The UA's Canvas backplate behind the label is invisible to computed
      // style, yet it hid the text on the highlight: only opting out stops it.
      expect(
        await view.evaluate(`getComputedStyle(document.getElementById("week")).forcedColorAdjust`),
      ).toBe("none");
      expect((await view.evaluate(paint("year"))).color).not.toBe(idle.color);
      // The track's fill is gone; its transparent border is painted instead.
      expect((await view.evaluate(paint("radios"))).borderColor).not.toBe("rgba(0, 0, 0, 0)");
    },
    {
      artifactName: "segmented-forced",
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
    },
  );
});
