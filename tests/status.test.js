import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, nextMicrotask, setupDOM } from "./helpers/dom.js";

let importId = 0;

async function loadStatus(html) {
  setupDOM(html);
  return import(`../src/js/status.js?test=${++importId}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

afterEach(() => {
  cleanupDOM();
});

test("writes the message into the .status-bar[data-status] target", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  status("Saved.");

  expect(target.textContent).toBe("Saved.");
});

test("requires both the component class and data-status", async () => {
  const { status } = await loadStatus(`
    <div data-status></div>
    <div class="status-bar" role="status"></div>
    <div class="status-bar" data-status role="status"></div>
  `);

  const target = document.querySelector(".status-bar[data-status]");
  status("Copied.");

  expect(target.textContent).toBe("Copied.");
  expect(document.querySelector("[data-status]").textContent).toBe("");
  expect(document.querySelector(".status-bar:not([data-status])").textContent).toBe("");
});

test("applies the intent class", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  status("Failed.", { intent: "danger" });

  expect(target.classList.contains("danger")).toBe(true);
});

test("clear empties the target and cancels the timer", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  status("Saving…", { duration: false });
  status.clear();

  expect(target.textContent).toBe("");
});

test("auto-dismisses after the duration", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  status("Reconnected.", { duration: 30 });

  expect(target.textContent).toBe("Reconnected.");
  await sleep(60);
  expect(target.textContent).toBe("");
});

test("is a no-op when no status target exists", async () => {
  const { status } = await loadStatus(`<main></main>`);

  expect(() => status("Orphan")).not.toThrow();
});

test("auto-shows validation errors as danger", async () => {
  await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  document.dispatchEvent(
    new CustomEvent("actual:invalid", {
      bubbles: true,
      detail: { message: "Please check the highlighted fields." },
    })
  );

  expect(target.textContent).toBe("Please check the highlighted fields.");
  expect(target.classList.contains("danger")).toBe(true);
});

test("ignores actual:invalid events without a message", async () => {
  await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  document.dispatchEvent(
    new CustomEvent("actual:invalid", {
      bubbles: true,
      detail: { message: "" },
    })
  );

  expect(target.textContent).toBe("");
});

test("ignores actual:invalid events without detail", async () => {
  await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");

  expect(() => {
    document.dispatchEvent(new CustomEvent("actual:invalid", { bubbles: true }));
  }).not.toThrow();
  expect(target.textContent).toBe("");
});

test("actual:status event shows a message", async () => {
  await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  document.dispatchEvent(
    new CustomEvent("actual:status", {
      bubbles: true,
      detail: { message: "Saved.", intent: "success" },
    })
  );

  expect(target.textContent).toBe("Saved.");
  expect(target.classList.contains("success")).toBe(true);
});

test("actual:status event without a message clears the bar", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  status("Saving…", { duration: false });
  document.dispatchEvent(new CustomEvent("actual:status", { bubbles: true, detail: {} }));

  expect(target.textContent).toBe("");
});

test("command=--status trigger dispatches actual:status from its data attributes", async () => {
  await loadStatus(`
    <div class="status-bar" data-status id="app-status" role="status"></div>
    <button commandfor="app-status" command="--status"
            data-status-message="Saved." data-status-intent="success">Show</button>
  `);
  const target = document.getElementById("app-status");
  const trigger = document.querySelector("button");

  click(trigger);

  expect(target.textContent).toBe("Saved.");
  expect(target.classList.contains("success")).toBe(true);
  expect(trigger.getAttribute("aria-controls")).toBe("app-status");
});

test("command=--status-clear trigger clears the bar", async () => {
  const { status } = await loadStatus(`
    <div class="status-bar" data-status id="app-status" role="status"></div>
    <button commandfor="app-status" command="--status-clear">Clear</button>
  `);
  const target = document.getElementById("app-status");
  const trigger = document.querySelector("button");

  status("Saving…", { duration: false });
  click(trigger);

  expect(target.textContent).toBe("");
});

test("command=--status trigger ignores a commandfor pointing elsewhere", async () => {
  await loadStatus(`
    <div class="status-bar" data-status id="app-status" role="status"></div>
    <div id="not-status"></div>
    <button commandfor="not-status" command="--status"
            data-status-message="Saved.">Show</button>
  `);
  const target = document.getElementById("app-status");
  const trigger = document.querySelector("button");

  click(trigger);

  expect(target.textContent).toBe("");
});

test("command trigger connects when the status bar is inserted later", async () => {
  await loadStatus(`
    <main>
      <button commandfor="app-status" command="--status" data-status-message="Saved.">Show</button>
    </main>
  `);

  document
    .querySelector("main")
    .insertAdjacentHTML("beforeend", '<div class="status-bar" data-status id="app-status" role="status"></div>');
  await nextMicrotask();
  const target = document.getElementById("app-status");
  const trigger = document.querySelector("button");

  click(trigger);

  expect(target.textContent).toBe("Saved.");
});
