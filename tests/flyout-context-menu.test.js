import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, mockRect, nextMicrotask, press, setupDOM } from "./helpers/dom.js";
import { nextFrame } from "./helpers/layout.js";

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

test("flyout trigger arrow key opens and focuses direct menu items", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="first" class="menu-item" type="button">First</button></li>
      <li><button id="second" class="menu-item" type="button">Second</button></li>
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

test("flyout keeps the first menu item focused after opening settles", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu">Open</button>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="first" class="menu-item" type="button">First</button></li>
      <li><button class="menu-item" type="button">Second</button></li>
    </menu>
  `);
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  const first = document.getElementById("first");
  setupGeometry(trigger, menu);

  press(trigger, "ArrowDown");
  expect(document.activeElement).toBe(first);

  await nextMicrotask();
  await nextFrame();

  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
  expect(document.activeElement).toBe(first);
});

test("a hidden action menu is classified by semantics before its items are visible", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu">Open</button>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="first" class="menu-item" type="button">First</button></li>
      <li><button id="last" class="menu-item" type="button">Last</button></li>
    </menu>
  `);
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  const first = document.getElementById("first");
  const last = document.getElementById("last");
  setupGeometry(trigger, menu);

  // Browsers report descendants of a hidden panel as not visible. Menu
  // classification must not depend on that transient presentation state.
  first.checkVisibility = () => !menu.hidden;
  last.checkVisibility = () => !menu.hidden;

  press(trigger, "ArrowUp");

  expect(menu.hidden).toBe(false);
  expect(document.activeElement).toBe(last);
});

test("a shared menu is wired once across two triggers", async () => {
  await loadFlyout(`
    <button id="a" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">A</button>
    <button id="b" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">B</button>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="one" class="menu-item" type="button">One</button></li>
      <li><button id="two" class="menu-item" type="button">Two</button></li>
      <li><button id="three" class="menu-item" type="button">Three</button></li>
    </menu>
  `);
  const a = document.getElementById("a");
  const b = document.getElementById("b");
  const menu = document.getElementById("menu");
  const one = document.getElementById("one");
  const two = document.getElementById("two");
  setupGeometry(a, menu);

  press(a, "ArrowDown");
  expect(document.activeElement).toBe(one);

  // Both triggers now reference the same shared menu.
  press(b, "ArrowDown");
  expect(menu.hidden).toBe(false);

  // A single ArrowDown moves by exactly one item. With duplicated wiring it
  // would skip an item (two handlers each moving focus).
  press(one, "ArrowDown");
  expect(document.activeElement).toBe(two);
});

test("nav panel flyout focuses first descendant, not menu items", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button>
    <div id="menu" class="flyout" hidden>
      <section>
        <ul>
          <li><a id="first" href="/first">First</a></li>
          <li><a id="second" href="/second">Second</a></li>
        </ul>
      </section>
    </div>
  `);
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  const first = document.getElementById("first");
  setupGeometry(trigger, menu);

  press(trigger, "ArrowDown");

  expect(menu.hidden).toBe(false);
  expect(document.activeElement).toBe(first);
});

test("lightweight navigation covers the strict .menu > li > .menu-item contract", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="a" class="menu-item" type="button">A</button></li>
      <li><button id="b" class="menu-item" type="button">B</button></li>
      <li><button id="c" class="menu-item" type="button">C</button></li>
    </menu>
  `);
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  setupGeometry(trigger, menu);

  press(trigger, "ArrowDown");
  expect(document.activeElement).toBe(document.getElementById("a"));

  press(menu, "ArrowDown");
  expect(document.activeElement).toBe(document.getElementById("b"));

  press(menu, "ArrowDown");
  expect(document.activeElement).toBe(document.getElementById("c"));

  press(menu, "ArrowDown");
  expect(document.activeElement).toBe(document.getElementById("a"));

  press(menu, "ArrowUp");
  expect(document.activeElement).toBe(document.getElementById("c"));

  press(menu, "End");
  expect(document.activeElement).toBe(document.getElementById("c"));
  expect([...menu.querySelectorAll(".menu-item")].map((item) => item.tabIndex)).toEqual([0, 0, 0]);
});

test("flyout trigger gets initial disclosure attributes", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button>
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
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button>
    <div id="menu" class="flyout" role="menu" hidden></div>
  `);
  const trigger = document.getElementById("trigger");

  expect(trigger.hasAttribute("aria-haspopup")).toBe(false);
});

test("flyout stays at its markup position until it is opened", async () => {
  await loadFlyout(`
    <main><button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button>
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
    <button id="first-trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">First</button>
    <button id="second-trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Second</button>
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
  await loadFlyout(
    '<main><button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button></main>',
  );

  document
    .querySelector("main")
    .insertAdjacentHTML(
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
      <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button>
      <menu id="menu" class="flyout" hidden><li><button type="button">Old</button></li></menu>
    </main>
  `);
  const trigger = document.getElementById("trigger");
  const first = document.getElementById("menu");

  first.replaceWith(
    document
      .createRange()
      .createContextualFragment(
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

  // Reconnecting the replacement must release the detached menu's listeners.
  document.body.append(first);
  first.hidden = false;
  const staleItem = first.querySelector("button");
  press(first, "ArrowDown");
  expect(document.activeElement).not.toBe(staleItem);
});

test("flyout trigger opens nav panels and focuses the first link", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="panel" aria-expanded="false">Products</button>
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

test("nav panel fallback skips invisible items when checkVisibility is unavailable", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="panel" aria-expanded="false">Products</button>
    <div id="panel" class="flyout" hidden>
      <section>
        <button id="hidden" type="button" style="display:none">Hidden</button>
        <a id="visible" href="/visible">Visible</a>
      </section>
    </div>
  `);
  const trigger = document.getElementById("trigger");
  const panel = document.getElementById("panel");
  const hidden = document.getElementById("hidden");
  const visible = document.getElementById("visible");
  setupGeometry(trigger, panel);
  hidden.checkVisibility = undefined;
  visible.checkVisibility = undefined;
  hidden.getClientRects = () => [];
  visible.getClientRects = () => [{ width: 10, height: 10 }];

  press(trigger, "Enter");

  expect(panel.hidden).toBe(false);
  expect(document.activeElement).toBe(visible);
});

test("tab from an open nav panel trigger enters the panel", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="panel" aria-expanded="false">Products</button>
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

test("keyboard context menu focuses the first direct menu item", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="first" class="menu-item" type="button">First</button></li>
      <li><button id="second" class="menu-item" type="button">Second</button></li>
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
      <button id="trigger" type="button" data-context-menu-trigger aria-controls="menu">More</button>
    </div>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="first" class="menu-item" type="button">Open</button></li>
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
  expect(document.activeElement).toBe(menu);
  expect(detail.context).toBe(target);
  expect(detail.origin).toBe(trigger);
  expect(detail.trigger).toBe("button");
});

test("pointer context menu focuses the menu container, not the first item", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <menu id="menu" class="flyout" hidden>
      <li><button id="first" class="menu-item" type="button">First</button></li>
      <li><button id="second" class="menu-item" type="button">Second</button></li>
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

test("focus-induced scroll does not dismiss a pointer context menu", async () => {
  await loadContextMenu(`
    <article>
      <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
      <menu id="menu" class="flyout" hidden>
        <li><button class="menu-item" type="button">First</button></li>
      </menu>
    </article>
  `);
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  const nativeFocus = menu.focus.bind(menu);
  let focusOptions;
  menu.focus = (options) => {
    focusOptions = options;
    nativeFocus(options);
    document.dispatchEvent(new Event("scroll"));
  };
  setupGeometry(target, menu);

  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );
  await nextFrame();

  expect(focusOptions).toEqual({ preventScroll: true });
  expect(menu.parentNode).toBe(document.body);
  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
});

test("handled menu navigation does not arm scroll dismissal", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="first" class="menu-item" type="button">First</button></li>
    </menu>
  `);
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  const first = document.getElementById("first");
  const nativeFocus = first.focus.bind(first);
  first.focus = (options) => {
    nativeFocus(options);
    document.dispatchEvent(new Event("scroll"));
  };
  setupGeometry(target, menu);

  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );
  press(menu, "ArrowDown");
  await nextFrame();

  expect(document.activeElement).toBe(first);
  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
});

test("surface tracking starts after a context menu becomes visible", async () => {
  await loadContextMenu(`
    <article>
      <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
      <menu id="menu" class="flyout menu" hidden>
        <li><button class="menu-item" type="button">Open</button></li>
      </menu>
    </article>
  `);
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  let hiddenWhenObserved;

  window.ResizeObserver = class ResizeObserver {
    observe(element) {
      hiddenWhenObserved = element.hidden;
    }

    unobserve() {}
  };
  setupGeometry(target, menu);

  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );

  expect(menu.hidden).toBe(false);
  expect(hiddenWhenObserved).toBe(false);
});

test("a scroll queued before context-menu opening does not close the new menu", async () => {
  await loadContextMenu(`
    <article>
      <div id="first-target" data-context-menu="first-menu" tabindex="0">First.pdf</div>
      <menu id="first-menu" class="flyout menu" hidden>
        <li><button class="menu-item" type="button">Open</button></li>
      </menu>
      <div id="target" data-context-menu="menu" tabindex="0">Second.pdf</div>
      <menu id="menu" class="flyout menu" hidden>
        <li><button class="menu-item" type="button">Open</button></li>
      </menu>
    </article>
  `);
  const firstTarget = document.getElementById("first-target");
  const firstMenu = document.getElementById("first-menu");
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  setupGeometry(firstTarget, firstMenu);
  setupGeometry(target, menu);

  firstTarget.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 10, clientY: 20 }),
  );
  document.dispatchEvent(new Event("scroll"));
  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );
  await nextFrame();

  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
});

test("user scrolling after context-menu opening closes the menu", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <menu id="menu" class="flyout menu" hidden>
      <li><button class="menu-item" type="button">Open</button></li>
    </menu>
  `);
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  setupGeometry(target, menu);

  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );
  document.dispatchEvent(new Event("wheel"));
  document.dispatchEvent(new Event("scroll"));
  await nextFrame();

  expect(menu.hidden).toBe(true);
  expect(menu.classList.contains("is-open")).toBe(false);
});

test("scrolling inside a context menu does not dismiss it", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <menu id="menu" class="flyout menu" hidden>
      <li><button class="menu-item" type="button">Open</button></li>
    </menu>
  `);
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  setupGeometry(target, menu);

  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );
  menu.dispatchEvent(new Event("wheel"));
  menu.dispatchEvent(new Event("scroll"));
  await nextFrame();

  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
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

// Guards the import-time binding trap: surface.js is pulled in transitively
// here (no cache-busting query), so its document-level listener and its
// data-actual-surface reaper must attach to the document that owns the surface,
// not to whichever document existed when the module was first imported. Both
// were silently inert through this path before they became per-document.
test("an outside click closes a context menu opened through the shared surface", async () => {
  await loadContextMenu(`
    <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">First</button></li>
    </menu>
    <span id="elsewhere">elsewhere</span>
  `);
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  setupGeometry(target, menu);

  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );
  expect(menu.hidden).toBe(false);

  click(document.getElementById("elsewhere"));

  expect(menu.hidden).toBe(true);
  expect(menu.classList.contains("is-open")).toBe(false);
});

// D9 — removing a context target while its context menu is open in <body>
// closes the orphaned surface instead of leaving it open forever.
test("D9 — removing a context target closes its open context menu", async () => {
  await loadContextMenu(`
    <div id="wrapper">
      <div id="target" data-context-menu="menu" tabindex="0">File.pdf</div>
    </div>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">First</button></li>
    </menu>
  `);
  const wrapper = document.getElementById("wrapper");
  const target = document.getElementById("target");
  const menu = document.getElementById("menu");
  setupGeometry(target, menu);

  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 }),
  );
  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);

  wrapper.remove();
  await nextMicrotask();

  expect(menu.classList.contains("is-open")).toBe(false);
});

// D9 — removing a flyout trigger while its panel is open in <body>
// closes the orphaned panel.
test("D9 — removing a flyout trigger closes its open panel", async () => {
  await loadFlyout(`
    <div id="container">
      <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button>
    </div>
    <menu id="menu" class="flyout" hidden>
      <li><button type="button">First</button></li>
    </menu>
  `);
  const container = document.getElementById("container");
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  setupGeometry(trigger, menu);

  press(trigger, "Enter");
  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);

  container.remove();
  await nextMicrotask();

  expect(menu.classList.contains("is-open")).toBe(false);
});

test("removing an open flyout with its original parent removes the mounted panel", async () => {
  await loadFlyout(`
    <div id="container">
      <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu">Open</button>
      <menu id="menu" class="flyout menu" hidden>
        <li><button type="button" class="menu-item">Action</button></li>
      </menu>
    </div>
  `);
  const container = document.getElementById("container");
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  setupGeometry(trigger, menu);

  click(trigger);
  expect(menu.parentElement).toBe(document.body);

  container.remove();
  await nextMicrotask();

  expect(menu.isConnected).toBe(false);
});

test("removing the last flyout trigger restores its panel when the original parent survives", async () => {
  await loadFlyout(`
    <div id="container">
      <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu">Open</button>
      <menu id="menu" class="flyout menu" hidden>
        <li><button type="button" class="menu-item">Action</button></li>
      </menu>
    </div>
  `);
  const container = document.getElementById("container");
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  setupGeometry(trigger, menu);

  click(trigger);
  expect(menu.parentElement).toBe(document.body);

  trigger.remove();
  await nextMicrotask();

  expect(menu.parentElement).toBe(container);
  expect(menu.hidden).toBe(true);
});

test("multi-trigger — two triggers control the same panel independently", async () => {
  await loadFlyout(`
    <button id="first-trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">First</button>
    <button id="second-trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Second</button>
    <menu id="menu" class="flyout menu" hidden>
      <li><button type="button" class="menu-item">Action</button></li>
    </menu>
  `);
  const first = document.getElementById("first-trigger");
  const second = document.getElementById("second-trigger");
  const menu = document.getElementById("menu");
  setupGeometry(first, menu);

  click(first);
  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
  expect(first.getAttribute("aria-expanded")).toBe("true");
  expect(second.getAttribute("aria-expanded")).toBe("true");

  click(first);
  await nextMicrotask();
  expect(menu.hidden).toBe(true);
  expect(first.getAttribute("aria-expanded")).toBe("false");
  expect(second.getAttribute("aria-expanded")).toBe("false");

  click(second);
  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);

  click(second);
  await nextMicrotask();
  expect(menu.hidden).toBe(true);
});

test("multi-trigger — removing the active trigger closes the panel cleanly", async () => {
  await loadFlyout(`
    <div id="container">
      <button id="first" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">First</button>
    </div>
    <button id="second" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Second</button>
    <menu id="menu" class="flyout menu" hidden>
      <li><button type="button" class="menu-item">Action</button></li>
    </menu>
  `);
  const container = document.getElementById("container");
  const first = document.getElementById("first");
  const second = document.getElementById("second");
  const menu = document.getElementById("menu");
  setupGeometry(first, menu);

  click(first);
  expect(menu.hidden).toBe(false);

  container.remove();
  await nextMicrotask();

  expect(menu.classList.contains("is-open")).toBe(false);
  expect(second.getAttribute("aria-expanded")).toBe("false");

  setupGeometry(second, menu);
  click(second);
  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
});

test("multi-trigger — restore focus to the trigger that opened the panel", async () => {
  await loadFlyout(`
    <button id="first-trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">First</button>
    <button id="second-trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Second</button>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="item" type="button" class="menu-item">Action</button></li>
    </menu>
  `);
  const first = document.getElementById("first-trigger");
  const second = document.getElementById("second-trigger");
  const menu = document.getElementById("menu");
  const item = document.getElementById("item");
  setupGeometry(first, menu);

  click(first);
  item.focus();
  press(menu, "Escape");

  expect(document.activeElement).toBe(first);

  click(second);
  expect(menu.hidden).toBe(false);
  item.focus();
  press(menu, "Escape");

  expect(document.activeElement).toBe(second);
});

test("autoClose — menu-item click keeps surface open with data-flyout-auto-close='outside'", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button>
    <menu id="menu" class="flyout menu" data-flyout-auto-close="outside" hidden>
      <li><button id="item" type="button" class="menu-item">Stay open</button></li>
    </menu>
  `);
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  const item = document.getElementById("item");
  setupGeometry(trigger, menu);

  click(trigger);
  expect(menu.hidden).toBe(false);

  click(item);
  expect(menu.hidden).toBe(false);
  expect(menu.classList.contains("is-open")).toBe(true);
});

test("autoClose — menu-item click closes surface with data-flyout-auto-close='true' (default)", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu" aria-expanded="false">Open</button>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="item" type="button" class="menu-item">Close</button></li>
    </menu>
  `);
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  const item = document.getElementById("item");
  setupGeometry(trigger, menu);

  click(trigger);
  expect(menu.hidden).toBe(false);

  click(item);
  expect(menu.hidden).toBe(true);
});

test("autoClose — rich panel inside clicks follow data-flyout-auto-close='inside'", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="panel">Open</button>
    <div id="panel" class="flyout" data-flyout-auto-close="inside" hidden>
      <button id="item" type="button">Apply</button>
    </div>
    <button id="outside" type="button">Outside</button>
  `);
  const trigger = document.getElementById("trigger");
  const panel = document.getElementById("panel");
  setupGeometry(trigger, panel);

  click(trigger);
  click(document.getElementById("outside"));
  expect(panel.hidden).toBe(false);

  click(document.getElementById("item"));
  expect(panel.hidden).toBe(true);
});

test("autoClose — keyboard activation follows the outside-only policy", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu">Open</button>
    <menu id="menu" class="flyout menu" data-flyout-auto-close="outside" hidden>
      <li><button id="item" type="button" class="menu-item" role="menuitem">Stay open</button></li>
    </menu>
  `);
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  const item = document.getElementById("item");
  setupGeometry(trigger, menu);

  press(trigger, "ArrowDown");
  press(menu, "Enter");

  expect(menu.hidden).toBe(false);
  expect(document.activeElement).toBe(item);
});

test("autoClose — disabled menu items do not dismiss the surface", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu">Open</button>
    <menu id="menu" class="flyout menu" hidden>
      <li><button id="item" type="button" class="menu-item" aria-disabled="true">Unavailable</button></li>
    </menu>
  `);
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  const item = document.getElementById("item");
  setupGeometry(trigger, menu);

  click(trigger);
  click(item);

  expect(menu.hidden).toBe(false);
});

test("data-flyout-close dismisses a manual rich panel", async () => {
  await loadFlyout(`
    <button id="trigger" type="button" data-enhance="flyout" aria-controls="panel">Open</button>
    <div id="panel" class="flyout" data-flyout-auto-close="false" hidden>
      <button id="keep" type="button">Keep open</button>
      <button id="close" type="button" data-flyout-close>Close</button>
    </div>
  `);
  const trigger = document.getElementById("trigger");
  const panel = document.getElementById("panel");
  setupGeometry(trigger, panel);

  click(trigger);
  click(document.getElementById("keep"));
  expect(panel.hidden).toBe(false);

  click(document.getElementById("close"));
  expect(panel.hidden).toBe(true);
});

for (const [role, key] of [
  ["menuitemcheckbox", "Enter"],
  ["menuitemradio", " "],
]) {
  test(`keyboard activation recognizes ${role} with ${key === " " ? "Space" : key} without owning its state`, async () => {
    await loadFlyout(`
      <button id="trigger" type="button" data-enhance="flyout" aria-controls="menu">Open</button>
      <menu id="menu" class="flyout menu" data-flyout-auto-close="outside" role="menu" hidden>
        <li><button id="item" type="button" class="menu-item" role="${role}" aria-checked="false">Option</button></li>
      </menu>
    `);
    const trigger = document.getElementById("trigger");
    const menu = document.getElementById("menu");
    const item = document.getElementById("item");
    let activations = 0;
    item.addEventListener("click", () => activations++);
    setupGeometry(trigger, menu);

    press(trigger, "ArrowDown");
    press(menu, key);

    expect(activations).toBe(1);
    expect(item.getAttribute("aria-checked")).toBe("false");
    expect(menu.hidden).toBe(false);
  });
}
