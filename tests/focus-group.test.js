import { afterAll, afterEach, expect, test } from "bun:test";
import { cleanupDOM, press, setupDOM } from "./helpers/dom.js";
import { connectFocusGroup } from "../src/js/focus-group.js";

setupDOM();

const focusGroups = [];

function setGroup(html, opts = {}) {
  document.body.innerHTML = `<div id="group">${html}</div>`;
  const root = document.getElementById("group");
  const getItems = opts.getItems
    ? () => opts.getItems(root)
    : () => root.querySelectorAll("button");
  const focusGroup = connectFocusGroup(root, { ...opts, getItems });
  focusGroups.push(focusGroup);
  return { focusGroup, items: [...root.querySelectorAll("button")], root };
}

afterEach(() => {
  while (focusGroups.length) focusGroups.pop().disconnect();
  document.body.innerHTML = "";
});

afterAll(() => {
  cleanupDOM();
});

test("initialization keeps exactly one current item in the tab sequence", () => {
  const { items } = setGroup(`
    <button tabindex="-1">First</button>
    <button tabindex="0">Second</button>
    <button>Third</button>
  `);

  expect(items.map((item) => item.tabIndex)).toEqual([-1, 0, -1]);
});

test("initialization falls back to the first item", () => {
  const { items } = setGroup(`
    <button tabindex="-1">First</button>
    <button tabindex="-1">Second</button>
  `);

  expect(items.map((item) => item.tabIndex)).toEqual([0, -1]);
});

test("focusin remembers the tab stop without changing application state", () => {
  const { items } = setGroup(`
    <button aria-pressed="false">First</button>
    <button aria-pressed="true">Second</button>
  `);

  items[1].focus();

  expect(items.map((item) => item.tabIndex)).toEqual([-1, 0]);
  expect(items.map((item) => item.getAttribute("aria-pressed"))).toEqual(["false", "true"]);
});

test("horizontal arrows and edges move focus without wrapping by default", () => {
  const { items } = setGroup("<button>First</button><button>Second</button><button>Third</button>");
  items[0].focus();

  const next = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" });
  items[0].dispatchEvent(next);
  expect(next.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(items[1]);

  press(items[1], "End");
  expect(document.activeElement).toBe(items[2]);

  const edge = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" });
  items[2].dispatchEvent(edge);
  expect(edge.defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(items[2]);

  press(items[2], "Home");
  expect(document.activeElement).toBe(items[0]);
});

test("wrapping and vertical orientation are explicit", () => {
  const { items } = setGroup("<button>First</button><button>Second</button>", {
    orientation: "vertical",
    wrap: true,
  });
  items[0].focus();

  const horizontal = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "ArrowRight",
  });
  items[0].dispatchEvent(horizontal);
  expect(horizontal.defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(items[0]);

  press(items[0], "ArrowUp");
  expect(document.activeElement).toBe(items[1]);
  press(items[1], "ArrowDown");
  expect(document.activeElement).toBe(items[0]);
});

test("horizontal navigation uses the effective RTL direction", () => {
  const { items, root } = setGroup("<button>First</button><button>Second</button>", {
    wrap: true,
  });
  const getComputedStyle = window.getComputedStyle.bind(window);
  window.getComputedStyle = (element) =>
    element === root ? { direction: "rtl" } : getComputedStyle(element);

  items[0].focus();
  press(items[0], "ArrowRight");

  expect(document.activeElement).toBe(items[1]);
  window.getComputedStyle = getComputedStyle;
});

test("sync normalizes candidate changes while preserving the remembered item", () => {
  const { focusGroup, items, root } = setGroup("<button>First</button><button>Second</button>", {
    getItems: (group) => group.querySelectorAll("button:not(:disabled)"),
  });
  const added = document.createElement("button");
  added.textContent = "Third";
  root.append(added);
  focusGroup.sync();

  expect([items[0].tabIndex, items[1].tabIndex, added.tabIndex]).toEqual([0, -1, -1]);

  items[0].disabled = true;
  focusGroup.sync();

  expect(items[1].tabIndex).toBe(0);
  expect(added.tabIndex).toBe(-1);
});

test("sync preserves the remembered item unless a preferred item is supplied", () => {
  const { focusGroup, items } = setGroup("<button>First</button><button>Second</button>");

  items[1].tabIndex = 0;
  focusGroup.sync();
  expect(items.map((item) => item.tabIndex)).toEqual([0, -1]);

  focusGroup.sync(items[1]);
  expect(items.map((item) => item.tabIndex)).toEqual([-1, 0]);
});

test("disconnect and AbortSignal restore authored tabindex values", () => {
  document.body.innerHTML = `
    <div id="group">
      <button tabindex="3">First</button>
      <button tabindex="-1">Second</button>
    </div>
  `;
  const root = document.getElementById("group");
  const items = [...root.querySelectorAll("button")];
  const controller = new AbortController();
  const focusGroup = connectFocusGroup(root, {
    getItems: () => items,
    signal: controller.signal,
  });

  expect(items.map((item) => item.tabIndex)).toEqual([0, -1]);
  controller.abort();
  focusGroup.disconnect();

  expect(items.map((item) => item.getAttribute("tabindex"))).toEqual(["3", "-1"]);
});

test("unrelated keys are left to the consumer", () => {
  document.body.innerHTML = `
    <div id="group">
      <button id="first"><span>First</span></button>
      <button id="second">Second</button>
    </div>
  `;
  const root = document.getElementById("group");
  const first = document.getElementById("first");
  const second = document.getElementById("second");
  focusGroups.push(connectFocusGroup(root, { getItems: () => [first, second] }));
  first.focus();

  const enter = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" });
  first.dispatchEvent(enter);
  expect(enter.defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(first);

});

test("invalid contracts fail fast", () => {
  document.body.innerHTML = '<div id="group"></div>';
  const root = document.getElementById("group");

  expect(() => connectFocusGroup(null, { getItems: () => [] })).toThrow(TypeError);
  expect(() => connectFocusGroup(root)).toThrow(TypeError);
  expect(() =>
    connectFocusGroup(root, { getItems: () => [], orientation: "diagonal" }),
  ).toThrow(TypeError);
});
