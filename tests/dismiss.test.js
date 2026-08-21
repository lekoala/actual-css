import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadDismiss(html) {
  setupDOM(html);
  return import(`../src/js/dismiss.js?test=${++importId}`);
}

afterEach(() => {
  cleanupDOM();
});

test("resolves the current target dynamically and hides it", async () => {
  await loadDismiss(`
    <main>
      <button commandfor="notice" command="--dismiss">Dismiss</button>
    </main>
  `);
  const main = document.querySelector("main");
  main.insertAdjacentHTML("afterbegin", '<div id="notice">Saved.</div>');
  const target = document.getElementById("notice");
  const trigger = document.querySelector("button");

  click(trigger);

  expect(target.hidden).toBe(true);
});

test("emits a bubbling actual:dismiss event with its trigger", async () => {
  await loadDismiss(
    '<div id="notice"></div><button commandfor="notice" command="--dismiss"></button>',
  );
  const target = document.getElementById("notice");
  const trigger = document.querySelector("button");
  let received = null;
  document.addEventListener("actual:dismiss", (event) => {
    received = event;
  });

  click(trigger);

  expect(received?.bubbles).toBe(true);
  expect(received?.target).toBe(target);
  expect(received?.detail.trigger).toBe(trigger);
});

test("does nothing when commandfor has no target", async () => {
  await loadDismiss('<button commandfor="missing" command="--dismiss"></button>');
  const trigger = document.querySelector("button");

  expect(() => click(trigger)).not.toThrow();
});

test("imports safely without a DOM", async () => {
  cleanupDOM();

  await import(`../src/js/dismiss.js?ssr=${++importId}`);

  expect(globalThis.document).toBeUndefined();
});
