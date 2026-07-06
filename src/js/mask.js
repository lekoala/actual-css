/*
 * Mask — token-based input masks for fixed-shape values.
 *
 * data-mask="999-aaa" applies a token mask.
 */

import enhance from "./enhance.js";
import { dispatchInput, onTextInput, selectionStart, setCaret } from "./input.js";

const SELECTOR = "input[data-mask]";
const TOKEN_TESTS = {
  "9": (char) => /^\d$/u.test(char),
  a: (char) => /^\p{L}$/u.test(char),
  "*": () => true,
};

function isToken(char) {
  return Object.prototype.hasOwnProperty.call(TOKEN_TESTS, char);
}

function rawMaskChars(value, mask) {
  const tokens = [...mask].filter(isToken);
  return [...value].filter((char) => tokens.some((token) => TOKEN_TESTS[token](char)));
}

function appendFollowingLiterals(mask, start) {
  let out = "";
  for (let i = start; i < mask.length && !isToken(mask[i]); i++) {
    out += mask[i];
  }
  return out;
}

function applyMask(value, mask, inputType = "") {
  if (!mask) return value;

  const raw = rawMaskChars(value, mask);
  const autoLiteral = inputType.startsWith("insert");
  let rawIndex = 0;
  let out = "";

  for (let i = 0; i < mask.length; i++) {
    const token = mask[i];

    if (!isToken(token)) {
      if (rawIndex < raw.length) out += token;
      continue;
    }

    let matched = false;
    while (rawIndex < raw.length) {
      const char = raw[rawIndex];
      rawIndex++;
      if (!TOKEN_TESTS[token](char)) continue;
      out += char;
      matched = true;
      break;
    }

    if (!matched) break;

    if (autoLiteral && rawIndex >= raw.length) {
      out += appendFollowingLiterals(mask, i + 1);
      break;
    }
  }

  return out;
}

function caretForMask(value, mask, rawCount) {
  if (rawCount <= 0) return 0;

  let count = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (rawMaskChars(char, mask).length > 0) count++;
    if (count >= rawCount) {
      let caret = i + 1;
      while (caret < value.length && !rawMaskChars(value[caret], mask).length) {
        caret++;
      }
      return caret;
    }
  }

  return value.length;
}

function connectMask(el) {
  const mask = el.dataset.mask || "";
  if (!mask) return;
  if (!el.hasAttribute("size")) el.size = mask.length;

  const controller = new AbortController();

  onTextInput(el, (event) => {
    const inputType = event.inputType || "";
    const caret = selectionStart(el);
    const rawBeforeCaret = rawMaskChars(el.value.slice(0, caret), mask).length;
    const previous = el.value;
    const next = applyMask(previous, mask, inputType);

    if (next === previous) return;

    el.value = next;
    dispatchInput(el);
    setCaret(el, caretForMask(next, mask, rawBeforeCaret));
  }, controller.signal);

  return () => controller.abort();
}

enhance({
  [SELECTOR]: connectMask,
});
