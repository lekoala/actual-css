import { afterEach, expect, test } from "bun:test";
import FormValidator from "../src/js/validation.js";
import { cleanupDOM, setupDOM } from "./helpers/dom.js";

let importId = 0;

afterEach(() => {
  cleanupDOM();
});

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

test("starts-with matches any literal prefix after trim", () => {
  const startsWith = FormValidator.rules["starts-with"];
  expect(startsWith("  INV-42 ", null, "INV-", "CR-")).toBe(true);
  expect(startsWith("CR-7", null, "INV-", "CR-")).toBe(true);
  expect(startsWith("PO-1", null, "INV-", "CR-")).toBe(false);
  expect(startsWith("+32 470 12 34 56", null, "0", "+32")).toBe(true);
  expect(startsWith("0470/12.34.56", null, "0", "+32")).toBe(true);
  expect(startsWith("inv-42", null, "INV-")).toBe(false);
});

test("starts-with fails without a literal option", () => {
  const startsWith = FormValidator.rules["starts-with"];
  expect(startsWith("INV-42", null)).toBe(false);
});

test("ends-with matches any literal suffix after trim", () => {
  const endsWith = FormValidator.rules["ends-with"];
  expect(endsWith(" report.pdf ", null, ".pdf", ".csv")).toBe(true);
  expect(endsWith("data.csv", null, ".pdf", ".csv")).toBe(true);
  expect(endsWith("photo.png", null, ".pdf", ".csv")).toBe(false);
  expect(endsWith("report.PDF", null, ".pdf")).toBe(false);
});

test("ends-with fails without a literal option", () => {
  const endsWith = FormValidator.rules["ends-with"];
  expect(endsWith("report.pdf", null)).toBe(false);
});

test("tel-prefix accepts local input whatever its format", () => {
  const telPrefix = FormValidator.rules["tel-prefix"];
  for (const local of ["0470 12 34 56", "02/123.45.67", "0470-12-34-56", "12345"]) {
    expect(telPrefix(local, null, "+32"), `accepts local ${local}`).toBe(true);
  }
});

test("tel-prefix matches only an allowed explicit international prefix", () => {
  const telPrefix = FormValidator.rules["tel-prefix"];
  expect(telPrefix("+32 470 12 34 56", null, "+32")).toBe(true);
  expect(telPrefix("0032 470 12 34 56", null, "+32")).toBe(true);
  expect(telPrefix("(+32) 470 12 34 56", null, "+32")).toBe(true);
  expect(telPrefix("+32 (0) 470 12 34 56", null, "+32")).toBe(true);
  expect(telPrefix("+33 6 12 34 56 78", null, "+32")).toBe(false);
  expect(telPrefix("0033 6 12 34 56 78", null, "+32")).toBe(false);
  expect(telPrefix("+49 30 123456", null, "+32")).toBe(false);
});

test("tel-prefix accepts a list of allowed prefixes", () => {
  const telPrefix = FormValidator.rules["tel-prefix"];
  expect(telPrefix("+33 6 12 34 56 78", null, "+32", "+33", "+352")).toBe(true);
  expect(telPrefix("00352 27 12 34", null, "+32", "+33", "+352")).toBe(true);
  expect(telPrefix("+49 30 123456", null, "+32", "+33", "+352")).toBe(false);
});

test("tel-prefix with no prefix is local-only", () => {
  const telPrefix = FormValidator.rules["tel-prefix"];
  expect(telPrefix("0470 12 34 56", null)).toBe(true);
  expect(telPrefix("+32 470 12 34 56", null)).toBe(false);
  expect(telPrefix("0032 470 12 34 56", null)).toBe(false);
});

test("tel-prefix reads bare 00 or + as international, never local", () => {
  const telPrefix = FormValidator.rules["tel-prefix"];
  expect(telPrefix("  +32 470 12 34 56  ", null, "+32")).toBe(true);
  expect(telPrefix("00", null, "+32")).toBe(false);
  expect(telPrefix("+", null, "+32")).toBe(false);
});

test("tel-prefix rejects values that are not dialing digits", () => {
  const telPrefix = FormValidator.rules["tel-prefix"];
  expect(telPrefix("gfhgfgh", null, "+32")).toBe(false);
  expect(telPrefix("0470 abc", null, "+32")).toBe(false);
  expect(telPrefix("+32abc", null, "+32")).toBe(false);
  expect(telPrefix("call-me", null, "+32")).toBe(false);
});

test("registerRule validates its arguments", () => {
  expect(() => FormValidator.registerRule("", () => true)).toThrow(TypeError);
  expect(() => FormValidator.registerRule("   ", () => true)).toThrow(TypeError);
  expect(() => FormValidator.registerRule("shout", "not a function")).toThrow(TypeError);
});

test("data-validation-rules resolves a hyphenated rule with literal tokens", async () => {
  setupDOM(`
    <form data-enhance="validation">
      <div class="field">
        <input class="input" name="reference" data-validation-rules="starts-with INV- CR-"
               aria-describedby="reference-error" />
        <span class="field-error" id="reference-error"></span>
      </div>
    </form>
  `);
  await import(`../src/js/validation.js?rules=${++importId}`);

  const form = document.querySelector("form");
  const input = form.querySelector("input");

  input.value = "PO-1";
  form.requestSubmit();
  expect(input.getAttribute("aria-invalid")).toBe("true");

  input.value = "INV-1";
  form.requestSubmit();
  expect(input.getAttribute("aria-invalid")).toBeNull();
});

test("data-validation-rules resolves tel-prefix with a +32 option", async () => {
  setupDOM(`
    <form data-enhance="validation">
      <div class="field">
        <input class="input" type="tel" name="phone" data-validation-rules="tel-prefix +32"
               aria-describedby="phone-error" />
        <span class="field-error" id="phone-error"></span>
      </div>
    </form>
  `);
  await import(`../src/js/validation.js?rules=${++importId}`);

  const form = document.querySelector("form");
  const input = form.querySelector("input");

  input.value = "+33 6 12 34 56 78";
  form.requestSubmit();
  expect(input.getAttribute("aria-invalid")).toBe("true");

  input.value = "0032 470 12 34 56";
  form.requestSubmit();
  expect(input.getAttribute("aria-invalid")).toBeNull();
});
