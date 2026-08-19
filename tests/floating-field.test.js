import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(path) {
  return readFileSync(join(import.meta.dir, "..", path), "utf8");
}

test("floating-field derives geometry from --control-size", () => {
  const css = read("src/css/optional/floating-field.css");

  expect(css).toContain(
    "--floating-pad-block-start: calc(var(--control-size) / 2 + var(--space-20));",
  );
  expect(css).toContain("padding-block-start: var(--floating-pad-block-start);");
});

test("floating-field is CSS-only with placeholder-shown and always-floated controls", () => {
  const css = read("src/css/optional/floating-field.css");

  expect(css).toContain(":not(:placeholder-shown)");
  expect(css).toContain(":autofill");
  expect(css).toContain("pointer-events: none;");
  expect(css).toContain("transform: translateY(-50%)");
  expect(css).toContain(".select,");
  expect(css).toContain('.input[type="date"]');
  expect(css).toContain('.input[type="week"]');
  expect(css).toContain("+ .field-label {");
  expect(css).not.toContain(".floating-form");
});

test("floating-field doc text-like examples carry placeholder=\" \"", () => {
  const md = read("docs/pages/forms/floating-field.md");
  const fences = [...md.matchAll(/```html demo\n([\s\S]*?)```/g)];
  const textControls = fences.flatMap(([, body]) =>
    [...body.matchAll(/<(input|textarea)\b([^>]*)>/g)],
  );

  const alwaysFloated = new Set(["date", "time", "datetime-local", "month", "week"]);
  const textLike = textControls.filter(([, , attrs]) => {
    const type = /type\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1];
    return !alwaysFloated.has(type) && type !== "hidden" && type !== "radio" && type !== "checkbox";
  });

  expect(textLike.length).toBeGreaterThan(0);
  for (const [, , attrs] of textLike) {
    expect(attrs, "text-like floating-field example must set placeholder=\" \"").toContain(
      'placeholder=" "',
    );
  }
});