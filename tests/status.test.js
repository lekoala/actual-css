import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, setupDOM } from "./helpers/dom.js";

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

test("requires both the class and data-status, ignoring an unrelated data-status elsewhere", async () => {
  const { status } = await loadStatus(`
    <div class="task-row" data-status="pending"></div>
    <div class="status-bar" role="status"></div>
    <div class="status-bar" data-status role="status"></div>
  `);

  const target = document.querySelector(".status-bar[data-status]");
  status("Copied.");

  expect(target.textContent).toBe("Copied.");
  expect(document.querySelector(".task-row").textContent).toBe("");
  expect(document.querySelector(".status-bar:not([data-status])").textContent).toBe("");
});

test("applies the intent as a plain class, with no built-in whitelist", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  status("Failed.", { intent: "totally-unknown-name" });

  expect(target.classList.contains("totally-unknown-name")).toBe(true);
});

test("supports more than one intent class, space-separated", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  status("Failed.", { intent: "danger uppercase" });

  expect(target.classList.contains("danger")).toBe(true);
  expect(target.classList.contains("uppercase")).toBe(true);
});

test("omitting intent removes the previous call's intent classes", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  status("Failed.", { intent: "danger" });
  status("Saved.");

  expect(target.classList.contains("danger")).toBe(false);
  expect(target.classList.contains("status-bar")).toBe(true);
});

test("preserves classes the target already had before the first call", async () => {
  const { status } = await loadStatus(
    `<div class="status-bar local-app-class" data-status role="status"></div>`,
  );

  const target = document.querySelector(".status-bar[data-status]");
  status("Failed.", { intent: "danger" });
  status("Saved.");

  expect(target.classList.contains("local-app-class")).toBe(true);
  expect(target.classList.contains("status-bar")).toBe(true);
  expect(target.classList.contains("danger")).toBe(false);
});

test("clear empties the target and cancels the timer", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  status("Saving…", { duration: false });
  status.clear();

  expect(target.textContent).toBe("");
  expect(target.classList.contains("danger")).toBe(false);
});

test("classes added after first show are preserved on subsequent status calls", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector(".status-bar[data-status]");
  status("Saving…", { intent: "danger", duration: false });
  target.classList.add("sticky-app-class");
  status("Saved.", { intent: "success", duration: false });

  expect(target.classList.contains("sticky-app-class")).toBe(true);
  expect(target.classList.contains("danger")).toBe(false);
  expect(target.classList.contains("success")).toBe(true);
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

test("a command sees a status bar inserted immediately before the click", async () => {
  await loadStatus(`
    <main>
      <button commandfor="app-status" command="--status" data-status-message="Saved.">Show</button>
    </main>
  `);

  document
    .querySelector("main")
    .insertAdjacentHTML("beforeend", '<div class="status-bar" data-status id="app-status" role="status"></div>');
  const target = document.getElementById("app-status");
  const trigger = document.querySelector("button");

  click(trigger);

  expect(target.textContent).toBe("Saved.");
});
