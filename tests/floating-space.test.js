import { afterEach, expect, test } from "bun:test";
import { readPlacement } from "../src/js/floating-space.js";
import { cleanupDOM, setupDOM } from "./helpers/dom.js";

afterEach(() => {
  cleanupDOM();
});

function captureWarnings(run) {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);
  try {
    run();
  } finally {
    console.warn = originalWarn;
  }
  return warnings;
}

test("readPlacement returns a known placement", () => {
  setupDOM('<div data-tooltip-placement="right-start"></div>');
  const el = document.querySelector("div");

  expect(readPlacement(el, "data-tooltip-placement")).toBe("right-start");
});

test("readPlacement returns null for a missing attribute", () => {
  setupDOM("<div></div>");

  expect(readPlacement(document.querySelector("div"), "data-tooltip-placement")).toBeNull();
  expect(readPlacement(null, "data-tooltip-placement")).toBeNull();
});

test("an unknown placement is ignored with one warning per element", () => {
  setupDOM('<div data-flyout-placement="rigth"></div>');
  const el = document.querySelector("div");

  const warnings = captureWarnings(() => {
    expect(readPlacement(el, "data-flyout-placement")).toBeNull();
    expect(readPlacement(el, "data-flyout-placement")).toBeNull();
  });

  expect(warnings).toHaveLength(1);
  expect(warnings[0][0]).toBe('Unknown data-flyout-placement="rigth" ignored');
  expect(warnings[0][1]).toBe(el);
});
