import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, nextMicrotask, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadValidation(html) {
  setupDOM(html);
  return import(`../src/js/validation.js?test=${++importId}`);
}

afterEach(() => {
  cleanupDOM();
});

test("adds novalidate to opted-in forms", async () => {
  await loadValidation(`<form class="needs-validation">
    <input name="email" type="email" required>
  </form>`);

  const form = document.querySelector("form");
  expect(form.hasAttribute("novalidate")).toBe(true);
});

test("invalid field is marked on submit and actual:invalid fires", async () => {
  const { default: FormValidator } = await loadValidation(`<form class="needs-validation" data-validation-message="Check fields">
    <input name="email" type="email" required value="not-an-email">
    <span id="email-error" class="field-error"></span>
  </form>`);

  const form = document.querySelector("form");
  const field = form.elements.email;
  let detail = null;
  form.addEventListener("actual:invalid", (event) => {
    detail = event.detail;
  });

  const event = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
  expect(field.getAttribute("aria-invalid")).toBe("true");
  expect(form.classList.contains("was-validated")).toBe(true);
  expect(detail?.firstInvalid).toBe(field);
  expect(detail?.message).toBe("Check fields");
});

test("manual init does not connect an already enhanced form twice", async () => {
  const { default: FormValidator } = await loadValidation(`<form class="needs-validation">
    <input name="email" type="email" required value="bad">
  </form>`);

  const form = document.querySelector("form");
  let invalidEvents = 0;
  form.addEventListener("actual:invalid", () => {
    invalidEvents++;
  });

  FormValidator.init();
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  expect(invalidEvents).toBe(1);
});

test("valid form is not blocked on submit", async () => {
  await loadValidation(`<form class="needs-validation">
    <input name="email" type="email" required value="a@b.com">
  </form>`);

  const form = document.querySelector("form");
  const event = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(false);
  expect(form.classList.contains("was-validated")).toBe(true);
});

test("number rule is fixed (digits valid, letters invalid)", async () => {
  await loadValidation(`<form class="needs-validation">
    <input name="qty" data-validation-rules="number" value="abc">
  </form>`);

  const form = document.querySelector("form");
  const field = form.elements.qty;
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  expect(field.getAttribute("aria-invalid")).toBe("true");

  field.value = "123";
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  expect(field.getAttribute("aria-invalid")).toBeNull();
});

test("same rule is scoped to the form and tolerates a missing target", async () => {
  await loadValidation(`<form class="needs-validation">
    <input id="password" name="password" value="secret">
    <input name="confirm" data-validation-rules="same #password" value="secret">
    <input name="orphan" data-validation-rules="same #does-not-exist" value="x">
  </form>`);

  const form = document.querySelector("form");
  const confirm = form.elements.confirm;
  const orphan = form.elements.orphan;

  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  expect(confirm.getAttribute("aria-invalid")).toBeNull();
  expect(orphan.getAttribute("aria-invalid")).toBeNull();

  confirm.value = "nope";
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  expect(confirm.getAttribute("aria-invalid")).toBe("true");
});

test("registerRule adds a custom rule", async () => {
  const { default: FormValidator } = await loadValidation(`<form class="needs-validation">
    <input name="code" data-validation-rules="uppercase" value="abc">
  </form>`);

  FormValidator.registerRule("uppercase", (v) => v.length === 0 || v === v.toUpperCase());

  const form = document.querySelector("form");
  const field = form.elements.code;
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  expect(field.getAttribute("aria-invalid")).toBe("true");
});

test("unknown rule is skipped with a warning and does not block the form", async () => {
  const warnings = [];
  const original = console.warn;
  console.warn = (message) => warnings.push(message);

  try {
    await loadValidation(`<form class="needs-validation">
      <input name="x" data-validation-rules="nope" value="y" required>
    </form>`);

    const form = document.querySelector("form");
    const event = new Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(warnings.some((m) => /Unknown validation rule/.test(m))).toBe(true);
  } finally {
    console.warn = original;
  }
});

test("setErrors bridges server validation back to fields", async () => {
  const { default: FormValidator } = await loadValidation(`<form class="needs-validation">
    <input id="email" name="email" type="email" required value="a@b.com" aria-describedby="email-error">
    <span id="email-error" class="field-error"></span>
  </form>`);

  const form = document.querySelector("form");
  const field = form.elements.email;
  const error = document.getElementById("email-error");

  FormValidator.setErrors(form, { email: "Already taken" });

  expect(field.getAttribute("aria-invalid")).toBe("true");
  expect(error.textContent).toBe("Already taken");
  expect(form.checkValidity()).toBe(false);

  const blocked = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(blocked);
  expect(blocked.defaultPrevented).toBe(true);

  FormValidator.clearFieldError(field);
  expect(field.getAttribute("aria-invalid")).toBeNull();
  expect(field.checkValidity()).toBe(true);

  const allowed = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(allowed);
  expect(allowed.defaultPrevented).toBe(false);
});

test("re-validation on input clears errors once fixed", async () => {
  await loadValidation(`<form class="needs-validation">
    <input name="email" type="email" required value="bad">
  </form>`);

  const form = document.querySelector("form");
  const field = form.elements.email;

  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  expect(field.getAttribute("aria-invalid")).toBe("true");

  field.value = "good@example.com";
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await nextMicrotask();

  expect(field.getAttribute("aria-invalid")).toBeNull();
});
