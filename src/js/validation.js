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
 * Opt in with data-enhance="validation". The .needs-validation class
 * remains valid for presentation-only (CSS :user-invalid feedback without
 * the JS behavior). Importing the module registers the behavior; there is
 * no init call.
 *
 * The marker is a static, init-time contract. Removing the form from the
 * DOM tears down everything, including the managed novalidate attribute.
 */

import enhance, { enhancementSelector } from "./enhance.js";
import { EVENTS } from "./events.js";
import { CLASSES } from "./selectors.js";

const NOVALIDATE = "novalidate";
const WAS_VALIDATED_CLASS = CLASSES.wasValidated;
const VALIDATION_SELECTOR = enhancementSelector("validation");
const FIELD_CLASS = CLASSES.field;
const DANGER_CLASS = CLASSES.danger;
const MANAGED_NOVALIDATE_ATTR = "validationManagedNovalidate";
const connectedForms = new WeakMap();
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
  // A user-entered decimal: optional sign, digits with optional fraction,
  // optional exponent. Rejects JS-isms that Number() would accept (0x10,
  // Infinity, scientific shorthand, whitespace).
  number(v) {
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(v);
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

// .field.danger added by validation is tracked in a WeakSet so that only
// validation-owned state is removed. A .danger applied manually by app code
// for an unrelated reason is left alone: validation claims ownership only
// when it introduces the class itself.
const dangerOwned = new WeakSet();

function markDangerOwned(field) {
  if (!field.classList.contains(DANGER_CLASS)) {
    dangerOwned.add(field);
  }
  field.classList.add(DANGER_CLASS);
}

function syncFieldDangerState(el) {
  const field = fieldContainer(el);
  if (!field) return;

  if (field.querySelector('[aria-invalid="true"], [data-validation-errors]')) {
    markDangerOwned(field);
  } else if (dangerOwned.has(field)) {
    field.classList.remove(DANGER_CLASS);
    dangerOwned.delete(field);
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
    if (node?.matches(`.${CLASSES.fieldError}, [data-field-error]`)) {
      return node;
    }
  }
  return null;
}

function markInvalid(el) {
  el.setAttribute("aria-invalid", "true");
  const field = fieldContainer(el);
  if (field) {
    markDangerOwned(field);
  }
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

function releaseManagedNoValidate(form) {
  if (form.dataset[MANAGED_NOVALIDATE_ATTR] === undefined) return;
  form.removeAttribute(NOVALIDATE);
  delete form.dataset[MANAGED_NOVALIDATE_ATTR];
}

function validateField(el, trigger) {
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
    form.dataset[MANAGED_NOVALIDATE_ATTR] = "";
  }

  hydrateServerErrors(form);

  form.addEventListener(
    "focusout",
    (event) => {
      const el = event.target;
      if (el instanceof Element && el.form === form) {
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
        validateField(el, "input");
      }
    },
    { signal: controller.signal },
  );

  form.addEventListener(
    "reset",
    () => {
      form.classList.remove(WAS_VALIDATED_CLASS);
      for (const el of form.elements) {
        if (ignoreField(el)) continue;
        el.setCustomValidity("");
        markValid(el);
      }
    },
    { signal: controller.signal },
  );

  form.addEventListener(
    "submit",
    (event) => {
      if (event.submitter?.formNoValidate) return;

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

  // Disconnect contract: release resources only. Validation-owned classes,
  // aria-invalid, custom validity, and rendered errors are intentionally left
  // in place, so a move/remove/reinsert of the form does not erase business
  // state. A full reset goes through the reset event, not teardown.
  const cleanup = () => {
    controller.abort();
    releaseManagedNoValidate(form);
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
    if (typeof name !== "string" || name.trim() === "") {
      throw new TypeError("registerRule() requires a non-empty rule name.");
    }
    if (typeof callback !== "function") {
      throw new TypeError(`registerRule("${name}") requires a function callback.`);
    }
    rules[name] = callback;
  }

  static init(selector = VALIDATION_SELECTOR) {
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
      const found = form.elements.namedItem(name);
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
    [`form${VALIDATION_SELECTOR}`]: (form) => connectForm(form),
  });
}

export default FormValidator;
