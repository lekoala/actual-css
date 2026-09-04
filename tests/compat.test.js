import { expect, test } from "bun:test";
import { auditCss, mixedVendorSelectorLists } from "../scripts/check-compat.js";

test("vendor selector guard rejects a vendor pseudo mixed with a standard selector", () => {
  const violations = mixedVendorSelectorLists(".a, .b::-moz-range-thumb { color: red; }");

  expect(violations).toHaveLength(1);
  expect(violations[0].selector).toBe(".a, .b::-moz-range-thumb");
});

test("vendor selector guard rejects different engines in one list or selector", () => {
  expect(
    mixedVendorSelectorLists(".a::-webkit-slider-thumb, .a::-moz-range-thumb { color: red; }"),
  ).toHaveLength(1);
  expect(
    mixedVendorSelectorLists(".a::-webkit-slider-thumb::-moz-range-thumb { color: red; }"),
  ).toHaveLength(1);
});

test("vendor selector guard accepts lists from one engine and separate vendor rules", () => {
  const css = `
    .a:is(.x, .y)::-moz-range-thumb,
    .b::-moz-range-thumb { color: red; }
    .a::-webkit-slider-thumb { color: blue; }
  `;

  expect(mixedVendorSelectorLists(css)).toEqual([]);
});

/*
 * Tier says how far above the Minimal floor a capability sits; kind says what
 * happens on an engine that lacks it. Only kind can excuse a use, so an
 * optional-tier capability whose absence changes which elements get styled
 * still needs a machine-checkable guard.
 */

test("an unguarded optional structural capability is a violation", () => {
  const { violations, optional } = auditCss(".flyout[popover] { inset: auto; }");

  expect(violations).toHaveLength(1);
  expect(violations[0]).toContain("popover attribute");
  expect(optional).toEqual([]);
});

test("@supports excuses an optional structural capability and reports it as optional", () => {
  const css = `@supports selector(:popover-open) {
  .flyout[popover] { inset: auto; }
}`;
  const { violations, optional } = auditCss(css);

  expect(violations).toEqual([]);
  expect(optional.some((entry) => entry.includes("popover attribute"))).toBe(true);
});

test("a compat-ok pragma excuses an optional structural capability", () => {
  const css = `/* compat-ok: forgiving :is() drops the unknown member. */
.flyout:is(.is-open, :popover-open) { inset: auto; }`;
  const { violations, optional } = auditCss(css);

  expect(violations).toEqual([]);
  expect(optional.some((entry) => entry.includes(":popover-open"))).toBe(true);
});

/*
 * The regression that motivated the pragma: a comment explaining *why* a
 * capability needs a gate reads, to a keyword matcher, exactly like a comment
 * excusing its absence. Prose must not clear an optional structural use.
 */
test("prose does not excuse an optional structural capability", () => {
  const css = `/* Gated because the attribute selector still matches on engines
   without Popover, which is a progressive-enhancement fallback concern. */
.flyout[popover] { inset: auto; }`;

  expect(auditCss(css).violations).toHaveLength(1);
});

test("prose still excuses a recommended structural capability", () => {
  const css = `/* Progressive: without :has() the base layout still works. */
.join:has(> .btn) { gap: 0; }`;
  const { violations, progressive } = auditCss(css);

  expect(violations).toEqual([]);
  expect(progressive.some((entry) => entry.includes(":has()"))).toBe(true);
});

test("an optional safe-drop capability needs no guard", () => {
  const { violations, optional } = auditCss(".flyout { position-area: block-end; }");

  expect(violations).toEqual([]);
  expect(optional.some((entry) => entry.includes("anchor positioning"))).toBe(true);
});

/*
 * :popover-open is only safe inside a forgiving list, so an ordinary selector
 * list — where an unsupported member invalidates the entire rule — must be
 * flagged rather than waved through.
 */
test("a plain selector list carrying :popover-open is a violation", () => {
  const { violations } = auditCss(".a,\n.b:popover-open { opacity: 1; }");

  expect(violations).toHaveLength(1);
  expect(violations[0]).toContain(":popover-open");
});

test("the popover attribute pattern covers values and rejects lookalikes", () => {
  for (const selector of [
    ".flyout[popover]",
    '.flyout[popover="manual"]',
    ".flyout[popover=auto]",
    ".btn[popovertarget]",
    '.btn[popovertargetaction="hide"]',
  ]) {
    expect(auditCss(`${selector} { inset: auto; }`).violations).toHaveLength(1);
  }

  for (const selector of [".x[popover-foo]", ".x[popoverfoo]", ".x[data-popover]"]) {
    expect(auditCss(`${selector} { inset: auto; }`).violations).toEqual([]);
  }
});
