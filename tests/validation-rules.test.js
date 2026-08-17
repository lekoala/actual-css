import { expect, test } from "bun:test";
import FormValidator from "../src/js/validation.js";

test("number rule accepts decimal syntax", () => {
  const number = FormValidator.rules.number;
  for (const valid of ["42", "3.14", "-7", "+7", ".5", "1e3", "1.5e-2", "0"]) {
    expect(number(valid), `accepts ${valid}`).toBe(true);
  }
});

test("number rule rejects non-decimal JS number syntax", () => {
  const number = FormValidator.rules.number;
  for (const invalid of ["0x10", "Infinity", "-Infinity", "NaN", "1_000", "1e", "abc", ""]) {
    expect(number(invalid), `rejects ${invalid}`).toBe(false);
  }
});

test("registerRule validates its arguments", () => {
  expect(() => FormValidator.registerRule("", () => true)).toThrow(TypeError);
  expect(() => FormValidator.registerRule("   ", () => true)).toThrow(TypeError);
  expect(() => FormValidator.registerRule("shout", "not a function")).toThrow(TypeError);
});
