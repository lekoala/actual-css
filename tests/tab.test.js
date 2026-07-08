import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, nextMicrotask, press, setupDOM } from "./helpers/dom.js";

let importId = 0;

function tabsMarkup() {
  return `
    <div role="tablist">
      <button id="tab-a" role="tab" aria-controls="panel-a" aria-selected="true">A</button>
      <button id="tab-b" role="tab" aria-controls="panel-b">B</button>
      <button id="tab-c" role="tab" aria-controls="panel-c">C</button>
    </div>
    <section id="panel-a" role="tabpanel">A panel</section>
    <section id="panel-b" role="tabpanel">B panel</section>
    <section id="panel-c" role="tabpanel">C panel</section>
  `;
}

async function loadTabs(html) {
  setupDOM(html);
  await import(`../src/js/tab.js?test=${++importId}`);
}

afterEach(() => {
  cleanupDOM();
});

test("clicking a tab selects it and reveals its panel", async () => {
  await loadTabs(tabsMarkup());
  const tabA = document.getElementById("tab-a");
  const tabB = document.getElementById("tab-b");
  const panelA = document.getElementById("panel-a");
  const panelB = document.getElementById("panel-b");

  click(tabB);

  expect(tabA.getAttribute("aria-selected")).toBe("false");
  expect(tabB.getAttribute("aria-selected")).toBe("true");
  expect(panelA.hidden).toBe(true);
  expect(panelB.hidden).toBe(false);
  expect(document.activeElement).toBe(tabB);
});

test("arrow keys move selection and focus", async () => {
  await loadTabs(tabsMarkup());
  const tabA = document.getElementById("tab-a");
  const tabB = document.getElementById("tab-b");

  tabA.focus();
  press(tabA, "ArrowRight");

  expect(tabA.getAttribute("aria-selected")).toBe("false");
  expect(tabB.getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabB);
});

test("Home and End move to first and last tabs", async () => {
  await loadTabs(tabsMarkup());
  const tabA = document.getElementById("tab-a");
  const tabC = document.getElementById("tab-c");

  tabA.focus();
  press(tabA, "End");
  expect(tabC.getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabC);

  press(tabC, "Home");
  expect(tabA.getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabA);
});

test("vertical tablists use ArrowDown and ArrowUp for selection", async () => {
  await loadTabs(tabsMarkup().replace('role="tablist"', 'role="tablist" aria-orientation="vertical"'));
  const tabA = document.getElementById("tab-a");
  const tabB = document.getElementById("tab-b");

  tabA.focus();
  press(tabA, "ArrowDown");

  expect(tabA.getAttribute("aria-selected")).toBe("false");
  expect(tabB.getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabB);

  press(tabB, "ArrowUp");

  expect(tabA.getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabA);
});

test("horizontal ArrowDown moves focus to the selected panel", async () => {
  await loadTabs(tabsMarkup());
  const tabA = document.getElementById("tab-a");
  const panelA = document.getElementById("panel-a");

  tabA.focus();
  press(tabA, "ArrowDown");

  expect(document.activeElement).toBe(panelA);
});

test("vertical tablists ignore ArrowRight for selection", async () => {
  await loadTabs(tabsMarkup().replace('role="tablist"', 'role="tablist" aria-orientation="vertical"'));
  const tabA = document.getElementById("tab-a");

  tabA.focus();
  press(tabA, "ArrowRight");

  expect(tabA.getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabA);
});

test("dynamically inserted tablists are initialized", async () => {
  setupDOM("<main></main>");
  await import(`../src/js/tab.js?test=${++importId}`);

  document.querySelector("main").innerHTML = tabsMarkup();
  await nextMicrotask();

  const tabA = document.getElementById("tab-a");
  const tabB = document.getElementById("tab-b");
  click(tabB);

  expect(tabA.getAttribute("aria-selected")).toBe("false");
  expect(tabB.getAttribute("aria-selected")).toBe("true");
  expect(document.getElementById("panel-a").hidden).toBe(true);
  expect(document.getElementById("panel-b").hidden).toBe(false);
});

test("initialization skips a selected tab with a missing panel", async () => {
  await loadTabs(`
    <div role="tablist">
      <button id="tab-a" role="tab" aria-controls="missing-panel" aria-selected="true">A</button>
      <button id="tab-b" role="tab" aria-controls="panel-b">B</button>
    </div>
    <section id="panel-b" role="tabpanel">B panel</section>
  `);

  expect(document.getElementById("tab-a").getAttribute("aria-selected")).toBe("false");
  expect(document.getElementById("tab-b").getAttribute("aria-selected")).toBe("true");
  expect(document.getElementById("panel-b").hidden).toBe(false);
});
