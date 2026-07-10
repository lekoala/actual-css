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
import { EVENTS } from "./events.js";
import { CLASSES } from "./selectors.js";

const NOVALIDATE = "novalidate";
const WAS_VALIDATED_CLASS = CLASSES.wasValidated;
const NEEDS_VALIDATION_CLASS = CLASSES.needsValidation;
const FIELD_CLASS = "field";
const connectedForms = new WeakMap();
const managedNoValidateForms = new WeakSet();
const warnedRules = new WeakMap();

function validDateParts(year, month, day) {
  if (month < 1 || month > 12 || day < 1) return false;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= days;
}

function isValidDate(value) {
  const v = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (iso) {
    return validDateParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const local = /^(\d{1,2})([/.-])(\d{1,2})\2(\d{4})$/.exec(v);
  if (!local) return false;

  const first = Number(local[1]);
  const second = Number(local[3]);
  const year = Number(local[4]);
  return validDateParts(year, second, first) || validDateParts(year, first, second);
}

function warnUnknownRuleOnce(el, name) {
  let warned = warnedRules.get(el);
  if (!warned) {
    warned = new Set();
    warnedRules.set(el, warned);
  }
  if (warned.has(name)) return;
  warned.add(name);
  console.warn(`Unknown validation rule "${name}" on ${el.name || el.id || "field"}`);
}

const rules = {
  same(v, el, selector) {
    if (!selector) return false;
    try {
      const target = el.form?.querySelector(selector);
      if (!target) return false;
      return v === target.value;
    } catch {
      return false;
    }
  },
  number(v) {
    return !Number.isNaN(Number(v));
  },
  digits(v) {
    return /^\d+$/.test(v);
  },
  alnum(v) {
    return /^[a-z0-9]+$/i.test(v);
  },
  date(v) {
    return isValidDate(v);
  },
};

function isFormElement(el) {
  return typeof HTMLFormElement !== "undefined" && el instanceof HTMLFormElement;
}

function ignoreField(field) {
  return (
    !field ||
    field.disabled ||
    field.willValidate === false ||
    typeof field.checkValidity !== "function" ||
    typeof field.setCustomValidity !== "function"
  );
}

function fieldContainer(el) {
  return el.closest?.(`.${FIELD_CLASS}`) || null;
}

function syncFieldDangerState(el) {
  const field = fieldContainer(el);
  if (!field) return;

  if (field.querySelector('[aria-invalid="true"], [data-validation-errors]')) {
    field.classList.add("danger");
  } else {
    field.classList.remove("danger");
  }
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
    const hasValue = el.value.trim().length > 0;
    const failed = [];
    for (const entry of rulesAttr.split(",")) {
      if (!hasValue) continue;
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const [name, ...opts] = trimmed.split(/\s+/);
      const handler = rules[name];
      if (!handler) {
        warnUnknownRuleOnce(el, name);
        failed.push(name);
        continue;
      }

      let result = false;
      try {
        result = handler(el.value, el, ...opts);
      } catch (error) {
        console.warn(`Validation rule "${name}" failed on ${el.name || el.id || "field"}`, error);
      }

      if (!result) {
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
    if (node?.classList.contains(CLASSES.fieldError)) {
      return node;
    }
  }
  return null;
}

function markInvalid(el) {
  el.setAttribute("aria-invalid", "true");
  fieldContainer(el)?.classList.add("danger");
}

function markValid(el) {
  el.removeAttribute("aria-invalid");
  delete el.dataset.validationErrors;
  syncFieldDangerState(el);
}

function hydrateServerErrors(form) {
  for (const el of form.elements) {
    if (ignoreField(el)) continue;
    if (el.getAttribute("aria-invalid") === "true" && !el.dataset.validationErrors) {
      el.dataset.validationErrors = "server";
    }
    syncFieldDangerState(el);
  }
}

function ensureManagedNoValidate(form) {
  if (!form.classList.contains(NEEDS_VALIDATION_CLASS)) return;
  if (form.hasAttribute(NOVALIDATE)) return;

  form.setAttribute(NOVALIDATE, "");
  managedNoValidateForms.add(form);
}

function validateField(el, trigger) {
  const form = el.form;
  if (!form?.classList.contains(NEEDS_VALIDATION_CLASS)) return;
  if (ignoreField(el)) return;

  if (trigger === "input" && el.dataset.validationErrors === "server") {
    delete el.dataset.validationErrors;
    el.setCustomValidity("");
  }

  const validationTrigger = el.dataset.validationTrigger || "";
  const alreadyInvalid = el.getAttribute("aria-invalid") === "true" || el.dataset.validationErrors;
  const wantsTrigger =
    trigger === "blur" || (validationTrigger.includes(trigger) && el.value.length > 0);

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
    managedNoValidateForms.add(form);
  }

  hydrateServerErrors(form);

  form.addEventListener(
    "focusout",
    (event) => {
      const el = event.target;
      if (el instanceof Element && el.form === form) {
        if (!form.classList.contains(NEEDS_VALIDATION_CLASS)) {
          if (managedNoValidateForms.has(form)) {
            form.removeAttribute(NOVALIDATE);
            managedNoValidateForms.delete(form);
          }
          return;
        }
        ensureManagedNoValidate(form);
        validateField(el, "blur");
      }
    },
    { signal: controller.signal },
  );

  form.addEventListener(
    "input",
    (event) => {
      const el = event.target;
      if (el instanceof Element && el.form === form) {
        if (!form.classList.contains(NEEDS_VALIDATION_CLASS)) {
          if (managedNoValidateForms.has(form)) {
            form.removeAttribute(NOVALIDATE);
            managedNoValidateForms.delete(form);
          }
          return;
        }
        ensureManagedNoValidate(form);
        validateField(el, "input");
      }
    },
    { signal: controller.signal },
  );

  form.addEventListener(
    "submit",
    (event) => {
      if (event.submitter?.formNoValidate) return;

      if (!form.classList.contains(NEEDS_VALIDATION_CLASS)) {
        if (managedNoValidateForms.has(form)) {
          form.removeAttribute(NOVALIDATE);
          managedNoValidateForms.delete(form);
        }
        return;
      }

      ensureManagedNoValidate(form);

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
        new CustomEvent(EVENTS.invalid, {
          bubbles: true,
          detail: {
            form,
            firstInvalid,
            message: form.dataset.validationMessage ?? "",
          },
        }),
      );
    },
    { signal: controller.signal },
  );

  const cleanup = () => {
    controller.abort();
    if (managedNoValidateForms.has(form)) {
      form.removeAttribute(NOVALIDATE);
      managedNoValidateForms.delete(form);
    }
    connectedForms.delete(form);
  };
  connectedForms.set(form, cleanup);
  return cleanup;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Stable public namespace for validation helpers and rules.
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
        FormValidator.setFieldError(found, message);
        continue;
      }
      for (const el of found) {
        FormValidator.setFieldError(el, message);
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
