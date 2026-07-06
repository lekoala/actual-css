import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, nextMicrotask, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadFilter(html) {
  setupDOM(html);
  await import(`../src/js/filter.js?test=${++importId}`);
}

function input(el, value) {
  el.value = value;
  el.setSelectionRange?.(value.length, value.length);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function textInput(el, value) {
  el.value = value;
  el.setSelectionRange?.(value.length, value.length);
  const event = new Event("input", { bubbles: true });
  Object.defineProperty(event, "data", { value: value.at(-1) ?? "" });
  Object.defineProperty(event, "inputType", { value: "insertText" });
  el.dispatchEvent(event);
}

afterEach(() => {
  cleanupDOM();
});

test("data-filter numeric keeps digits only", async () => {
  await loadFilter('<input data-filter="numeric" inputmode="numeric">');
  const el = document.querySelector("input");

  input(el, "a1b2.3");

  expect(el.value).toBe("123");
});

test("data-filter decimal keeps one decimal separator", async () => {
  await loadFilter('<input data-filter="decimal" inputmode="decimal">');
  const el = document.querySelector("input");

  input(el, "12,3.4x");

  expect(el.value).toBe("12.34");
});

test("data-filter lower lowercases text", async () => {
  await loadFilter('<input data-filter="lower">');
  const el = document.querySelector("input");

  input(el, "Ada LOVELACE");

  expect(el.value).toBe("ada lovelace");
});

test("data-filter upper uppercases text", async () => {
  await loadFilter('<input data-filter="upper">');
  const el = document.querySelector("input");

  input(el, "Ada Lovelace");

  expect(el.value).toBe("ADA LOVELACE");
});

test("data-filter letters keeps unicode letters only", async () => {
  await loadFilter('<input data-filter="letters">');
  const el = document.querySelector("input");

  input(el, "A1é-β!");

  expect(el.value).toBe("Aéβ");
});

test("data-filter slug normalizes text slugs", async () => {
  await loadFilter('<input data-filter="slug">');
  const el = document.querySelector("input");

  input(el, " Café déjà vu! ");

  expect(el.value).toBe("cafe-deja-vu");
});

test("data-filter slug preserves a typed trailing separator", async () => {
  await loadFilter('<input data-filter="slug">');
  const el = document.querySelector("input");

  textInput(el, "hello ");

  expect(el.value).toBe("hello-");
});

test("data-filter supports filter pipelines", async () => {
  await loadFilter('<input data-filter="upper|letters">');
  const el = document.querySelector("input");

  input(el, "a1é!");

  expect(el.value).toBe("AÉ");
});

test("data-filter dispatches input after programmatic formatting", async () => {
  setupDOM('<input data-filter="numeric" inputmode="numeric">');
  const el = document.querySelector("input");
  const seen = [];
  el.addEventListener("input", () => {
    seen.push(el.value);
  });
  await import(`../src/js/filter.js?test=${++importId}`);

  input(el, "a1b2");

  expect(seen).toEqual(["a1b2", "12"]);
});

test("plain inputmode values are ignored", async () => {
  await loadFilter('<input inputmode="numeric">');
  const el = document.querySelector("input");

  input(el, "a1b2.3");

  expect(el.value).toBe("a1b2.3");
});

test("empty data-filter falls back to supported inputmode values", async () => {
  await loadFilter('<input data-filter inputmode="numeric">');
  const el = document.querySelector("input");

  input(el, "a1b2.3");

  expect(el.value).toBe("123");
});

test("unsupported data-filter values are ignored", async () => {
  await loadFilter('<input data-filter="email" inputmode="email">');
  const el = document.querySelector("input");

  input(el, "hello@example.com");

  expect(el.value).toBe("hello@example.com");
});

test("data-filter enforcement waits for composition to finish", async () => {
  await loadFilter('<input data-filter="numeric" inputmode="numeric">');
  const el = document.querySelector("input");

  el.dispatchEvent(new Event("compositionstart", { bubbles: true }));
  input(el, "a1");
  expect(el.value).toBe("a1");

  el.dispatchEvent(new Event("compositionend", { bubbles: true }));
  expect(el.value).toBe("1");
});

test("dynamically inserted data-filter inputs are enhanced", async () => {
  await loadFilter("<main></main>");

  document.querySelector("main").innerHTML = '<input data-filter inputmode="decimal">';
  await nextMicrotask();
  const el = document.querySelector("input");

  input(el, "a.1");

  expect(el.value).toBe(".1");
});
