import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadValidation(html) {
  setupDOM(html);
  return import(`../src/js/validation.js?danger=${++importId}`);
}

afterEach(() => {
  cleanupDOM();
});

test("an application-supplied .danger survives a validation invalid→valid cycle", async () => {
  await loadValidation(`
    <form data-enhance="validation">
      <div class="field">
        <input class="input" name="email" type="email" required
               aria-describedby="email-error" />
        <span class="field-error" id="email-error"></span>
      </div>
    </form>
  `);
  const form = document.querySelector("form");
  const field = form.querySelector(".field");
  const input = form.querySelector("input");

  field.classList.add("danger");

  form.requestSubmit();
  expect(input.getAttribute("aria-invalid")).toBe("true");

  input.value = "a@b.co";
  form.requestSubmit();
  expect(input.getAttribute("aria-invalid")).toBeNull();
  expect(field.classList.contains("danger")).toBe(true);
});

test("validation-owned .danger is removed once the field becomes valid", async () => {
  await loadValidation(`
    <form data-enhance="validation">
      <div class="field">
        <input class="input" name="email" type="email" required
               aria-describedby="email-error" />
        <span class="field-error" id="email-error"></span>
      </div>
    </form>
  `);
  const form = document.querySelector("form");
  const field = form.querySelector(".field");
  const input = form.querySelector("input");

  form.requestSubmit();
  expect(field.classList.contains("danger")).toBe(true);

  input.value = "a@b.co";
  form.requestSubmit();
  expect(field.classList.contains("danger")).toBe(false);
});

test("an application-supplied .danger is not removed by a blur-validated valid field", async () => {
  await loadValidation(`
    <form data-enhance="validation">
      <div class="field">
        <input class="input" name="email" type="email" required
               aria-describedby="email-error" />
        <span class="field-error" id="email-error"></span>
      </div>
    </form>
  `);
  const form = document.querySelector("form");
  const field = form.querySelector(".field");
  const input = form.querySelector("input");

  field.classList.add("danger");
  form.requestSubmit();
  expect(input.getAttribute("aria-invalid")).toBe("true");

  input.value = "a@b.co";
  click(input);
  input.dispatchEvent(new Event("focusout", { bubbles: true }));
  click(document.body);

  expect(input.getAttribute("aria-invalid")).toBeNull();
  expect(field.classList.contains("danger")).toBe(true);
});

test("setErrors resolves collection property names and radio groups by field name", async () => {
  const { default: FormValidator } = await loadValidation(`
    <form data-enhance="validation">
      <input name="length" />
      <input type="radio" name="plan" value="monthly" />
      <input type="radio" name="plan" value="yearly" />
    </form>
  `);
  const form = document.querySelector("form");
  const length = form.querySelector('[name="length"]');
  const radios = [...form.querySelectorAll('[name="plan"]')];

  FormValidator.setErrors(form, {
    length: "Invalid length",
    plan: "Choose a plan",
  });

  expect(length.getAttribute("aria-invalid")).toBe("true");
  expect(radios.every((radio) => radio.getAttribute("aria-invalid") === "true")).toBe(true);
});
