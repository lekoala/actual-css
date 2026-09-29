/*
 * Real-browser .choice-card contract, driven over Bun.WebView.
 *
 * The default card shows its control before any choice: a ring (radio) or a
 * box (checkbox) on the leading edge, level with the first row, that fills
 * with the check in place. The label's rows sit beside it and do not move on
 * check. Forced colors keep the resting ring, since it is the only sign of an
 * unchecked option.
 */
import { expect, test } from "bun:test";
import {
  browserAvailable,
  fixtureUrl,
  waitForBrowser,
  withBrowserPage,
} from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/choice-card.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

/* Card, first-row and indicator boxes, plus the indicator layers' state. */
function cardState(view, id) {
  return view.evaluate(`(() => {
    const card = document.getElementById(${JSON.stringify(id)});
    const first = card.querySelector("strong").getBoundingClientRect();
    const box = card.getBoundingClientRect();
    const ring = getComputedStyle(card, "::before");
    const check = getComputedStyle(card, "::after");
    return {
      left: box.left,
      right: box.right,
      top: box.top,
      firstLeft: first.left,
      firstTop: first.top,
      ringWidth: Number.parseFloat(ring.width),
      ringBorder: Number.parseFloat(ring.borderTopWidth),
      ringBorderColor: ring.borderTopColor,
      ringBg: ring.backgroundColor,
      ringTransform: ring.transform,
      ringRadius: ring.borderTopLeftRadius,
      checkTransform: check.transform,
    };
  })()`);
}

/* Pseudo-elements have no client rect: the indicator's box is derived from
   the card's content edge and the pseudo's resolved margin and size, and set
   against the first line box of the label's first row. */
function indicatorVsFirstLine(view, id) {
  return view.evaluate(`(() => {
    const card = document.getElementById(${JSON.stringify(id)});
    const cs = getComputedStyle(card);
    const ring = getComputedStyle(card, "::before");
    const box = card.getBoundingClientRect();
    const size = Number.parseFloat(ring.height);
    const left = box.left + Number.parseFloat(cs.borderLeftWidth) + Number.parseFloat(cs.paddingLeft);
    const top =
      box.top + Number.parseFloat(cs.borderTopWidth) + Number.parseFloat(cs.paddingTop) +
      Number.parseFloat(ring.marginTop);
    const range = document.createRange();
    range.selectNodeContents(card.querySelector("strong"));
    const lines = [...range.getClientRects()];
    const line = lines[0];
    return {
      left,
      right: left + size,
      mid: top + size / 2,
      lineLeft: line.left,
      lineMid: line.top + line.height / 2,
      lineCount: new Set(lines.map((r) => Math.round(r.top))).size,
    };
  })()`);
}

const settled = (id, checked) =>
  `(() => {
    if (document.getAnimations().length > 0) return false;
    const t = getComputedStyle(document.getElementById(${JSON.stringify(id)}), "::after").transform;
    return ${checked} ? t === "none" || t.startsWith("matrix(1, 0, 0, 1") : t.startsWith("matrix(0, 0, 0, 0");
  })()`;

const formValues = (view) =>
  view.evaluate(
    `[...new FormData(document.getElementById("form")).entries()].map(([k, v]) => k + "=" + v)`,
  );

it("a resting ring on the leading edge fills with the check in place", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await waitForBrowser(view, settled("me", false));
      const before = await cardState(view, "me");

      // Visible at rest: a round ring with no fill, check hidden.
      expect(before.ringTransform).toBe("none");
      expect(before.ringBorder).toBeGreaterThan(0);
      expect(before.ringBg).toBe("rgba(0, 0, 0, 0)");
      expect(before.ringRadius).not.toBe("0px");
      expect(before.checkTransform).toStartWith("matrix(0, 0, 0, 0");

      // Leading edge, ahead of the label, level with its first line — also
      // when the first row wraps.
      const slot = await indicatorVsFirstLine(view, "me");
      expect(slot.left).toBeGreaterThan(before.left);
      expect(slot.right).toBeLessThan(slot.lineLeft);
      expect(Math.abs(slot.mid - slot.lineMid)).toBeLessThan(1);
      const wrapped = await indicatorVsFirstLine(view, "long");
      expect(wrapped.lineCount).toBeGreaterThan(1);
      expect(Math.abs(wrapped.mid - wrapped.lineMid)).toBeLessThan(1);

      await view.evaluate(`document.getElementById("me").click()`);
      await waitForBrowser(view, settled("me", true));
      const after = await cardState(view, "me");

      // Filled with the selected colour; the label does not move.
      expect(after.ringBg).not.toBe("rgba(0, 0, 0, 0)");
      expect(after.ringBorderColor).toBe(after.ringBg);
      expect(after.firstLeft).toBe(before.firstLeft);
      expect(after.firstTop).toBe(before.firstTop);

      // The inputs are the controls: submission and radio exclusivity.
      await view.evaluate(`document.getElementById("partner").click()`);
      await view.evaluate(`document.getElementById("topping").click()`);
      expect(await formValues(view)).toEqual(["patient=partner", "topping=egg"]);

      // A checkbox rests as a rounded box, not a ring.
      const box = await cardState(view, "topping");
      expect(box.ringRadius).not.toBe(before.ringRadius);
    },
    { artifactName: "choice-card" },
  );
});

it("forced colors keep the resting ring and a distinct checked fill", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      await view.evaluate(`document.getElementById("me").click()`);
      await waitForBrowser(view, settled("me", true));
      const checked = await cardState(view, "me");
      const unchecked = await cardState(view, "partner");

      expect(unchecked.ringBorder).toBeGreaterThan(0);
      expect(unchecked.ringBorderColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(checked.ringBg).not.toBe(unchecked.ringBg);
    },
    {
      artifactName: "choice-card-forced",
      mediaFeatures: [{ name: "forced-colors", value: "active" }],
    },
  );
});
