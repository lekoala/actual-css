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
 * Kind says what happens on an engine that lacks the capability; tier only says
 * which Actual tier first guarantees it. Only kind can excuse a use, so a
 * capability whose absence changes which elements get styled needs a guard, a
 * justification, or a ledger entry whatever its tier.
 */

test("an unguarded structural capability is a violation", () => {
  const { violations, progressive } = auditCss(".steps > li { grid-template-rows: subgrid; }");

  expect(violations).toHaveLength(1);
  expect(violations[0]).toContain("subgrid");
  expect(progressive).toEqual([]);
});

test("@supports excuses a structural capability and reports it as progressive", () => {
  const css = `@supports (grid-template-rows: subgrid) {
  .steps > li { grid-template-rows: subgrid; }
}`;
  const { violations, progressive } = auditCss(css);

  expect(violations).toEqual([]);
  expect(progressive.some((entry) => entry.includes("subgrid"))).toBe(true);
});

test("prose excuses a structural capability with a documented fallback", () => {
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
 * Popover is a runtime requirement now, not a tracked capability: the audit
 * must not flag Actual's own transport rules, and must not report them as an
 * above-floor enhancement either.
 */
test("popover selectors are no longer audited", () => {
  const css = `.flyout[popover] { inset: auto; }
.flyout[popover]:not(:popover-open) { display: none; }`;
  const { violations, progressive, optional } = auditCss(css);

  expect(violations).toEqual([]);
  expect(progressive).toEqual([]);
  expect(optional).toEqual([]);
});
