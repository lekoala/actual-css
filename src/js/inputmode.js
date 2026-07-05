/*
 * Inputmode — make native numeric input intent enforceable.
 *
 * inputmode changes the virtual keyboard but does not constrain the value.
 * Actual's default runtime reinforces only the two safe numeric intents:
 * unsigned digits for numeric, unsigned decimal numbers for decimal.
 */

import enhance from "./enhance.js";
import { onTextInput, selectionStart, setCaret } from "./input.js";

const SELECTOR = "input[inputmode]";

function filterNumeric(value) {
  return value.replace(/\D/gu, "");
}

function filterDecimal(value) {
  const normalized = value.replace(/,/g, ".");
  let out = "";
  let hasDot = false;

  for (const char of normalized) {
    if (/^\d$/u.test(char)) {
      out += char;
    } else if (char === "." && !hasDot) {
      out += ".";
      hasDot = true;
    }
  }

  return out;
}

function filterValue(value, mode) {
  return mode === "decimal" ? filterDecimal(value) : filterNumeric(value);
}

function connectInputmode(el) {
  const mode = el.getAttribute("inputmode")?.toLowerCase();
  if (mode !== "numeric" && mode !== "decimal") return;

  const controller = new AbortController();

  onTextInput(el, () => {
    const caret = selectionStart(el);
    const previous = el.value;
    const next = filterValue(previous, mode);

    if (next === previous) return;

    el.value = next;
    setCaret(el, filterValue(previous.slice(0, caret), mode).length);
  }, controller.signal);

  return () => controller.abort();
}

enhance({
  [SELECTOR]: connectInputmode,
});
