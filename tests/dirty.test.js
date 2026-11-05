import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, flushMutationObserver, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadDirty(html) {
  setupDOM(html);
  const module = await import(`../src/js/dirty.js?test=${++importId}`);
  const form = document.querySelector("form");
  const events = [];
  document.addEventListener("actual:dirty-change", (event) => events.push(event));
  return { FormDirty: module.FormDirty, form, events };
}

function edit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function toggle(el) {
  el.checked = !el.checked;
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// The module re-evaluates a reset in the next task, after the controls revert.
function nextTask() {
  return new Promise((resolve) => setTimeout(resolve));
}

afterEach(() => {
  cleanupDOM();
});

test("an edit flips data-dirty and reverting it flips it back", async () => {
  const { form, events } = await loadDirty(`
    <form data-enhance="dirty"><input name="name" value="Alice"></form>
  `);
  const input = form.querySelector("input");

  expect(form.hasAttribute("data-dirty")).toBe(false);

  edit(input, "Alicia");
  expect(form.hasAttribute("data-dirty")).toBe(true);

  edit(input, "Alicia D");
  edit(input, "Alice");
  expect(form.hasAttribute("data-dirty")).toBe(false);

  // One event per transition, not per keystroke.
  expect(events.map((event) => event.detail.dirty)).toEqual([true, false]);
  expect(events[0].detail.form).toBe(form);
  expect(events[0].cancelable).toBe(false);
});

test("checkboxes and repeated names compare as submitted", async () => {
  const { form } = await loadDirty(`
    <form data-enhance="dirty">
      <input type="checkbox" name="tags" value="a" checked>
      <input type="checkbox" name="tags" value="b">
    </form>
  `);
  const [a, b] = form.querySelectorAll("input");

  toggle(b);
  expect(form.hasAttribute("data-dirty")).toBe(true);

  toggle(b);
  expect(form.hasAttribute("data-dirty")).toBe(false);

  toggle(a);
  toggle(b);
  expect(form.hasAttribute("data-dirty")).toBe(true);
});

test("a value cannot forge a separator between entries", async () => {
  const { form } = await loadDirty(`
    <form data-enhance="dirty">
      <input name="a" value="1&b=2">
      <input name="b" value="">
    </form>
  `);
  const [a, b] = form.querySelectorAll("input");

  edit(a, "1");
  edit(b, "2&b=");
  expect(form.hasAttribute("data-dirty")).toBe(true);
});

test("ignored, disabled and unnamed controls do not count", async () => {
  const { form } = await loadDirty(`
    <form data-enhance="dirty">
      <input name="_token" value="abc" data-dirty-ignore>
      <input name="locked" value="x" disabled>
      <input value="unnamed">
    </form>
  `);
  const [token, locked, unnamed] = form.querySelectorAll("input");

  edit(token, "def");
  edit(locked, "y");
  edit(unnamed, "changed");
  expect(form.hasAttribute("data-dirty")).toBe(false);
});

test("markClean(snapshot) keeps edits made during the request dirty", async () => {
  const { FormDirty, form } = await loadDirty(`
    <form data-enhance="dirty"><input name="name" value="Alice"></form>
  `);
  const input = form.querySelector("input");

  edit(input, "Alicia");
  const submitted = FormDirty.capture(form);
  edit(input, "Alicia Dupont");

  FormDirty.markClean(form, submitted);
  expect(form.hasAttribute("data-dirty")).toBe(true);

  edit(input, "Alicia");
  expect(form.hasAttribute("data-dirty")).toBe(false);
});

test("markClean() without a snapshot accepts the current data", async () => {
  const { FormDirty, form } = await loadDirty(`
    <form data-enhance="dirty"><input name="name" value="Alice"></form>
  `);
  const input = form.querySelector("input");

  edit(input, "Alicia");
  FormDirty.markClean(form);
  expect(form.hasAttribute("data-dirty")).toBe(false);

  edit(input, "Alice");
  expect(form.hasAttribute("data-dirty")).toBe(true);
});

test("refresh() picks up programmatic values and added controls", async () => {
  const { FormDirty, form } = await loadDirty(`
    <form data-enhance="dirty"><input name="name" value="Alice"></form>
  `);

  form.querySelector("input").value = "Bob";
  expect(form.hasAttribute("data-dirty")).toBe(false);
  FormDirty.refresh(form);
  expect(form.hasAttribute("data-dirty")).toBe(true);

  form.querySelector("input").value = "Alice";
  form.insertAdjacentHTML("beforeend", '<input name="extra" value="1">');
  FormDirty.refresh(form);
  expect(form.hasAttribute("data-dirty")).toBe(true);
});

test("reset re-evaluates after the controls revert", async () => {
  const { form } = await loadDirty(`
    <form data-enhance="dirty"><input name="name" value="Alice"></form>
  `);

  edit(form.querySelector("input"), "Alicia");
  form.reset();
  await nextTask();

  expect(form.querySelector("input").value).toBe("Alice");
  expect(form.hasAttribute("data-dirty")).toBe(false);
});

test("reset after markClean restores HTML defaults, not the saved baseline", async () => {
  const { FormDirty, form } = await loadDirty(`
    <form data-enhance="dirty"><input name="name" value="Alice"></form>
  `);
  const input = form.querySelector("input");

  edit(input, "Alicia");
  FormDirty.markClean(form);
  form.reset();
  await nextTask();

  expect(input.value).toBe("Alice");
  expect(form.hasAttribute("data-dirty")).toBe(true);
});

test("a removed and reinserted form keeps its baseline", async () => {
  const { form } = await loadDirty(`
    <div id="host"><form data-enhance="dirty"><input name="name" value="Alice"></form></div>
  `);
  const host = document.getElementById("host");

  edit(form.querySelector("input"), "Alicia");
  form.remove();
  await flushMutationObserver();
  host.append(form);
  await flushMutationObserver();

  expect(form.hasAttribute("data-dirty")).toBe(true);
  edit(form.querySelector("input"), "Alice");
  expect(form.hasAttribute("data-dirty")).toBe(false);
});

test("markClean ignores a non-form; capture rejects it explicitly", async () => {
  const { FormDirty } = await loadDirty(`<div></div>`);
  const div = document.querySelector("div");

  expect(() => FormDirty.markClean(div)).not.toThrow();
  expect(() => FormDirty.refresh(div)).not.toThrow();
  expect(() => FormDirty.capture(div)).toThrow("FormDirty expects an HTMLFormElement.");
});

test("the token means nothing outside a form", async () => {
  await loadDirty(`<div data-enhance="dirty"><input name="name" value="Alice"></div>`);
  const input = document.querySelector("input");

  edit(input, "Alicia");
  expect(document.querySelector("div").hasAttribute("data-dirty")).toBe(false);
});
