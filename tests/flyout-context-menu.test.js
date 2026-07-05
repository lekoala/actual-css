import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, mockRect, press, setupDOM } from "./helpers/dom.js";

let importId = 0;

function setupGeometry(trigger, menu) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: 1024,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: 768,
  });
  mockRect(trigger, { x: 20, y: 30, width: 120, height: 32 });
  mockRect(menu, { x: 0, y: 0, width: 160, height: 80 });
}

async function loadFlyout(html) {
  setupDOM(html);
  await import(`../src/js/flyout.js?test=${++importId}`);
}

async function loadContextMenu(html) {
  setupDOM(html);
  await import(`../src/js/context-menu.js?test=${++importId}`);
}

afterEach(() => {
  cleanupDOM();
});

test("flyout trigger arrow key opens and focuses direct action items", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" aria-controls="menu" aria-expanded="false">Open</button>
    <menu id="menu" class="flyout" hidden>
      <li><button id="first" type="button">First</button></li>
      <li><button id="second" type="button">Second</button></li>
    </menu>
  `);
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  const first = document.getElementById("first");
  setupGeometry(trigger, menu);

  press(trigger, "ArrowDown");

  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
  expect(document.activeElement).toBe(first);
});

test("flyout trigger opens nav panels and focuses the first link", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" aria-controls="panel" aria-expanded="false">Products</button>
    <div id="panel" class="flyout" hidden>
      <section>
        <h3>Design</h3>
        <a id="first" href="/figma">Figma integration</a>
      </section>
      <footer>
        <a id="second" href="/pricing">See pricing</a>
      </footer>
    </div>
  `);
  const trigger = document.getElementById("trigger");
  const panel = document.getElementById("panel");
  const first = document.getElementById("first");
  setupGeometry(trigger, panel);

  press(trigger, "Enter");

  expect(panel.hidden).toBe(false);
  expect(panel.classList.contains("is-open")).toBe(true);
  expect(document.activeElement).toBe(first);
});

test("tab from an open nav panel trigger enters the panel", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" aria-controls="panel" aria-expanded="false">Products</button>
    <div id="panel" class="flyout" hidden>
      <section>
        <a id="first" href="/figma">Figma integration</a>
      </section>
    </div>
  `);
  const trigger = document.getElementById("trigger");
  const panel = document.getElementById("panel");
  const first = document.getElementById("first");
  setupGeometry(trigger, panel);

  click(trigger);
  press(trigger, "Tab");

  expect(panel.hidden).toBe(false);
  expect(document.activeElement).toBe(first);
});

test("keyboard context menu focuses the first direct action item", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <menu id="menu" class="flyout" hidden>
      <li><button id="first" type="button">First</button></li>
      <li><button id="second" type="button">Second</button></li>
    </menu>
  `);
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  const first = document.getElementById("first");
  setupGeometry(target, menu);

  press(target, "ContextMenu");

  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
  expect(document.activeElement).toBe(first);
});
