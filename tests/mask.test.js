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
});

test("mask auto-adds trailing literals while typing", async () => {
  await loadMask('<input data-mask="999-999">');
  const el = document.querySelector("input");

  input(el, "123");

  expect(el.value).toBe("123-");
});

test("mask accepts a fixed literal typed by hand", async () => {
  await loadMask('<input data-mask="999-999">');
  const el = document.querySelector("input");

  input(el, "123-");
  expect(el.value).toBe("123-");

  input(el, "123-4");
  expect(el.value).toBe("123-4");
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

  input(el, "123456");
  expect(el.value).toBe("123-456");

  // Backspace at "123-|456": the browser removed only the literal.
  inputAt(el, "123456", 3, "deleteContentBackward");

  expect(el.value).toBe("124-56");
});

test("selection deletion spanning a literal only reformats the remaining value", async () => {
  await loadMask('<input data-mask="999-999">');
  const el = document.querySelector("input");

  input(el, "123456");
  expect(el.value).toBe("123-456");

  // User selected "3-4" in "123-456" and deleted: raw characters were
  // removed, so no extra raw character may be dropped.
  inputAt(el, "1256", 2, "deleteContentBackward");

  expect(el.value).toBe("125-6");
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
