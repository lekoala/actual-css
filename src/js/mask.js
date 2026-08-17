/*
 * Mask — token-based input masks for fixed-shape values.
 *
 * data-mask="999-aaa" applies a token mask.
 */

import enhance from "./enhance.js";
import { dispatchInput, onTextInput, selectionStart, setCaret } from "./input.js";

const SELECTOR = "input[data-mask]";
const TOKEN_TESTS = {
  9: (char) => /^\d$/u.test(char),
  a: (char) => /^\p{L}$/u.test(char),
  "*": () => true,
};

function isToken(char) {
  return Object.hasOwn(TOKEN_TESTS, char);
}

function parseMaskValue(value, mask) {
  const pattern = [...mask];
  const raw = [];
  const positions = [];
  let maskIndex = 0;
  let valueIndex = 0;

  valueLoop: for (const char of value) {
    valueIndex += char.length;

    while (maskIndex < pattern.length) {
      const part = pattern[maskIndex];

      if (!isToken(part)) {
        maskIndex++;
        if (char === part) continue valueLoop;
        continue;
      }

      if (TOKEN_TESTS[part](char)) {
        raw.push(char);
        positions.push(valueIndex);
        maskIndex++;
      }
      continue valueLoop;
    }

    break;
  }

  return { positions, raw };
}

function rawMaskChars(value, mask) {
  return parseMaskValue(value, mask).raw;
}

function appendFollowingLiterals(pattern, start) {
  let out = "";
  for (let i = start; i < pattern.length && !isToken(pattern[i]); i++) {
    out += pattern[i];
  }
  return out;
}

function formatRaw(raw, mask, inputType = "") {
  const autoLiteral = inputType.startsWith("insert");
  const pattern = [...mask];
  let rawIndex = 0;
  let out = "";

  for (let i = 0; i < pattern.length; i++) {
    const token = pattern[i];

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
      out += appendFollowingLiterals(pattern, i + 1);
      break;
    }
  }

  return out;
}

function applyMask(value, mask, inputType = "") {
  if (!mask) return value;
  return formatRaw(rawMaskChars(value, mask), mask, inputType);
}

function caretForMask(value, mask, rawCount) {
  if (rawCount <= 0) return 0;

  const position = parseMaskValue(value, mask).positions[rawCount - 1];
  if (position == null) return value.length;

  const pattern = [...mask];
  let tokenCount = 0;
  let patternIndex = 0;
  for (; patternIndex < pattern.length; patternIndex++) {
    if (!isToken(pattern[patternIndex])) continue;
    tokenCount++;
    if (tokenCount === rawCount) break;
  }

  let caret = position;
  for (patternIndex++; patternIndex < pattern.length; patternIndex++) {
    const literal = pattern[patternIndex];
    if (isToken(literal) || !value.startsWith(literal, caret)) break;
    caret += literal.length;
  }
  return caret;
}

function connectMask(el) {
  const mask = el.dataset.mask || "";
  if (!mask) return;
  const controller = new AbortController();
  let masking = false;
  // Last value this handler produced/saw. Distinguishes "backspaced only a
  // literal" (delete the raw character before it) from a selection deletion
  // that removed raw characters (just reformat, literals may come back).
  let lastValue = el.value;

  onTextInput(
    el,
    (event) => {
      if (masking) return;

      const inputType = event.inputType || "";
      const caret = selectionStart(el);
      let rawBeforeCaret = rawMaskChars(el.value.slice(0, caret), mask).length;
      const previous = el.value;
      let next = applyMask(previous, mask, inputType);
      const onlyLiteralsRemoved =
        rawMaskChars(previous, mask).length === rawMaskChars(lastValue, mask).length;

      if (inputType.startsWith("delete") && onlyLiteralsRemoved && next.length > previous.length) {
        const raw = rawMaskChars(previous, mask);
        const deleteIndex =
          inputType === "deleteContentForward" ? rawBeforeCaret : rawBeforeCaret - 1;

        if (deleteIndex >= 0 && deleteIndex < raw.length) {
          raw.splice(deleteIndex, 1);
          rawBeforeCaret = Math.max(0, deleteIndex);
          next = formatRaw(raw, mask, inputType);
        }
      }

      lastValue = next;
      if (next === previous) return;

      el.value = next;
      setCaret(el, caretForMask(next, mask, rawBeforeCaret));
      try {
        masking = true;
        dispatchInput(el);
      } finally {
        masking = false;
      }
    },
    controller.signal,
  );

  return () => controller.abort();
}

enhance({
  [SELECTOR]: connectMask,
});
