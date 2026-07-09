import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, mockRect, nextMicrotask, press, setupDOM } from "./helpers/dom.js";

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
  return import(`../src/js/context-menu.js?test=${++importId}`);
}

async function loadContextMenuAndFlyout(html) {
  setupDOM(html);
  const contextMenu = await import(`../src/js/context-menu.js?test=${++importId}`);
  await import(`../src/js/flyout.js?test=${++importId}`);
  return contextMenu;
}

afterEach(() => {
  cleanupDOM();
});

test("context menu targets require a native .flyout menu", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <div id="menu" class="flyout" role="menu" hidden></div>
  `);
  const target = document.getElementById("target");

  expect(target.hasAttribute("aria-controls")).toBe(false);
  expect(target.hasAttribute("aria-haspopup")).toBe(false);
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

test("flyout trigger gets initial disclosure attributes", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" aria-controls="menu" aria-expanded="false">Open</button>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">First</button></li>
    </menu>
  `);
  const trigger = document.getElementById("trigger");

  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
});

test("aria-haspopup alone does not opt into flyout behavior", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" aria-controls="menu" aria-haspopup="menu">Open</button>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">First</button></li>
    </menu>
  `);
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");

  click(trigger);

  expect(menu.hidden).toBe(true);
});

test("only native menu flyouts get menu popup semantics", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" aria-controls="menu" aria-expanded="false">Open</button>
    <div id="menu" class="flyout" role="menu" hidden></div>
  `);
  const trigger = document.getElementById("trigger");

  expect(trigger.hasAttribute("aria-haspopup")).toBe(false);
});

test("flyout stays at its markup position until it is opened", async () => {
  await loadFlyout(`
    <main><button id="trigger" type="button" aria-controls="menu" aria-expanded="false">Open</button>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">Item</button></li>
    </menu></main>
  `);
  const main = document.querySelector("main");
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  setupGeometry(trigger, menu);

  expect(menu.parentNode).toBe(main);

  click(trigger);
  expect(menu.parentNode).toBe(document.body);

  click(trigger);
  await nextMicrotask();
  expect(menu.parentNode).toBe(main);
});

test("removing one trigger does not disconnect a shared flyout", async () => {
  await loadFlyout(`
    <button id="first-trigger" type="button" aria-controls="menu" aria-expanded="false">First</button>
    <button id="second-trigger" type="button" aria-controls="menu" aria-expanded="false">Second</button>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">Item</button></li>
    </menu>
  `);
  const first = document.getElementById("first-trigger");
  const second = document.getElementById("second-trigger");
  const menu = document.getElementById("menu");
  setupGeometry(second, menu);

  first.remove();
  await nextMicrotask();
  click(second);

  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
});

test("flyout connects when the menu is inserted after its trigger", async () => {
  await loadFlyout('<main><button id="trigger" type="button" aria-controls="menu" aria-expanded="false">Open</button></main>');

  document.querySelector("main").insertAdjacentHTML(
    "beforeend",
    '<menu id="menu" class="flyout" hidden><li><button type="button">Item</button></li></menu>',
  );
  await nextMicrotask();
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  setupGeometry(trigger, menu);
  click(trigger);

  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
});

test("flyout trigger re-resolves a same-id replacement", async () => {
  await loadFlyout(`
    <main>
      <button id="trigger" type="button" aria-controls="menu" aria-expanded="false">Open</button>
      <menu id="menu" class="flyout" hidden><li><button type="button">Old</button></li></menu>
    </main>
  `);
  const trigger = document.getElementById("trigger");
  const first = document.getElementById("menu");

  first.replaceWith(
    document.createRange().createContextualFragment(
      '<menu id="menu" class="flyout" hidden><li><button type="button">New</button></li></menu>',
    ),
  );
  await nextMicrotask();
  const replacement = document.getElementById("menu");
  setupGeometry(trigger, replacement);

  click(trigger);

  expect(first.hidden).toBe(true);
  expect(replacement.hidden).toBe(false);
  expect(replacement.classList.contains("is-open")).toBe(true);
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

test("context menu targets do not claim button disclosure semantics", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">First</button></li>
    </menu>
  `);
  const target = document.getElementById("target");

  expect(target.hasAttribute("aria-controls")).toBe(false);
  expect(target.hasAttribute("aria-haspopup")).toBe(false);
  expect(target.hasAttribute("aria-expanded")).toBe(false);
});

test("context menu opening exposes the context and exact origin", async () => {
  const { contextFor } = await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0"><span id="name">File.pdf</span></div>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">Open</button></li>
    </menu>
  `);
  const target = document.getElementById("target");
  const name = document.getElementById("name");
  const menu = document.getElementById("menu");
  let detail;
  target.addEventListener("actual:context-menu", (event) => {
    detail = event.detail;
  });
  setupGeometry(target, menu);

  name.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );

  expect(detail.context).toBe(target);
  expect(detail.origin).toBe(name);
  expect(detail.trigger).toBe("pointer");
  expect(contextFor(menu)).toBe(detail);
});

test("a context menu opening can be cancelled", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">Open</button></li>
    </menu>
  `);
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  target.addEventListener("actual:context-menu", (event) => event.preventDefault());
  setupGeometry(target, menu);

  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );

  expect(menu.hidden).toBe(true);
});

test("a flyout trigger opens the menu with its enclosing context", async () => {
  await loadContextMenuAndFlyout(`
    <div id="target" data-context-menu="menu" tabindex="0">
      <button id="trigger" type="button" aria-controls="menu" aria-expanded="false">More</button>
    </div>
    <menu id="menu" class="flyout" hidden>
      <li><button id="first" type="button">Open</button></li>
    </menu>
  `);
  const target = document.getElementById("target");
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  let detail;
  target.addEventListener("actual:context-menu", (event) => {
    detail = event.detail;
  });
  setupGeometry(trigger, menu);

  click(trigger);

  expect(menu.hidden).toBe(false);
  expect(trigger.getAttribute("aria-controls")).toBe("menu");
  expect(detail.context).toBe(target);
  expect(detail.origin).toBe(trigger);
  expect(detail.trigger).toBe("button");
});

test("pointer context menu focuses the menu container, not the first item", async () => {
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

  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );

  expect(menu.hidden).toBe(false);
  expect(document.activeElement).toBe(menu);

  press(menu, "ArrowDown");

  expect(document.activeElement).toBe(first);
});

test("removing an open context menu cleans up its surface state", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">First</button></li>
    </menu>
  `);
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  setupGeometry(target, menu);

  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );
  expect(menu.hidden).toBe(false);

  menu.remove();
  await nextMicrotask();

  expect(menu.hidden).toBe(true);
  expect(menu.classList.contains("is-open")).toBe(false);
});
