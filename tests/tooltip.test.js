import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, mockRect, nextMicrotask, setupDOM } from "./helpers/dom.js";
import { nextFrame } from "./helpers/layout.js";

let importId = 0;
/** The tooltip module instance for the current test — each load is cache-busted. */
let api;

async function loadTooltip(html) {
  setupDOM(html);
  api = await import(`../src/js/tooltip.js?test=${++importId}`);
}

/*
 * The runtime's own visibility state, read through the module rather than off
 * the element. [hidden] is no longer the state machine, and happy-dom answers
 * matches(":popover-open") with a silent `false` — see helpers/popover-stub.js.
 * Whether the transport really promotes lives in tests/browser.
 */
const visible = (tip) => api.isTooltipVisible(tip);

function hover(el) {
  el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
}

function leave(el) {
  el.dispatchEvent(new MouseEvent("mouseleave"));
}

function click(el) {
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

// The show delay is 150ms; wait past it with real timers.
function waitForShow() {
  return new Promise((resolve) => setTimeout(resolve, 200));
}

function waitForHide() {
  return new Promise((resolve) => setTimeout(resolve, 140));
}

afterEach(() => {
  cleanupDOM();
});

test("data-tooltip generates a tooltip lazily on first hover", async () => {
  await loadTooltip('<button data-tooltip="Help text">Trigger</button>');
  const trigger = document.querySelector("button");

  expect(document.querySelector('[role="tooltip"]')).toBeNull();

  hover(trigger);
  const tip = document.querySelector('[role="tooltip"]');

  expect(tip).not.toBeNull();
  expect(tip.textContent).toBe("Help text");
  expect(trigger.getAttribute("aria-describedby")).toBe(tip.id);
  expect(visible(tip)).toBe(false);

  await waitForShow();

  expect(visible(tip)).toBe(true);
});

test("shorthand content stays text while explicit tooltips support HTML", async () => {
  await loadTooltip(`
    <button id="plain" data-tooltip="<strong>Plain</strong>">Plain</button>
    <button id="rich" data-tooltip aria-describedby="rich-tip">Rich</button>
    <div role="tooltip" id="rich-tip" hidden><strong>Rich</strong> content</div>
  `);

  hover(document.getElementById("plain"));
  hover(document.getElementById("rich"));
  await waitForShow();

  const generated = document.querySelector('[role="tooltip"]:not(#rich-tip)');
  expect(generated.textContent).toBe("<strong>Plain</strong>");
  expect(generated.querySelector("strong")).toBeNull();
  expect(document.querySelector("#rich-tip strong")?.textContent).toBe("Rich");
});

test("data-tooltip-click toggles on click and ignores hover", async () => {
  await loadTooltip('<button data-tooltip="Click help" data-tooltip-click>Trigger</button>');
  const trigger = document.querySelector("button");

  hover(trigger);
  await waitForShow();
  expect(document.querySelector('[role="tooltip"]')).toBeNull();

  click(trigger);
  const tip = document.querySelector('[role="tooltip"]');
  expect(visible(tip)).toBe(true);

  leave(trigger);
  await waitForHide();
  expect(visible(tip)).toBe(true);

  click(trigger);
  expect(visible(tip)).toBe(false);
});

test("data-tooltip-visible eagerly creates and keeps a tooltip visible", async () => {
  await loadTooltip('<button data-tooltip="Persistent help" data-tooltip-visible>Trigger</button>');
  const trigger = document.querySelector("button");
  const tip = document.querySelector('[role="tooltip"]');

  expect(tip).not.toBeNull();
  expect(visible(tip)).toBe(true);

  leave(trigger);
  await waitForHide();
  expect(visible(tip)).toBe(true);

  const escapeEvent = new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(escapeEvent);
  expect(visible(tip)).toBe(true);
  expect(escapeEvent.defaultPrevented).toBe(false);
});

test("data-tooltip-visible starts hidden when its trigger is outside the viewport", async () => {
  setupDOM('<button data-tooltip="Persistent help" data-tooltip-visible>Trigger</button>');
  const trigger = document.querySelector("button");
  mockRect(trigger, { x: 0, y: window.innerHeight + 100, width: 100, height: 40 });

  api = await import(`../src/js/tooltip.js?test=${++importId}`);

  expect(visible(document.querySelector('[role="tooltip"]'))).toBe(false);
});

test("tooltip tracking only runs while the tooltip is visible", async () => {
  await loadTooltip('<button data-tooltip="Help">Trigger</button>');
  const observed = new Set();
  window.ResizeObserver = class ResizeObserver {
    observe(element) {
      observed.add(element);
    }

    unobserve(element) {
      observed.delete(element);
    }

    disconnect() {
      observed.clear();
    }
  };
  const trigger = document.querySelector("button");

  hover(trigger);
  const tip = document.querySelector('[role="tooltip"]');
  expect(observed.size).toBe(0);

  await waitForShow();
  expect(observed).toEqual(new Set([trigger, tip]));

  leave(trigger);
  await waitForHide();
  expect(observed.size).toBe(0);
});

test("activated tooltip replacements release their tracking", async () => {
  await loadTooltip("<main></main>");
  const observed = new Set();
  window.ResizeObserver = class ResizeObserver {
    observe(element) {
      observed.add(element);
    }

    unobserve(element) {
      observed.delete(element);
    }

    disconnect() {
      observed.clear();
    }
  };
  const main = document.querySelector("main");

  for (let index = 0; index < 3; index++) {
    main.insertAdjacentHTML(
      "beforeend",
      `<button data-tooltip="Help ${index}" data-tooltip-click>Trigger</button>`,
    );
    const trigger = main.lastElementChild;
    click(trigger);

    expect(observed.size).toBe(2);

    trigger.remove();
    await nextMicrotask();
    expect(observed.size).toBe(0);
  }
});

test("an explicit tooltip via aria-describedby is wired, not recreated", async () => {
  await loadTooltip(`
    <button data-tooltip aria-describedby="tip1">Trigger</button>
    <div role="tooltip" id="tip1" hidden>Help</div>
  `);
  const trigger = document.querySelector("button");
  const tip = document.getElementById("tip1");

  hover(trigger);

  expect(document.querySelectorAll('[role="tooltip"]').length).toBe(1);

  await waitForShow();

  expect(visible(tip)).toBe(true);

  leave(trigger);
  await waitForHide();

  expect(visible(tip)).toBe(false);
});

test("plain aria-describedby without data-tooltip is ignored", async () => {
  await loadTooltip(`
    <button aria-describedby="help1">Trigger</button>
    <div id="help1">Form help text</div>
  `);
  const trigger = document.querySelector("button");

  hover(trigger);
  await waitForShow();

  const help = document.getElementById("help1");
  // Untouched: not a tooltip, so never hidden, never wired, and never given a
  // transport.
  expect(help.hidden).toBe(false);
  expect(help.hasAttribute("popover")).toBe(false);
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
});

test("a shared explicit tooltip survives the removal of one of its triggers", async () => {
  await loadTooltip(`
    <button id="a" data-tooltip aria-describedby="tip1">A</button>
    <button id="b" data-tooltip aria-describedby="tip1">B</button>
    <div role="tooltip" id="tip1" hidden>Shared help</div>
  `);
  const a = document.getElementById("a");
  const b = document.getElementById("b");
  const tip = document.getElementById("tip1");

  hover(a);
  await waitForShow();
  expect(visible(tip)).toBe(true);

  leave(a);
  await waitForHide();
  expect(visible(tip)).toBe(false);

  // Removing one trigger must not tear down the tooltip for the other.
  a.remove();
  await nextMicrotask();
  expect(tip.isConnected).toBe(true);

  hover(b);
  await waitForShow();
  expect(visible(tip)).toBe(true);

  // Last trigger removed: the tooltip hides but stays in the user's DOM.
  b.remove();
  await nextMicrotask();
  expect(visible(tip)).toBe(false);
  expect(tip.isConnected).toBe(true);
});

test("removing a shorthand trigger removes its generated tooltip", async () => {
  await loadTooltip('<main><button data-tooltip="Help">Trigger</button></main>');
  const trigger = document.querySelector("button");

  hover(trigger);
  await waitForShow();
  expect(document.querySelector('[role="tooltip"]')).not.toBeNull();

  trigger.remove();
  await nextMicrotask();

  expect(document.querySelector('[role="tooltip"]')).toBeNull();
});

test("moving a trigger within the document preserves its tooltip instance", async () => {
  await loadTooltip(`
    <main id="from"><button data-tooltip="Help" data-tooltip-click>Trigger</button></main>
    <aside id="to"></aside>
  `);
  const trigger = document.querySelector("button");

  click(trigger);
  const tip = document.querySelector('[role="tooltip"]');
  const describedBy = trigger.getAttribute("aria-describedby");

  document.getElementById("to").append(trigger);
  await nextMicrotask();

  expect(document.querySelector('[role="tooltip"]')).toBe(tip);
  expect(trigger.getAttribute("aria-describedby")).toBe(describedBy);
  expect(visible(tip)).toBe(true);
});

test("moving a trigger outside the observed root cleans it while it stays connected", async () => {
  await loadTooltip(`
    <main><button data-tooltip="Help" data-tooltip-click>Trigger</button></main>
    <div id="host"></div>
  `);
  const trigger = document.querySelector("button");
  const shadow = document.getElementById("host").attachShadow({ mode: "open" });

  click(trigger);
  expect(document.querySelector('[role="tooltip"]')).not.toBeNull();

  shadow.append(trigger);
  await nextMicrotask();

  expect(trigger.isConnected).toBe(true);
  expect(trigger.hasAttribute("aria-describedby")).toBe(false);
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
});

test("explicit tooltip resolution retries after the target is inserted", async () => {
  await loadTooltip('<main><button data-tooltip aria-describedby="tip1">Trigger</button></main>');
  const trigger = document.querySelector("button");

  hover(trigger);
  await waitForShow();
  expect(document.querySelector('[role="tooltip"]')).toBeNull();

  document
    .querySelector("main")
    .insertAdjacentHTML("beforeend", '<div role="tooltip" id="tip1" hidden>Help</div>');
  const tip = document.getElementById("tip1");

  hover(trigger);
  await waitForShow();

  expect(visible(tip)).toBe(true);
});

test("shorthand tooltip preserves and extends an existing describedby value", async () => {
  await loadTooltip(`
    <button data-tooltip="Help" aria-describedby="help">Trigger</button>
    <p id="help">Existing help.</p>
  `);
  const trigger = document.querySelector("button");

  hover(trigger);
  await waitForShow();

  const tip = document.querySelector('[role="tooltip"]');
  expect(trigger.getAttribute("aria-describedby")).toBe(`help ${tip.id}`);
  expect(visible(tip)).toBe(true);

  trigger.remove();
  await nextMicrotask();
  expect(trigger.getAttribute("aria-describedby")).toBe("help");
});

test("explicit tooltip resolves from multiple describedby ids", async () => {
  await loadTooltip(`
    <button data-tooltip aria-describedby="help tip1">Trigger</button>
    <p id="help">Existing help.</p>
    <div role="tooltip" id="tip1" hidden>Tooltip help.</div>
  `);
  const trigger = document.querySelector("button");
  const tip = document.getElementById("tip1");

  hover(trigger);
  await waitForShow();

  expect(visible(tip)).toBe(true);
  expect(trigger.getAttribute("aria-describedby")).toBe("help tip1");
});

test("tooltip stays visible when focus is kept after the pointer leaves", async () => {
  await loadTooltip('<button data-tooltip="Help">Trigger</button>');
  const trigger = document.querySelector("button");

  trigger.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  await waitForShow();
  expect(visible(document.querySelector('[role="tooltip"]'))).toBe(true);

  leave(trigger);
  await waitForHide();

  // Still focused: the tooltip must not hide on pointer leave alone.
  expect(visible(document.querySelector('[role="tooltip"]'))).toBe(true);
});

test("tooltip hides only when both focus and hover are gone", async () => {
  await loadTooltip('<button data-tooltip="Help">Trigger</button>');
  const trigger = document.querySelector("button");

  hover(trigger);
  await waitForShow();
  trigger.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

  leave(trigger);
  trigger.dispatchEvent(new FocusEvent("blur"));
  await waitForHide();

  expect(visible(document.querySelector('[role="tooltip"]'))).toBe(false);
});

test("tooltip stays open while the pointer moves from trigger to tip", async () => {
  await loadTooltip('<button data-tooltip="Help">Trigger</button>');
  const trigger = document.querySelector("button");

  hover(trigger);
  await waitForShow();
  const tip = document.querySelector('[role="tooltip"]');

  leave(trigger);
  tip.dispatchEvent(new MouseEvent("mouseenter"));
  await waitForHide();
  expect(visible(tip)).toBe(true);

  tip.dispatchEvent(new MouseEvent("mouseleave"));
  await waitForHide();
  expect(visible(tip)).toBe(false);
});

test("Escape key hides the tooltip", async () => {
  await loadTooltip('<button data-tooltip="Help">Trigger</button>');
  const trigger = document.querySelector("button");

  hover(trigger);
  await waitForShow();
  const tip = document.querySelector('[role="tooltip"]');
  expect(visible(tip)).toBe(true);

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(visible(tip)).toBe(false);

  hover(trigger);
  await waitForShow();
  expect(visible(tip)).toBe(true);

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(visible(tip)).toBe(false);
});

test("Escape closes a tooltip above a flyout without closing the flyout", async () => {
  await loadTooltip(`
    <button id="open" aria-controls="menu">Open</button>
    <div id="menu" class="flyout" hidden>
      <button id="help" data-tooltip="Help">Help</button>
    </div>
  `);
  const { disconnectSurface, isSurfaceOpen, openSurface } = await import("../src/js/surface.js");
  const trigger = document.getElementById("open");
  const menu = document.getElementById("menu");
  const help = document.getElementById("help");
  mockRect(trigger, { x: 20, y: 20, width: 80, height: 30 });
  mockRect(menu, { x: 0, y: 0, width: 160, height: 80 });
  mockRect(help, { x: 30, y: 60, width: 60, height: 30 });

  expect(openSurface(menu, { trigger })).toBe(true);
  hover(help);
  await waitForShow();
  const tip = document.querySelector('[role="tooltip"]');
  expect(visible(tip)).toBe(true);

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  expect(visible(tip)).toBe(false);
  expect(isSurfaceOpen(menu)).toBe(true);
  disconnectSurface(menu);
});

test("tooltip tracking does not jump above a flyout opened later", async () => {
  await loadTooltip(`
    <button id="help" data-tooltip="Help">Help</button>
    <button id="open" aria-controls="menu">Open</button>
    <div id="menu" class="flyout" hidden>Menu</div>
  `);
  const { disconnectSurface, isSurfaceOpen, openSurface } = await import("../src/js/surface.js");
  const help = document.getElementById("help");
  const trigger = document.getElementById("open");
  const menu = document.getElementById("menu");
  mockRect(help, { x: 20, y: 20, width: 60, height: 30 });
  mockRect(trigger, { x: 100, y: 20, width: 80, height: 30 });
  mockRect(menu, { x: 0, y: 0, width: 160, height: 80 });

  hover(help);
  await waitForShow();
  const tip = document.querySelector('[role="tooltip"]');
  expect(visible(tip)).toBe(true);
  expect(openSurface(menu, { trigger })).toBe(true);

  window.dispatchEvent(new Event("scroll"));
  await nextFrame();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  expect(isSurfaceOpen(menu)).toBe(false);
  expect(visible(tip)).toBe(true);
  disconnectSurface(menu);
});

test("tooltip positions relative to its trigger", async () => {
  await loadTooltip('<button data-tooltip="Help" data-tooltip-placement="right">Trigger</button>');
  const trigger = document.querySelector("button");
  mockRect(trigger, { x: 100, y: 100, width: 80, height: 30 });

  hover(trigger);
  const tip = document.querySelector('[role="tooltip"]');
  mockRect(tip, { width: 60, height: 20 });
  tip.checkVisibility = () => true;

  await waitForShow();
  expect(visible(tip)).toBe(true);
  expect(tip.dataset.placement).toBe("right");
  expect(tip.style.left).not.toBe("");
});
