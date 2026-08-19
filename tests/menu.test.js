import { afterAll, afterEach, expect, test } from "bun:test";
import { cleanupDOM, press, setupDOM } from "./helpers/dom.js";
import { connectMenu } from "../src/js/menu.js";

setupDOM();

const releases = [];

function connect(html) {
  document.body.innerHTML = html;
  const menu = document.querySelector(".menu");
  const close = () => {};
  const release = connectMenu(menu, { close });
  releases.push(release);
  return { items: [...menu.querySelectorAll(".menu-item")], menu };
}

afterEach(() => {
  while (releases.length) releases.pop()();
  document.body.innerHTML = "";
});

afterAll(() => {
  cleanupDOM();
});

test("an action list keeps normal tab stops and lightweight arrow navigation", () => {
  const { items } = connect(`
    <menu class="menu">
      <li><button class="menu-item">First</button></li>
      <li><button class="menu-item">Second</button></li>
    </menu>
  `);

  expect(items.map((item) => item.tabIndex)).toEqual([0, 0]);

  items[0].focus();
  press(items[0], "ArrowDown");

  expect(document.activeElement).toBe(items[1]);
  expect(items.map((item) => item.tabIndex)).toEqual([0, 0]);
});

test("an ARIA menu uses one roving tab stop and does not navigate twice", () => {
  const { items } = connect(`
    <menu class="menu" role="menu">
      <li><button class="menu-item" role="menuitem">First</button></li>
      <li><button class="menu-item" role="menuitem">Second</button></li>
      <li><button class="menu-item" role="menuitem">Third</button></li>
    </menu>
  `);

  expect(items.map((item) => item.tabIndex)).toEqual([0, -1, -1]);

  items[0].focus();
  press(items[0], "ArrowDown");

  expect(document.activeElement).toBe(items[1]);
  expect(items.map((item) => item.tabIndex)).toEqual([-1, 0, -1]);

  press(items[1], "ArrowUp");
  expect(document.activeElement).toBe(items[0]);
});

test("an ARIA menu group contains only usable ARIA menu items", () => {
  const { items } = connect(`
    <menu class="menu" role="menu">
      <li><button class="menu-item" role="menuitem">First</button></li>
      <li><button class="menu-item">Not an ARIA menu item</button></li>
      <li><button class="menu-item" role="menuitemcheckbox">Last</button></li>
    </menu>
  `);

  expect(items.map((item) => item.getAttribute("tabindex"))).toEqual(["0", null, "-1"]);

  items[0].focus();
  press(items[0], "ArrowDown");

  expect(document.activeElement).toBe(items[2]);
});

test("the last menu release restores authored tabindex values", () => {
  document.body.innerHTML = `
    <menu class="menu" role="menu">
      <li><button class="menu-item" role="menuitem" tabindex="3">First</button></li>
      <li><button class="menu-item" role="menuitem">Second</button></li>
    </menu>
  `;
  const menu = document.querySelector(".menu");
  const items = [...menu.querySelectorAll(".menu-item")];
  const firstRelease = connectMenu(menu, { close() {} });
  const secondRelease = connectMenu(menu, { close() {} });
  releases.push(firstRelease, secondRelease);

  expect(items.map((item) => item.tabIndex)).toEqual([-1, 0]);
  firstRelease();
  expect(items.map((item) => item.tabIndex)).toEqual([-1, 0]);

  secondRelease();
  expect(items.map((item) => item.getAttribute("tabindex"))).toEqual(["3", null]);
});
