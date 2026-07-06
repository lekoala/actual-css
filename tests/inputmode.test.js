import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, nextMicrotask, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadInputmode(html) {
  setupDOM(html);
  await import(`../src/js/inputmode.js?test=${++importId}`);
}

function input(el, value) {
  el.value = value;
  el.setSelectionRange?.(value.length, value.length);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

afterEach(() => {
  cleanupDOM();
});

test("inputmode numeric keeps digits only", async () => {
  await loadInputmode('<input inputmode="numeric">');
  const el = document.querySelector("input");

  input(el, "a1b2.3");

  expect(el.value).toBe("123");
});

test("inputmode decimal keeps one decimal separator", async () => {
  await loadInputmode('<input inputmode="decimal">');
  const el = document.querySelector("input");

  input(el, "12,3.4x");

  expect(el.value).toBe("12.34");
});

test("inputmode dispatches input after programmatic formatting", async () => {
  setupDOM('<input inputmode="numeric">');
  const el = document.querySelector("input");
  const seen = [];
  el.addEventListener("input", () => {
    seen.push(el.value);
  });
  await import(`../src/js/inputmode.js?test=${++importId}`);

  input(el, "a1b2");

  expect(seen).toEqual(["a1b2", "12"]);
});

test("unsupported inputmode values are ignored", async () => {
  await loadInputmode('<input inputmode="email">');
  const el = document.querySelector("input");

  input(el, "hello@example.com");

  expect(el.value).toBe("hello@example.com");
});

test("inputmode enforcement waits for composition to finish", async () => {
  await loadInputmode('<input inputmode="numeric">');
  const el = document.querySelector("input");

  el.dispatchEvent(new Event("compositionstart", { bubbles: true }));
  input(el, "a1");
  expect(el.value).toBe("a1");

  el.dispatchEvent(new Event("compositionend", { bubbles: true }));
  expect(el.value).toBe("1");
});

test("dynamically inserted inputmode inputs are enhanced", async () => {
  await loadInputmode("<main></main>");

  document.querySelector("main").innerHTML = '<input inputmode="decimal">';
  await nextMicrotask();
  const el = document.querySelector("input");

  input(el, "a.1");

  expect(el.value).toBe(".1");
});
