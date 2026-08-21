import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadPassword(html) {
  setupDOM(html);
  return import(`../src/js/password.js?test=${++importId}`);
}

afterEach(() => {
  cleanupDOM();
});

test("command=--password-toggle reveals and hides the input", async () => {
  await loadPassword(`
    <input type="password" id="pw" value="hunter2">
    <button commandfor="pw" command="--password-toggle" aria-controls="pw"
            aria-label="Show password" aria-pressed="false"></button>
  `);
  const input = document.getElementById("pw");
  const trigger = document.querySelector("button");

  expect(trigger.getAttribute("aria-pressed")).toBe("false");
  expect(trigger.getAttribute("aria-controls")).toBe("pw");

  click(trigger);
  expect(input.type).toBe("text");
  expect(trigger.getAttribute("aria-pressed")).toBe("true");

  click(trigger);
  expect(input.type).toBe("password");
  expect(trigger.getAttribute("aria-pressed")).toBe("false");
});

test("ignores a commandfor pointing at a non-password target", async () => {
  await loadPassword(`
    <input type="text" id="name">
    <button commandfor="name" command="--password-toggle"></button>
  `);
  const input = document.getElementById("name");
  const trigger = document.querySelector("button");

  click(trigger);

  expect(input.type).toBe("text");
  expect(trigger.hasAttribute("aria-pressed")).toBe(false);
});

test("keeps every linked trigger in sync", async () => {
  await loadPassword(`
    <input type="password" id="pw">
    <button id="a" commandfor="pw" command="--password-toggle"></button>
    <button id="b" commandfor="pw" command="--password-toggle"></button>
  `);
  const input = document.getElementById("pw");

  click(document.getElementById("a"));

  expect(input.type).toBe("text");
  expect(document.getElementById("a").getAttribute("aria-pressed")).toBe("true");
  expect(document.getElementById("b").getAttribute("aria-pressed")).toBe("true");
});

test("keeps linked triggers in a shadow root in sync", async () => {
  await loadPassword('<div id="host"></div>');
  const shadow = document.getElementById("host").attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <input type="password" id="pw">
    <button id="a" commandfor="pw" command="--password-toggle" aria-pressed="false"></button>
    <button id="b" commandfor="pw" command="--password-toggle" aria-pressed="false"></button>
  `;
  const input = shadow.getElementById("pw");

  shadow
    .getElementById("a")
    .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }));

  expect(input.type).toBe("text");
  expect(shadow.getElementById("a").getAttribute("aria-pressed")).toBe("true");
  expect(shadow.getElementById("b").getAttribute("aria-pressed")).toBe("true");
});

test("form submit reverts a revealed input in a shadow root", async () => {
  await loadPassword('<div id="host"></div>');
  const shadow = document.getElementById("host").attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <form>
      <input type="password" id="pw">
      <button type="button" commandfor="pw" command="--password-toggle"></button>
    </form>
  `;
  const input = shadow.getElementById("pw");
  shadow
    .querySelector("button")
    .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }));

  shadow
    .querySelector("form")
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  expect(input.type).toBe("password");
});

test("form submit reverts a revealed input to hidden", async () => {
  await loadPassword(`
    <form>
      <input type="password" id="pw" value="hunter2">
      <button type="button" commandfor="pw" command="--password-toggle"></button>
    </form>
  `);
  const input = document.getElementById("pw");
  const trigger = document.querySelector("button");

  click(trigger);
  expect(input.type).toBe("text");

  document
    .querySelector("form")
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  expect(input.type).toBe("password");
  expect(trigger.getAttribute("aria-pressed")).toBe("false");
});

test("a canceled submit keeps the value revealed", async () => {
  await loadPassword(`
    <form>
      <input type="password" id="pw">
      <button type="button" commandfor="pw" command="--password-toggle"></button>
    </form>
  `);
  const input = document.getElementById("pw");
  const form = document.querySelector("form");
  form.addEventListener("submit", (event) => event.preventDefault());

  click(document.querySelector("button"));
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  expect(input.type).toBe("text");
});

test("pagehide reverts every revealed input", async () => {
  await loadPassword(`
    <input type="password" id="pw">
    <button commandfor="pw" command="--password-toggle"></button>
  `);
  const input = document.getElementById("pw");

  click(document.querySelector("button"));
  expect(input.type).toBe("text");

  window.dispatchEvent(new Event("pagehide"));

  expect(input.type).toBe("password");
});

test("pagehide reverts a revealed input in a closed shadow root", async () => {
  await loadPassword('<div id="host"></div>');
  const shadow = document.getElementById("host").attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <input type="password" id="pw">
    <button commandfor="pw" command="--password-toggle"></button>
  `;
  const input = shadow.getElementById("pw");
  shadow
    .querySelector("button")
    .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }));

  window.dispatchEvent(new Event("pagehide"));

  expect(input.type).toBe("password");
});

test("a trigger handles an input inserted immediately before the click", async () => {
  await loadPassword(`
    <main>
      <button commandfor="pw" command="--password-toggle"></button>
    </main>
  `);

  document.querySelector("main").insertAdjacentHTML("beforeend", '<input type="password" id="pw">');
  const input = document.getElementById("pw");
  const trigger = document.querySelector("button");

  click(trigger);

  expect(input.type).toBe("text");
  expect(trigger.getAttribute("aria-pressed")).toBe("true");
});
