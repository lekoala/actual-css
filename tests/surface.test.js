import { afterAll, afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, mockRect, nextMicrotask, press, setupDOM } from "./helpers/dom.js";
import { EVENTS } from "../src/js/events.js";

setupDOM();

const {
  closeSurface,
  disconnectSurface,
  isSurfaceOpen,
  openSurface,
  prepareSurface,
} = await import(`../src/js/surface.js?test=${Date.now()}`);

function setBody(html) {
  document.body.innerHTML = html;
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: 1024,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: 768,
  });
}

function mockPlacement(trigger, menu) {
  mockRect(trigger, { x: 20, y: 30, width: 120, height: 32 });
  mockRect(menu, { x: 0, y: 0, width: 160, height: 80 });
}

afterEach(() => {
  document.querySelectorAll(".flyout").forEach((menu) => disconnectSurface(menu));
  document.body.innerHTML = "";
});

afterAll(() => {
  cleanupDOM();
});

test("openSurface reveals a menu and syncs linked triggers", () => {
  setBody('<button aria-controls="menu" aria-expanded="false">Open</button><div id="menu" class="flyout" hidden></div>');
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger });

  expect(menu.hidden).toBe(false);
  expect(menu.style.display).toBe("");
  expect(menu.classList.contains("is-open")).toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(isSurfaceOpen(menu)).toBe(true);
});

test("closeSurface hides a menu and resets presentation state", () => {
  setBody('<button aria-controls="menu" aria-expanded="false">Open</button><div id="menu" class="flyout" data-flyout-mobile="sheet"></div>');
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger });

  closeSurface(menu);

  expect(menu.hidden).toBe(true);
  expect(menu.style.display).toBe("");
  expect(menu.classList.contains("is-open")).toBe(false);
  expect(menu.classList.contains("is-sheet")).toBe(false);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});

test("opening one surface closes another open surface", () => {
  setBody(`
    <button id="a-trigger" aria-controls="a"></button>
    <div id="a" class="flyout"></div>
    <button id="b-trigger" aria-controls="b"></button>
    <div id="b" class="flyout"></div>
  `);
  const triggerA = document.getElementById("a-trigger");
  const triggerB = document.getElementById("b-trigger");
  const menuA = document.getElementById("a");
  const menuB = document.getElementById("b");
  mockPlacement(triggerA, menuA);
  mockPlacement(triggerB, menuB);

  openSurface(menuA, { trigger: triggerA });
  openSurface(menuB, { trigger: triggerB });

  expect(isSurfaceOpen(menuA)).toBe(false);
  expect(isSurfaceOpen(menuB)).toBe(true);
  expect(triggerA.getAttribute("aria-expanded")).toBe("false");
  expect(triggerB.getAttribute("aria-expanded")).toBe("true");
});

test("closeSurface can restore focus to the opening trigger", () => {
  setBody('<button aria-controls="menu">Open</button><div id="menu" class="flyout"></div>');
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger });
  document.body.focus();

  closeSurface(menu, { restoreFocus: true });

  expect(document.activeElement).toBe(trigger);
});

test("out-of-view hide closes without restoring focus", () => {
  setBody('<button aria-controls="menu">Open</button><button id="next">Next</button><div id="menu" class="flyout"></div>');
  const trigger = document.querySelector("button[aria-controls]");
  const next = document.getElementById("next");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger });
  next.focus();

  menu.dispatchEvent(
    new CustomEvent(EVENTS.hide, { detail: { type: "out-of-view" } }),
  );

  expect(isSurfaceOpen(menu)).toBe(false);
  expect(document.activeElement).toBe(next);
});

test("escape hide closes and restores focus without scrolling", () => {
  setBody('<button aria-controls="menu">Open</button><button id="next">Next</button><div id="menu" class="flyout"></div>');
  const trigger = document.querySelector("button[aria-controls]");
  const next = document.getElementById("next");
  const menu = document.getElementById("menu");
  let preventScroll;
  trigger.focus = (opts) => {
    preventScroll = opts?.preventScroll;
    HTMLElement.prototype.focus.call(trigger);
  };
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger });
  next.focus();

  menu.dispatchEvent(new CustomEvent(EVENTS.hide, { detail: { type: "escape" } }));

  expect(isSurfaceOpen(menu)).toBe(false);
  expect(document.activeElement).toBe(trigger);
  expect(preventScroll).toBe(true);
});

test("prepareSurface mounts to the surface root and disconnectSurface restores it", () => {
  setBody('<section id="host"><button id="next"></button><div id="menu" class="flyout"></div></section>');
  const host = document.getElementById("host");
  const next = document.getElementById("next");
  const menu = document.getElementById("menu");

  prepareSurface(menu, next);

  expect(menu.parentNode).toBe(document.body);
  expect(menu.hidden).toBe(true);
  expect(menu.style.position).toBe("fixed");
  expect(menu.style.display).toBe("");

  disconnectSurface(menu);

  expect(menu.parentNode).toBe(host);
  expect(menu.previousElementSibling).toBe(next);
});

test("sheet mode adds sheet class and backdrop", () => {
  setBody('<button aria-controls="menu"></button><div id="menu" class="flyout" data-flyout-mobile="sheet"></div>');
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger });

  expect(menu.classList.contains("is-sheet")).toBe(true);
  expect(document.querySelector(".surface-backdrop")).not.toBeNull();
});

test("sheet close hides the backdrop immediately and removes it after animations", async () => {
  setBody('<button aria-controls="menu"></button><div id="menu" class="flyout" data-flyout-mobile="sheet"></div>');
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger });

  const backdrop = document.querySelector(".surface-backdrop");
  let finish;
  const finished = new Promise((resolve) => {
    finish = resolve;
  });
  menu.getAnimations = () => [{ finished }];
  backdrop.getAnimations = () => [];

  closeSurface(menu);

  expect(menu.hidden).toBe(true);
  expect(backdrop.hidden).toBe(true);
  expect(backdrop.isConnected).toBe(true);

  finish();
  await nextMicrotask();

  expect(backdrop.isConnected).toBe(false);
});

test("reopening a sheet cancels stale close cleanup", async () => {
  setBody('<button aria-controls="menu"></button><div id="menu" class="flyout" data-flyout-mobile="sheet"></div>');
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger });

  const backdrop = document.querySelector(".surface-backdrop");
  let finish;
  const finished = new Promise((resolve) => {
    finish = resolve;
  });
  menu.getAnimations = () => [{ finished }];
  backdrop.getAnimations = () => [];

  closeSurface(menu);
  openSurface(menu, { trigger });

  expect(backdrop.hidden).toBe(false);
  expect(backdrop.isConnected).toBe(true);

  finish();
  await nextMicrotask();

  expect(backdrop.isConnected).toBe(true);
  expect(isSurfaceOpen(menu)).toBe(true);
});

test("prepareSurface mounts surfaces inside an open dialog root", () => {
  setBody(`
    <dialog id="modal" open>
      <section id="host"><button id="trigger"></button><div id="menu" class="flyout"></div></section>
    </dialog>
  `);
  const dialog = document.getElementById("modal");
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");

  prepareSurface(menu, trigger);

  expect(menu.parentNode).toBe(dialog);

  disconnectSurface(menu);
});

test("default auto-close closes from menu item clicks and outside clicks", () => {
  setBody('<button aria-controls="menu"></button><div id="menu" class="flyout"><button>Item</button></div><span id="outside"></span>');
  const trigger = document.querySelector("button[aria-controls]");
  const item = document.querySelector(".flyout button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger });
  click(item);
  expect(isSurfaceOpen(menu)).toBe(false);

  openSurface(menu, { trigger });
  click(document.getElementById("outside"));
  expect(isSurfaceOpen(menu)).toBe(false);
});

test("arrow keys rove direct flyout action items", () => {
  setBody(`
    <button aria-controls="menu"></button>
    <menu id="menu" class="flyout">
      <li><button id="first" type="button">First</button></li>
      <li><button id="second" type="button">Second</button></li>
    </menu>
  `);
  const trigger = document.querySelector("button[aria-controls]");
  const menu = document.getElementById("menu");
  const first = document.getElementById("first");
  const second = document.getElementById("second");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger });
  first.focus();
  press(first, "ArrowDown");

  expect(document.activeElement).toBe(second);

  press(second, "ArrowUp");

  expect(document.activeElement).toBe(first);
});

test("arrow keys skip hidden flyout action items", () => {
  setBody(`
    <button aria-controls="menu"></button>
    <menu id="menu" class="flyout">
      <li><button id="first" type="button">First</button></li>
      <li hidden><button id="hidden" type="button">Hidden</button></li>
      <li><button id="second" type="button">Second</button></li>
    </menu>
  `);
  const trigger = document.querySelector("button[aria-controls]");
  const menu = document.getElementById("menu");
  const first = document.getElementById("first");
  const second = document.getElementById("second");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger });
  first.focus();
  press(first, "ArrowDown");

  expect(document.activeElement).toBe(second);
});

test("outside-only auto-close keeps inside clicks open", () => {
  setBody('<button aria-controls="menu"></button><div id="menu" class="flyout" data-flyout-auto-close="outside"><button>Item</button></div><span id="outside"></span>');
  const trigger = document.querySelector("button[aria-controls]");
  const item = document.querySelector(".flyout button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger });
  click(item);
  expect(isSurfaceOpen(menu)).toBe(true);

  click(document.getElementById("outside"));
  expect(isSurfaceOpen(menu)).toBe(false);
});

test("disabled auto-close keeps inside and outside clicks open", () => {
  setBody('<button aria-controls="menu"></button><div id="menu" class="flyout" data-flyout-auto-close="false"><button>Item</button></div><span id="outside"></span>');
  const trigger = document.querySelector("button[aria-controls]");
  const item = document.querySelector(".flyout button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger });
  click(item);
  click(document.getElementById("outside"));

  expect(isSurfaceOpen(menu)).toBe(true);
});
