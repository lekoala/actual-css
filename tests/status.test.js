import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, setupDOM } from "./helpers/dom.js";

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

test("writes the message into the [data-status] target", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector("[data-status]");
  status("Saved.");

  expect(target.textContent).toBe("Saved.");
});

test("falls back to .status-bar when no [data-status] is present", async () => {
  const { status } = await loadStatus(`<div class="status-bar" role="status"></div>`);

  const target = document.querySelector(".status-bar");
  status("Copied.");

  expect(target.textContent).toBe("Copied.");
});

test("applies the intent class", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector("[data-status]");
  status("Failed.", { intent: "danger" });

  expect(target.classList.contains("danger")).toBe(true);
});

test("clear empties the target and cancels the timer", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector("[data-status]");
  status("Saving…", { duration: false });
  status.clear();

  expect(target.textContent).toBe("");
});

test("auto-dismisses after the duration", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector("[data-status]");
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

  const target = document.querySelector("[data-status]");
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

  const target = document.querySelector("[data-status]");
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

  const target = document.querySelector("[data-status]");

  expect(() => {
    document.dispatchEvent(new CustomEvent("actual:invalid", { bubbles: true }));
  }).not.toThrow();
  expect(target.textContent).toBe("");
});
