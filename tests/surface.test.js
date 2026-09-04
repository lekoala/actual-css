import { afterAll, afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, mockRect, nextMicrotask, setupDOM } from "./helpers/dom.js";
import { nextFrame } from "./helpers/layout.js";

// The transport no longer uses [hidden]; .is-open is the lifecycle state.
const isOpen = (el) => el.classList.contains("is-open");

setupDOM();

const {
  closeSurface,
  disconnectSurface,
  isSurfaceOpen,
  openSurface,
  prepareSurface,
  retainSurface,
} = await import(`../src/js/surface.js?test=${Date.now()}`);

function captureWarnings(run) {
  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args.map(String).join(" "));
  try {
    run();
  } finally {
    console.warn = original;
  }
  return warnings;
}

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
  document.querySelectorAll(".flyout").forEach((menu) => {
    disconnectSurface(menu);
  });
  document.body.innerHTML = "";
});

afterAll(() => {
  cleanupDOM();
});

test("openSurface reveals a menu and syncs linked triggers", () => {
  setBody(
    '<button aria-controls="menu" aria-expanded="false">Open</button><div id="menu" class="flyout" hidden></div>',
  );
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger });

  expect(isOpen(menu)).toBe(true);
  expect(menu.style.display).toBe("");
  expect(menu.classList.contains("is-open")).toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(isSurfaceOpen(menu)).toBe(true);
});

test("closeSurface hides a menu and resets presentation state", async () => {
  setBody(
    '<button aria-controls="menu" aria-expanded="false">Open</button><div id="menu" class="flyout"></div>',
  );
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger, mobile: "sheet" });

  closeSurface(menu);

  expect(isOpen(menu)).toBe(false);
  expect(menu.style.display).toBe("");
  expect(menu.classList.contains("is-open")).toBe(false);
  expect(menu.classList.contains("is-sheet")).toBe(true);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");

  await nextMicrotask();
  expect(menu.classList.contains("is-sheet")).toBe(false);
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

test("closeSurface restores focus by default when focus is inside the surface", () => {
  setBody(
    '<button aria-controls="menu">Open</button><div id="menu" class="flyout"><button id="item">Item</button></div>',
  );
  const trigger = document.querySelector("button[aria-controls]");
  const item = document.getElementById("item");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger });
  item.focus();

  closeSurface(menu);

  expect(document.activeElement).toBe(trigger);
});

test("Escape key closes the top surface and restores focus", () => {
  setBody(
    '<button id="trigger" aria-controls="menu">Open</button><button id="next">Next</button><div id="menu" class="flyout"></div>',
  );
  const trigger = document.getElementById("trigger");
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

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  expect(isSurfaceOpen(menu)).toBe(false);
  expect(document.activeElement).toBe(trigger);
  expect(preventScroll).toBe(true);
});

test("Escape closes the surface that is open, not a stale closed one", () => {
  setBody(
    '<button id="a" aria-controls="menuA">A</button><button id="b" aria-controls="menuB">B</button><div id="menuA" class="flyout"></div><div id="menuB" class="flyout"></div>',
  );
  const triggerA = document.getElementById("a");
  const triggerB = document.getElementById("b");
  const menuA = document.getElementById("menuA");
  const menuB = document.getElementById("menuB");
  mockPlacement(triggerA, menuA);
  mockPlacement(triggerB, menuB);

  openSurface(menuA, { trigger: triggerA });
  closeSurface(menuA);
  openSurface(menuB, { trigger: triggerB });
  closeSurface(menuB);
  openSurface(menuA, { trigger: triggerA });

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  expect(isSurfaceOpen(menuA)).toBe(false);
});

test("positionSurface failure leaves the surface closed", () => {
  setBody(
    '<button id="trigger" aria-controls="menu">Open</button><div id="menu" class="flyout"></div>',
  );
  const trigger = document.getElementById("trigger");
  const menu = document.getElementById("menu");
  mockRect(trigger, { x: -220, y: 100, width: 60, height: 24 });
  mockRect(menu, { x: 0, y: 0, width: 120, height: 80 });

  const result = openSurface(menu, { trigger });

  expect(result).toBe(false);
  expect(isSurfaceOpen(menu)).toBe(false);
});

test("prepareSurface leaves the surface at its original position", () => {
  setBody(
    '<section id="host"><button id="next"></button><div id="menu" class="flyout"></div></section>',
  );
  const host = document.getElementById("host");
  const next = document.getElementById("next");
  const menu = document.getElementById("menu");

  prepareSurface(menu);

  expect(menu.parentNode).toBe(host);
  expect(menu.previousElementSibling).toBe(next);
  expect(isOpen(menu)).toBe(false);
  expect(menu.style.position).toBe("fixed");
  expect(menu.style.display).toBe("");
});

test("sheet mode adds sheet class and backdrop", () => {
  setBody('<button aria-controls="menu"></button><div id="menu" class="flyout"></div>');
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger, mobile: "sheet" });

  expect(menu.classList.contains("is-sheet")).toBe(true);
  expect(menu.getAttribute("role")).toBeNull();
  expect(menu.getAttribute("aria-modal")).toBeNull();
  expect(document.querySelector(".surface-backdrop")).not.toBeNull();
});

test("sheet mode preserves author-provided semantic attributes", () => {
  setBody(
    '<button aria-controls="menu"></button><div id="menu" class="flyout" role="menu" aria-modal="false"></div>',
  );
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger, mobile: "sheet" });
  closeSurface(menu);

  expect(menu.getAttribute("role")).toBe("menu");
  expect(menu.getAttribute("aria-modal")).toBe("false");
});

test("sheet close hides the backdrop immediately and removes it after transitions", async () => {
  setBody('<button aria-controls="menu"></button><div id="menu" class="flyout"></div>');
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger, mobile: "sheet" });

  const backdrop = document.querySelector(".surface-backdrop");
  let finish;
  const finished = new Promise((resolve) => {
    finish = resolve;
  });
  menu.getAnimations = () => [{ transitionProperty: "opacity", finished }];
  backdrop.getAnimations = () => [];

  closeSurface(menu);

  expect(isOpen(menu)).toBe(false);
  expect(backdrop.hidden).toBe(true);
  expect(backdrop.isConnected).toBe(true);

  finish();
  await nextMicrotask();

  expect(backdrop.isConnected).toBe(false);
});

test("sheet cleanup does not wait for an endless descendant animation", async () => {
  setBody(
    '<button aria-controls="menu"></button><div id="menu" class="flyout"><span></span></div>',
  );
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger, mobile: "sheet" });

  const backdrop = document.querySelector(".surface-backdrop");
  menu.getAnimations = () => [{ finished: new Promise(() => {}) }];
  backdrop.getAnimations = () => [];

  closeSurface(menu);
  await nextMicrotask();

  expect(backdrop.isConnected).toBe(false);
});

test("reopening a sheet cancels stale close cleanup", async () => {
  setBody('<button aria-controls="menu"></button><div id="menu" class="flyout"></div>');
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  openSurface(menu, { trigger, mobile: "sheet" });

  const backdrop = document.querySelector(".surface-backdrop");
  let finish;
  const finished = new Promise((resolve) => {
    finish = resolve;
  });
  menu.getAnimations = () => [{ transitionProperty: "opacity", finished }];
  backdrop.getAnimations = () => [];

  closeSurface(menu);
  openSurface(menu, { trigger, mobile: "sheet" });

  expect(backdrop.hidden).toBe(false);
  expect(backdrop.isConnected).toBe(true);

  finish();
  await nextMicrotask();

  expect(backdrop.isConnected).toBe(true);
  expect(isSurfaceOpen(menu)).toBe(true);
});

test("default auto-close closes from outside clicks", () => {
  setBody(
    '<button aria-controls="menu"></button><div id="menu" class="flyout"><button>Item</button></div><span id="outside"></span>',
  );
  const trigger = document.querySelector("button[aria-controls]");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger });
  click(document.getElementById("outside"));
  expect(isSurfaceOpen(menu)).toBe(false);
});

test("inside-and-outside auto-close closes from inside clicks in rich panels", () => {
  setBody(
    '<button aria-controls="menu"></button><div id="menu" class="flyout"><button id="item">Item</button></div>',
  );
  const trigger = document.querySelector("button[aria-controls]");
  const item = document.getElementById("item");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger, autoClose: "true" });
  click(item);

  expect(isSurfaceOpen(menu)).toBe(false);
});

test("inside-only auto-close closes inside clicks and ignores outside clicks", () => {
  setBody(
    '<button aria-controls="menu"></button><div id="menu" class="flyout"><button id="item">Item</button></div><span id="outside"></span>',
  );
  const trigger = document.querySelector("button[aria-controls]");
  const item = document.getElementById("item");
  const outside = document.getElementById("outside");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger, autoClose: "inside" });
  click(outside);
  expect(isSurfaceOpen(menu)).toBe(true);

  click(item);
  expect(isSurfaceOpen(menu)).toBe(false);
});

test("outside-only auto-close keeps inside clicks open", () => {
  setBody(
    '<button aria-controls="menu"></button><div id="menu" class="flyout"><button>Item</button></div><span id="outside"></span>',
  );
  const trigger = document.querySelector("button[aria-controls]");
  const item = document.querySelector(".flyout button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger, autoClose: "outside" });
  click(item);
  expect(isSurfaceOpen(menu)).toBe(true);

  click(document.getElementById("outside"));
  expect(isSurfaceOpen(menu)).toBe(false);
});

test("disabled auto-close keeps inside and outside clicks open", () => {
  setBody(
    '<button aria-controls="menu"></button><div id="menu" class="flyout"><button>Item</button></div><span id="outside"></span>',
  );
  const trigger = document.querySelector("button[aria-controls]");
  const item = document.querySelector(".flyout button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger, autoClose: "false" });
  click(item);
  click(document.getElementById("outside"));

  expect(isSurfaceOpen(menu)).toBe(true);
});

test("data-flyout-close explicitly closes a manual surface", () => {
  setBody(`
    <button aria-controls="menu"></button>
    <div id="menu" class="flyout">
      <button id="keep-open">Keep open</button>
      <button id="close" data-flyout-close>Close</button>
    </div>
  `);
  const trigger = document.querySelector("button[aria-controls]");
  const keepOpen = document.getElementById("keep-open");
  const close = document.getElementById("close");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger, autoClose: false });
  click(keepOpen);
  expect(isSurfaceOpen(menu)).toBe(true);

  click(close);
  expect(isSurfaceOpen(menu)).toBe(false);
});

test("manual auto-close also applies to the sheet backdrop", () => {
  setBody('<button aria-controls="menu"></button><div id="menu" class="flyout"></div>');
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger, mobile: "sheet", autoClose: false });
  click(document.querySelector(".surface-backdrop"));

  expect(isSurfaceOpen(menu)).toBe(true);
});

test("scroll dismissal ignores opening scroll and closes after new user input", async () => {
  setBody('<button id="source"></button><div id="menu" class="flyout"></div>');
  const source = document.getElementById("source");
  const menu = document.getElementById("menu");
  mockPlacement(source, menu);

  openSurface(menu, { source, x: 20, y: 30, dismissOnScroll: true });
  document.dispatchEvent(new Event("scroll"));
  await nextFrame();
  expect(isSurfaceOpen(menu)).toBe(true);

  document.dispatchEvent(new Event("wheel"));
  document.dispatchEvent(new Event("scroll"));
  await nextFrame();
  expect(isSurfaceOpen(menu)).toBe(false);
});

test("scroll dismissal is opt-in", async () => {
  setBody('<button id="source"></button><div id="menu" class="flyout"></div>');
  const source = document.getElementById("source");
  const menu = document.getElementById("menu");
  mockPlacement(source, menu);

  openSurface(menu, { source, x: 20, y: 30 });
  document.dispatchEvent(new Event("wheel"));
  document.dispatchEvent(new Event("scroll"));
  await nextFrame();

  expect(isSurfaceOpen(menu)).toBe(true);
});

test("unknown auto-close values fall back to the default policy", () => {
  setBody(
    '<button aria-controls="menu"></button><div id="menu" class="flyout"><button id="item">Item</button></div>',
  );
  const trigger = document.querySelector("button[aria-controls]");
  const item = document.getElementById("item");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger, autoClose: "typo" });
  click(item);

  expect(isSurfaceOpen(menu)).toBe(false);
});

test("removing an open surface leaves it disconnected and clears its backdrop", async () => {
  setBody(
    '<section id="parent"><div id="menu" class="flyout"></div></section><button id="outside">x</button>',
  );
  const menu = document.getElementById("menu");
  const outside = document.getElementById("outside");
  mockPlacement(outside, menu);

  openSurface(menu, { trigger: outside });
  expect(isSurfaceOpen(menu)).toBe(true);

  menu.remove();
  await nextMicrotask();

  expect(menu.isConnected).toBe(false);
  expect(document.querySelector(".surface-backdrop")).toBe(null);
});

test("disconnectSurface closes a still-connected surface", () => {
  setBody(
    '<section id="parent"><div id="menu" class="flyout"></div></section><button id="outside">x</button>',
  );
  const menu = document.getElementById("menu");
  const parent = document.getElementById("parent");
  const outside = document.getElementById("outside");
  mockPlacement(outside, menu);

  openSurface(menu, { trigger: outside });
  disconnectSurface(menu);

  expect(isSurfaceOpen(menu)).toBe(false);
  expect(menu.parentNode).toBe(parent);
});

/*
 * Opening used to relocate the node, which tripped the enhancement reaper's
 * disconnect callback and had to be worked around. Promotion cannot trip it at
 * all, so only the marker contract is left to assert.
 */
test("opening marks the surface for the reaper without tearing it down", () => {
  setBody(
    '<section id="parent"><div id="menu" class="flyout"></div></section><button id="outside">x</button>',
  );
  const menu = document.getElementById("menu");
  const outside = document.getElementById("outside");
  mockPlacement(outside, menu);

  openSurface(menu, { trigger: outside });

  expect(isSurfaceOpen(menu)).toBe(true);
  expect(menu.hasAttribute("data-actual-surface")).toBe(true);
});

/*
 * The transport is set by the runtime, never asked of the author: a surface is
 * marked up exactly as before. [hidden] belonged to the old transport and must
 * not survive as a second closed-state signal, since it would outrank the
 * platform's own.
 */
test("preparing a surface installs the transport and drops the old one", () => {
  setBody('<div id="menu" class="flyout" hidden></div>');
  const panel = document.getElementById("menu");

  prepareSurface(panel);

  expect(panel.getAttribute("popover")).toBe("manual");
  expect(panel.hasAttribute("hidden")).toBe(false);
});

/*
 * An author's own mode is overwritten rather than respected: "auto" would give
 * the UA a dismissal policy, and native light dismiss closes on outside clicks
 * only — which cannot express data-flyout-auto-close and would defeat
 * data-flyout-auto-close="false" outright.
 */
test("preparing a surface overrides an author's own popover mode", () => {
  setBody('<div id="menu" class="flyout" popover="auto"></div>');
  const panel = document.getElementById("menu");

  prepareSurface(panel);

  expect(panel.getAttribute("popover")).toBe("manual");
});

test("retaining a surface warns about nothing", () => {
  setBody('<div id="menu" class="flyout"></div>');
  const panel = document.getElementById("menu");

  expect(captureWarnings(() => retainSurface(panel)())).toEqual([]);
});

/*
 * The new transport invariant: promotion to the top layer replaces relocation,
 * so the surface never leaves the place the author put it. This locks the
 * cause; the browser tests in surface-inherited-context lock its consequences.
 */
test("the surface DOM parent is unchanged before, during and after opening", async () => {
  setBody(
    '<section id="scope"><div class="flyout-trigger">' +
      '<button aria-controls="menu">Open</button>' +
      '<div id="menu" class="flyout"></div>' +
      "</div></section>",
  );
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);
  const parent = menu.parentNode;

  prepareSurface(menu);
  expect(menu.parentNode).toBe(parent);

  openSurface(menu, { trigger });
  expect(isSurfaceOpen(menu)).toBe(true);
  expect(menu.parentNode).toBe(parent);

  closeSurface(menu);
  expect(menu.parentNode).toBe(parent);
  await nextFrame();
  await nextMicrotask();
  expect(menu.parentNode).toBe(parent);
});

test("a surface inside a dialog also stays where it was authored", () => {
  setBody(
    '<dialog open><div id="scope"><button aria-controls="menu">Open</button>' +
      '<div id="menu" class="flyout"></div></div></dialog>',
  );
  const trigger = document.querySelector("button");
  const menu = document.getElementById("menu");
  mockPlacement(trigger, menu);

  openSurface(menu, { trigger });

  expect(menu.parentNode.id).toBe("scope");
});
