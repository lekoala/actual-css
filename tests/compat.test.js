import { expect, test } from "bun:test";
import { mixedVendorSelectorLists } from "../scripts/check-compat.js";

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
