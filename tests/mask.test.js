import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, nextMicrotask, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadMask(html) {
  setupDOM(html);
  await import(`../src/js/mask.js?test=${++importId}`);
}

function input(el, value, inputType = "insertText") {
  el.value = value;
  el.setSelectionRange?.(value.length, value.length);
  const event = new Event("input", { bubbles: true });
  Object.defineProperty(event, "inputType", {
    configurable: true,
    value: inputType,
  });
  el.dispatchEvent(event);
}

function inputAt(el, value, caret, inputType) {
  el.value = value;
  el.setSelectionRange?.(caret, caret);
  const event = new Event("input", { bubbles: true });
  Object.defineProperty(event, "inputType", {
    configurable: true,
    value: inputType,
  });
  el.dispatchEvent(event);
}

afterEach(() => {
  cleanupDOM();
});

test("data-mask formats token masks and sets size", async () => {
  await loadMask('<input data-mask="aa-99">');
  const el = document.querySelector("input");

  input(el, "ab1");

  expect(el.value).toBe("ab-1");
  expect(el.size).toBe(5);
});

test("mask deletion does not re-add trailing literals", async () => {
  await loadMask('<input data-mask="aa-99">');
  const el = document.querySelector("input");

  input(el, "ab-", "deleteContentBackward");

  expect(el.value).toBe("ab");
});

test("mask deletion over a literal removes the previous raw character", async () => {
  await loadMask('<input data-mask="999-999">');
  const el = document.querySelector("input");

  inputAt(el, "123456", 3, "deleteContentBackward");

  expect(el.value).toBe("124-56");
});

test("mask dispatches input after programmatic formatting", async () => {
  setupDOM('<input data-mask="aa-99">');
  const el = document.querySelector("input");
  const seen = [];
  el.addEventListener("input", () => {
    seen.push(el.value);
  });
  await import(`../src/js/mask.js?test=${++importId}`);

  input(el, "ab1");

  expect(seen).toEqual(["ab1", "ab-1"]);
});

test("dynamically inserted mask inputs are enhanced", async () => {
  await loadMask("<main></main>");

  document.querySelector("main").innerHTML = '<input data-mask="999">';
  await nextMicrotask();
  const el = document.querySelector("input");

  input(el, "a1b2");

  expect(el.value).toBe("12");
});
