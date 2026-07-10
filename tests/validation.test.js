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

test("required file inputs are validated on submit", async () => {
  await loadValidation(`<form class="needs-validation">
    <input name="attachment" type="file" required>
  </form>`);

  const form = document.querySelector("form");
  const field = form.elements.attachment;
  const event = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
  expect(field.getAttribute("aria-invalid")).toBe("true");
});

test("submitter with formnovalidate bypasses enhancer submit blocking", async () => {
  await loadValidation(`<form class="needs-validation">
    <input name="email" type="email" required value="bad">
    <button id="draft" type="submit" formnovalidate>Save draft</button>
  </form>`);

  const form = document.querySelector("form");
  const draft = document.getElementById("draft");
  const event = new Event("submit", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "submitter", {
    configurable: true,
    value: draft,
  });
  form.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(false);
  expect(form.classList.contains("was-validated")).toBe(false);
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

test("same rule is scoped to the form and fails when target is missing", async () => {
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
  expect(orphan.getAttribute("aria-invalid")).toBe("true");

  confirm.value = "nope";
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  expect(confirm.getAttribute("aria-invalid")).toBe("true");
});

test("same rule with an invalid selector blocks submit instead of crashing", async () => {
  await loadValidation(`<form class="needs-validation">
    <input name="confirm" data-validation-rules="same [" value="x">
  </form>`);

  const form = document.querySelector("form");
  const field = form.elements.confirm;
  const event = new Event("submit", { bubbles: true, cancelable: true });

  expect(() => form.dispatchEvent(event)).not.toThrow();
  expect(event.defaultPrevented).toBe(true);
  expect(field.getAttribute("aria-invalid")).toBe("true");
});

test("date rule accepts supported shapes and rejects impossible dates", async () => {
  await loadValidation(`<form class="needs-validation">
    <input name="date" data-validation-rules="date">
  </form>`);

  const form = document.querySelector("form");
  const field = form.elements.date;
  const valid = ["2026-05-13", "13/05/2026", "05/13/2026", "13.05.2026"];
  const invalid = ["13/13/2026", "32/01/2026", "30/02/2026", "13 05 2026"];

  for (const value of valid) {
    field.value = value;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(field.getAttribute("aria-invalid")).toBeNull();
  }

  for (const value of invalid) {
    field.value = value;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(field.getAttribute("aria-invalid")).toBe("true");
  }
});

test("empty fields skip custom rules and leave required as the only empty gate", async () => {
  await loadValidation(`<form class="needs-validation">
    <input name="optional" data-validation-rules="digits" value="">
    <input name="required" required data-validation-rules="digits" value="">
  </form>`);

  const form = document.querySelector("form");
  const optional = form.elements.optional;
  const required = form.elements.required;
  const event = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(event);

  expect(optional.getAttribute("aria-invalid")).toBeNull();
  expect(optional.dataset.validationErrors).toBeUndefined();
  expect(required.getAttribute("aria-invalid")).toBe("true");
  expect(required.dataset.validationErrors).toBeUndefined();
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

test("unknown rule warns once and fails closed", async () => {
  const warnings = [];
  const original = console.warn;
  console.warn = (message) => warnings.push(message);

  try {
    await loadValidation(`<form class="needs-validation">
      <input name="x" data-validation-rules="nope" value="y" required>
    </form>`);

    const form = document.querySelector("form");
    const event = new Event("submit", { bubbles: true, cancelable: true });
    const field = form.elements.x;
    form.dispatchEvent(event);
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(event.defaultPrevented).toBe(true);
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(warnings.filter((m) => /Unknown validation rule/.test(m))).toHaveLength(1);
  } finally {
    console.warn = original;
  }
});

test("initial aria-invalid fields are treated as server errors until input", async () => {
  await loadValidation(`<form class="needs-validation">
    <div class="field">
      <input name="email" type="email" value="good@example.com" aria-invalid="true">
      <span class="field-error">Server says no</span>
    </div>
  </form>`);

  const form = document.querySelector("form");
  const field = form.elements.email;

  expect(field.dataset.validationErrors).toBe("server");

  const blocked = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(blocked);
  expect(blocked.defaultPrevented).toBe(true);

  field.dispatchEvent(new Event("input", { bubbles: true }));
  const allowed = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(allowed);
  expect(allowed.defaultPrevented).toBe(false);
});

test("removing needs-validation disables runtime and restores novalidate", async () => {
  await loadValidation(`<form class="needs-validation">
    <input name="email" type="email" required value="bad">
  </form>`);

  const form = document.querySelector("form");
  form.classList.remove("needs-validation");

  const event = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(false);
  expect(form.hasAttribute("novalidate")).toBe(false);

  form.classList.add("needs-validation");
  const reenabled = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(reenabled);

  expect(form.hasAttribute("novalidate")).toBe(true);
  expect(reenabled.defaultPrevented).toBe(true);
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

test("blur validation marks aria-invalid before submit", async () => {
  await loadValidation(`<form class="needs-validation">
    <div class="field">
      <input name="email" type="email" required value="bad">
      <span class="field-error"></span>
    </div>
  </form>`);

  const field = document.querySelector("input");
  const wrapper = document.querySelector(".field");
  field.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));

  expect(field.getAttribute("aria-invalid")).toBe("true");
  expect(wrapper.classList.contains("danger")).toBe(true);
});
