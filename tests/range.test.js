import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadRange(html) {
  setupDOM(html);
  return import(`../src/js/range.js?test=${++importId}`);
}

function setValue(el, value) {
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

afterEach(() => {
  cleanupDOM();
});

test("the range enhancement writes --range-progress on connect", async () => {
  await loadRange('<input type="range" data-enhance="range" min="0" max="100" value="25">');
  const el = document.querySelector("input");

  expect(el.style.getPropertyValue("--range-progress")).toBe("25%");
});

test("the range enhancement updates --range-progress on input", async () => {
  await loadRange('<input type="range" data-enhance="range" min="0" max="100" value="0">');
  const el = document.querySelector("input");

  setValue(el, "50");

  expect(el.style.getPropertyValue("--range-progress")).toBe("50%");
});

test("the range enhancement works without the .range presentation class", async () => {
  await loadRange(
    '<input type="range" class="my-slider" data-enhance="range" min="0" max="4" value="1">',
  );
  const el = document.querySelector("input");

  expect(el.style.getPropertyValue("--range-progress")).toBe("25%");
});

test("the range enhancement ignores tokens on other elements", async () => {
  await loadRange(`
    <div data-enhance="range"></div>
    <input type="text" data-enhance="range" value="25">
  `);

  for (const el of document.querySelectorAll("[data-enhance]")) {
    expect(el.style.getPropertyValue("--range-progress")).toBe("");
  }
});

test("the range enhancement resolves a datalist label into aria-valuetext and output", async () => {
  await loadRange(`
    <output for="effort">?</output>
    <input type="range" data-enhance="range" id="effort" min="0" max="3" step="1" value="2" list="effort-levels">
    <datalist id="effort-levels">
      <option value="0" label="Minimale"></option>
      <option value="1" label="Standard"></option>
      <option value="2" label="Élevée"></option>
      <option value="3" label="Maximale"></option>
    </datalist>
  `);
  const el = document.getElementById("effort");
  const output = document.querySelector("output");

  expect(el.getAttribute("aria-valuetext")).toBe("Élevée");
  expect(output.textContent).toBe("Élevée");

  setValue(el, "0");

  expect(el.getAttribute("aria-valuetext")).toBe("Minimale");
  expect(output.textContent).toBe("Minimale");
});

test("the range enhancement leaves author state alone when the option has no label", async () => {
  await loadRange(`
    <input type="range" data-enhance="range" min="0" max="1" value="1" list="levels" aria-valuetext="Kept">
    <datalist id="levels"><option value="1"></option></datalist>
  `);
  const el = document.querySelector("input");

  expect(el.style.getPropertyValue("--range-progress")).toBe("100%");
  expect(el.getAttribute("aria-valuetext")).toBe("Kept");
});

test("the range enhancement defaults missing min/max and clamps outside values", async () => {
  await loadRange(`
    <input type="range" data-enhance="range" id="a" value="50">
    <input type="range" data-enhance="range" id="b" min="-100" max="100" value="0">
  `);

  expect(document.getElementById("a").style.getPropertyValue("--range-progress")).toBe("50%");
  expect(document.getElementById("b").style.getPropertyValue("--range-progress")).toBe("50%");
});

test("the range enhancement stays defensive when max equals min", async () => {
  await loadRange('<input type="range" data-enhance="range" min="5" max="5" value="5">');
  const el = document.querySelector("input");

  expect(el.style.getPropertyValue("--range-progress")).toBe("0%");
});

const LABELED = `
  <output for="effort">Pick a level</output>
  <input type="range" data-enhance="range" id="effort" min="0" max="3" step="1" value="2" list="effort-levels">
  <datalist id="effort-levels">
    <option value="0" label="Minimal"></option>
    <option value="1"></option>
    <option value="2" label="High"></option>
    <option value="3" label="Maximum"></option>
  </datalist>
`;

test("the range enhancement restores its writes when moving to an unlabeled option", async () => {
  await loadRange(LABELED);
  const el = document.getElementById("effort");
  const output = document.querySelector("output");

  expect(el.getAttribute("aria-valuetext")).toBe("High");
  expect(output.textContent).toBe("High");

  setValue(el, "1");

  expect(el.hasAttribute("aria-valuetext")).toBe(false);
  expect(output.textContent).toBe("Pick a level");
});

test("the range enhancement restores its writes when moving to an unmatched value", async () => {
  await loadRange(LABELED);
  const el = document.getElementById("effort");
  const output = document.querySelector("output");

  setValue(el, "2");
  expect(output.textContent).toBe("High");

  el.removeAttribute("list");
  el.dispatchEvent(new Event("input", { bubbles: true }));

  expect(el.hasAttribute("aria-valuetext")).toBe(false);
  expect(output.textContent).toBe("Pick a level");
});

test("the range enhancement never removes an author-written valuetext", async () => {
  await loadRange(LABELED);
  const el = document.getElementById("effort");

  setValue(el, "2");
  el.setAttribute("aria-valuetext", "Author's words");
  setValue(el, "1");

  expect(el.getAttribute("aria-valuetext")).toBe("Author's words");
});

test("range cleanup restores outputs", async () => {
  const mod = await loadRange(LABELED);
  const el = document.getElementById("effort");
  const output = document.querySelector("output");

  setValue(el, "3");
  expect(output.textContent).toBe("Maximum");

  mod.connectRange(el)();
  expect(output.textContent).toBe("Pick a level");
});

test("range restores a pre-existing valuetext instead of removing it", async () => {
  await loadRange(`
    <output for="effort">Pick a level</output>
    <input type="range" data-enhance="range" id="effort" min="0" max="3" value="2"
      list="effort-levels" aria-valuetext="Author">
    <datalist id="effort-levels">
      <option value="1"></option>
      <option value="2" label="High"></option>
    </datalist>
  `);
  const el = document.getElementById("effort");

  expect(el.getAttribute("aria-valuetext")).toBe("High");

  setValue(el, "1");

  expect(el.getAttribute("aria-valuetext")).toBe("Author");
});

test("range keeps an application rewrite of the output", async () => {
  await loadRange(LABELED);
  const el = document.getElementById("effort");
  const output = document.querySelector("output");

  setValue(el, "2");
  output.textContent = "App's words";
  setValue(el, "1");

  expect(output.textContent).toBe("App's words");
});

test("range restores a disconnected output", async () => {
  await loadRange(LABELED);
  const el = document.getElementById("effort");
  const output = document.querySelector("output");

  setValue(el, "2");
  expect(output.textContent).toBe("High");
  output.remove();

  setValue(el, "1");

  expect(output.textContent).toBe("Pick a level");
  document.body.append(output);
  expect(output.textContent).toBe("Pick a level");
});
