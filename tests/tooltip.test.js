import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, mockRect, nextMicrotask, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadTooltip(html) {
  setupDOM(html);
  await import(`../src/js/tooltip.js?test=${++importId}`);
}

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
  expect(tip.hidden).toBe(true);

  await waitForShow();

  expect(tip.hidden).toBe(false);
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
  expect(tip.hidden).toBe(false);

  leave(trigger);
  await waitForHide();
  expect(tip.hidden).toBe(false);

  click(trigger);
  expect(tip.hidden).toBe(true);
});

test("data-tooltip-visible eagerly creates and keeps a tooltip visible", async () => {
  await loadTooltip('<button data-tooltip="Persistent help" data-tooltip-visible>Trigger</button>');
  const trigger = document.querySelector("button");
  const tip = document.querySelector('[role="tooltip"]');

  expect(tip).not.toBeNull();
  expect(tip.hidden).toBe(false);

  leave(trigger);
  await waitForHide();
  expect(tip.hidden).toBe(false);

  tip.dispatchEvent(new CustomEvent("actual:hide", { detail: { type: "escape" } }));
  expect(tip.hidden).toBe(false);
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

  expect(tip.hidden).toBe(false);

  leave(trigger);
  await waitForHide();

  expect(tip.hidden).toBe(true);
});

test("plain aria-describedby without data-tooltip is ignored", async () => {
  await loadTooltip(`
    <button aria-describedby="help1">Trigger</button>
    <div id="help1">Form help text</div>
  `);
  const trigger = document.querySelector("button");

  hover(trigger);
  await waitForShow();

  expect(document.getElementById("help1").hidden).toBe(false);
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
  expect(tip.hidden).toBe(false);

  leave(a);
  await waitForHide();
  expect(tip.hidden).toBe(true);

  // Removing one trigger must not tear down the tooltip for the other.
  a.remove();
  await nextMicrotask();
  expect(tip.isConnected).toBe(true);

  hover(b);
  await waitForShow();
  expect(tip.hidden).toBe(false);

  // Last trigger removed: the tooltip hides but stays in the user's DOM.
  b.remove();
  await nextMicrotask();
  expect(tip.hidden).toBe(true);
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

  expect(tip.hidden).toBe(false);
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
  expect(tip.hidden).toBe(false);

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

  expect(tip.hidden).toBe(false);
  expect(trigger.getAttribute("aria-describedby")).toBe("help tip1");
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
  expect(tip.hidden).toBe(false);

  tip.dispatchEvent(new MouseEvent("mouseleave"));
  await waitForHide();
  expect(tip.hidden).toBe(true);
});

test("Escape key hides the tooltip", async () => {
  await loadTooltip('<button data-tooltip="Help">Trigger</button>');
  const trigger = document.querySelector("button");

  hover(trigger);
  await waitForShow();
  const tip = document.querySelector('[role="tooltip"]');
  expect(tip.hidden).toBe(false);

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(tip.hidden).toBe(true);

  hover(trigger);
  await waitForShow();
  expect(tip.hidden).toBe(false);

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(tip.hidden).toBe(true);
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
  expect(tip.hidden).toBe(false);
  expect(tip.dataset.placement).toBe("right");
  expect(tip.style.left).not.toBe("");
});
