import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readCss(path) {
  return readFileSync(join(import.meta.dir, "..", path), "utf8");
}

const validationCss = () => readCss("src/css/forms/validation.css");

test("invalid border covers all three routes", () => {
  const css = validationCss();

  expect(css).toContain('.check, .radio, .switch)[aria-invalid="true"]');
  expect(css).toContain(".needs-validation.was-validated");
  expect(css).toContain(":user-invalid");
});

test("checked/indeterminate fill converges across the three invalid routes", () => {
  const css = validationCss();

  expect(css).toContain('.check:is(:checked, :indeterminate)[aria-invalid="true"]');
  expect(css).toContain('.radio:checked[aria-invalid="true"]');
  expect(css).toContain('.switch:checked[aria-invalid="true"]');

  expect(css).toContain(
    ".needs-validation.was-validated .check:is(:checked, :indeterminate):invalid",
  );
  expect(css).toContain(".needs-validation.was-validated .radio:checked:invalid");
  expect(css).toContain(".needs-validation.was-validated .switch:checked:invalid");

  expect(css).toContain(".needs-validation .check:is(:checked, :indeterminate):user-invalid");
  expect(css).toContain(".needs-validation .radio:checked:user-invalid");
  expect(css).toContain(".needs-validation .switch:checked:user-invalid");
});

test("choice cards surface invalid state on the card border for both routes", () => {
  const css = validationCss();

  expect(css).toContain('.choice-card:has([aria-invalid="true"])');
  expect(css).toContain(".needs-validation.was-validated .choice-card:has(:invalid)");
  expect(css).toContain(".needs-validation .choice-card:has(:user-invalid)");
});

test("field errors show on invalid fields and invalid choice-card groups", () => {
  const css = validationCss();

  expect(css).toContain('.field:has([aria-invalid="true"]) > .field-error');
  expect(css).toContain(".needs-validation.was-validated .field:has(:invalid) > .field-error");
  expect(css).toContain(".needs-validation .field:has(:user-invalid) > .field-error");
});
