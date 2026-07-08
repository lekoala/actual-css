/*
 * Validation — optional form validation enhancer.
 *
 * Native HTML constraint validation runs first. This enhancer prevents
 * premature error display, adds invalid state on submit, focuses the first
 * invalid field, and supports a few small custom rules through
 * data-validation-rules. It is a progressive enhancement, not a validation
 * framework: server / AJAX validation lives in app code and feeds results
 * back through FormValidator.setErrors().
 *
 * Opt in with the .needs-validation class. Importing the module registers
 * the behavior; there is no init call.
 */

import enhance from "./enhance.js";

const INVALID_CLASS = "is-invalid";
const NOVALIDATE = "novalidate";
const WAS_VALIDATED_CLASS = "was-validated";
const NEEDS_VALIDATION_CLASS = "needs-validation";
const connectedForms = new WeakMap();

const rules = {
  same(v, el, selector) {
    const target = el.form?.querySelector(selector);
    return !target || v === target.value;
  },
  number(v) {
    return v.length === 0 || !Number.isNaN(Number(v));
  },
  digits(v) {
    return v.length === 0 || /^\d+$/.test(v);
  },
  alnum(v) {
    return v.length === 0 || /^[a-z0-9]+$/i.test(v);
  },
};

function isFormElement(el) {
  return typeof HTMLFormElement !== "undefined" && el instanceof HTMLFormElement;
}

function ignoreField(field) {
  return (
    !field ||
    field.disabled ||
    typeof field.checkValidity !== "function" ||
    ["file", "reset", "submit", "button", "image"].includes(field.type)
  );
}

function checkRules(el) {
  if (el.dataset.validationErrors === "server") {
    return false;
  }
  el.setCustomValidity("");
  delete el.dataset.validationErrors;

  let valid = el.checkValidity();

  const rulesAttr = el.dataset.validationRules;
  if (rulesAttr) {
    const failed = [];
    for (const entry of rulesAttr.split(",")) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const [name, ...opts] = trimmed.split(/\s+/);
      const handler = rules[name];
      if (!handler) {
        console.warn(`Unknown validation rule "${name}" on ${el.name || el.id || "field"}`);
        continue;
      }
      if (!handler(el.value, el, ...opts)) {
        failed.push(name);
      }
    }
    if (failed.length > 0) {
      valid = false;
      el.setCustomValidity(failed.join(", "));
      el.dataset.validationErrors = failed.join(",");
    }
  }

  return valid;
}

function errorEl(el) {
  const ids = el.getAttribute("aria-describedby");
  if (!ids) return null;
  for (const id of ids.split(/\s+/)) {
    const node = el.ownerDocument.getElementById(id);
    if (node && node.classList.contains("field-error")) {
      return node;
    }
  }
  return null;
}

function markInvalid(el) {
  el.setAttribute("aria-invalid", "true");
  el.classList.add(INVALID_CLASS);
}

function markValid(el) {
  el.removeAttribute("aria-invalid");
  el.classList.remove(INVALID_CLASS);
  delete el.dataset.validationErrors;
}

function validateField(el, trigger) {
  const form = el.form;
  if (!form || !form.classList.contains(NEEDS_VALIDATION_CLASS)) return;
  if (ignoreField(el)) return;

  if (trigger === "input" && el.dataset.validationErrors === "server") {
    delete el.dataset.validationErrors;
    el.setCustomValidity("");
  }

  const validationTrigger = el.dataset.validationTrigger || "";
  const alreadyInvalid =
    el.classList.contains(INVALID_CLASS) || el.dataset.validationErrors;
  const wantsTrigger =
    validationTrigger.includes(trigger) && el.value.length > 0;

  if (!wantsTrigger && !alreadyInvalid) return;

  if (checkRules(el)) {
    markValid(el);
  } else {
    markInvalid(el);
  }
}

function connectForm(form) {
  const existing = connectedForms.get(form);
  if (existing) return existing;

  const controller = new AbortController();

  if (!form.hasAttribute(NOVALIDATE)) {
    form.setAttribute(NOVALIDATE, "");
  }

  form.addEventListener(
    "focusout",
    (event) => {
      const el = event.target;
      if (el instanceof Element && el.form === form) {
        validateField(el, "blur");
      }
    },
    { signal: controller.signal }
  );

  form.addEventListener(
    "input",
    (event) => {
      const el = event.target;
      if (el instanceof Element && el.form === form) {
        validateField(el, "input");
      }
    },
    { signal: controller.signal }
  );

  form.addEventListener(
    "submit",
    (event) => {
      let firstInvalid = null;

      for (const el of form.elements) {
        if (ignoreField(el)) continue;

        if (checkRules(el)) {
          markValid(el);
          continue;
        }

        markInvalid(el);
        if (!firstInvalid) firstInvalid = el;
      }

      form.classList.add(WAS_VALIDATED_CLASS);

      if (!firstInvalid) return;

      event.preventDefault();
      event.stopPropagation();

      try {
        firstInvalid.focus();
      } catch {
        // Some environments do not implement focus on detached elements.
      }

      form.dispatchEvent(
        new CustomEvent("actual:invalid", {
          bubbles: true,
          detail: {
            form,
            firstInvalid,
            message: form.dataset.validationMessage ?? "",
          },
        })
      );
    },
    { signal: controller.signal }
  );

  const cleanup = () => {
    controller.abort();
    connectedForms.delete(form);
  };
  connectedForms.set(form, cleanup);
  return cleanup;
}

export class FormValidator {
  static get rules() {
    return rules;
  }

  static registerRule(name, callback) {
    rules[name] = callback;
  }

  static init(selector = `.${NEEDS_VALIDATION_CLASS}`) {
    if (typeof document === "undefined") return;
    for (const form of document.querySelectorAll(selector)) {
      if (isFormElement(form)) connectForm(form);
    }
  }

  static setFieldError(el, message) {
    el.setCustomValidity(message || "invalid");
    el.dataset.validationErrors = "server";
    markInvalid(el);
    const error = errorEl(el);
    if (error && message) error.textContent = message;
  }

  static clearFieldError(el) {
    delete el.dataset.validationErrors;
    markValid(el);
    el.setCustomValidity("");
  }

  static setErrors(form, errors) {
    if (!isFormElement(form)) return;
    for (const [name, message] of Object.entries(errors)) {
      const found = form.elements[name];
      if (!found) continue;
      if (found instanceof Element) {
        this.setFieldError(found, message);
        continue;
      }
      for (const el of found) {
        this.setFieldError(el, message);
      }
    }
  }
}

if (typeof document !== "undefined") {
  enhance({
    [`form.${NEEDS_VALIDATION_CLASS}`]: (form) => connectForm(form),
  });
}

export default FormValidator;
