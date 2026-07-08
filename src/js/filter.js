/*
 * Input filter — opt-in filtering for simple text policies.
 *
 * inputmode only hints the virtual keyboard; it never filters input on its
 * own. data-filter is the explicit, separate contract for rewriting the
 * value as the user types — data-filter="numeric" / "decimal" is
 * intentionally destructive, unlike inputmode.
 */

import enhance from "./enhance.js";
import { dispatchInput, onTextInput, selectionStart, setCaret } from "./input.js";

const SELECTOR = "input[data-filter]";
const FILTERS = new Map([
  ["numeric", filterNumeric],
  ["decimal", filterDecimal],
  ["lower", filterLower],
  ["upper", filterUpper],
  ["letters", filterLetters],
  ["slug", filterSlug],
]);

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

function filterLower(value) {
  return value.toLocaleLowerCase();
}

function filterUpper(value) {
  return value.toLocaleUpperCase();
}

function filterLetters(value) {
  return value.replace(/[^\p{L}]/gu, "");
}

function normalizeText(value) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "");
}

function filterSlug(value, event) {
  const keepTrailingSeparator =
    event?.inputType === "insertText" && /[^\p{L}\p{N}]$/u.test(value);
  const slug = normalizeText(value)
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/g, "");

  return keepTrailingSeparator ? slug : slug.replace(/-+$/g, "");
}

function filterValue(value, modes, event) {
  return modes.reduce((next, mode) => FILTERS.get(mode)(next, event), value);
}

function explicitFilterModes(value) {
  return value
    .split("|")
    .map((mode) => mode.trim().toLowerCase())
    .filter((mode) => FILTERS.has(mode));
}

function filterModes(el) {
  const explicit = el.getAttribute("data-filter")?.trim().toLowerCase();
  return explicit ? explicitFilterModes(explicit) : [];
}

function connectFilter(el) {
  const modes = filterModes(el);
  if (!modes.length) return;

  const controller = new AbortController();
  let filtering = false;

  onTextInput(el, (event) => {
    if (filtering) return;

    const caret = selectionStart(el);
    const previous = el.value;
    const next = filterValue(previous, modes, event);

    if (next === previous) return;

    el.value = next;
    setCaret(el, filterValue(previous.slice(0, caret), modes, event).length);
    try {
      filtering = true;
      dispatchInput(el);
    } finally {
      filtering = false;
    }
  }, controller.signal);

  return () => controller.abort();
}

enhance({
  [SELECTOR]: connectFilter,
});
