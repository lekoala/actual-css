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

// clear() only starts the exit; content and intent survive until the closing
// transition resolves. Without animations that lands on a microtask, so a
// zero-delay timeout is enough to observe the finished state.
function afterExit() {
  return sleep(0);
}

// happy-dom runs no animations, so getAnimations() returns nothing and every
// exit resolves immediately. These stubs put a real transition in the way, so
// the deferred cleanup is actually exercised rather than assumed.
function stubTransition(target, property = "opacity") {
  let settle;
  const finished = new Promise((resolve) => {
    settle = resolve;
  });
  target.getAnimations = () => [{ transitionProperty: property, finished }];
  return settle;
}

function stubEndlessAnimation(target) {
  // What an intent class carrying `animation: pulse 1s infinite` looks like:
  // a finished promise that never settles.
  target.getAnimations = () => [{ finished: new Promise(() => {}) }];
}

// Minimal stand-in for window.visualViewport, honoring the AbortSignal the
// module removes its listeners with.
function stubVisualViewport(height, offsetTop = 0) {
  const listeners = new Set();
  const viewport = {
    height,
    offsetTop,
    addEventListener(type, handler, options) {
      const entry = { type, handler };
      listeners.add(entry);
      options?.signal?.addEventListener("abort", () => listeners.delete(entry));
    },
    removeEventListener(type, handler) {
      for (const entry of listeners) {
        if (entry.type === type && entry.handler === handler) listeners.delete(entry);
      }
    },
    emit(type) {
      for (const entry of [...listeners]) {
        if (entry.type === type) entry.handler();
      }
    },
    get listenerCount() {
      return listeners.size;
    },
  };
  window.visualViewport = viewport;
  return viewport;
}

function offsetOf(target) {
  return target.style.getPropertyValue("--status-viewport-offset");
}

afterEach(() => {
  cleanupDOM();
});

test('writes the message into the [data-status][role="status"] target', async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Saved.");

  expect(target.textContent).toBe("Saved.");
});

test("requires both data-status and role=status, ignoring an unrelated data-status elsewhere", async () => {
  const { status } = await loadStatus(`
    <div class="task-row" data-status="pending"></div>
    <div class="status-bar" role="status"></div>
    <div class="status-bar" data-status role="status"></div>
  `);

  const target = document.querySelector('[data-status][role="status"]');
  status("Copied.");

  expect(target.textContent).toBe("Copied.");
  expect(document.querySelector(".task-row").textContent).toBe("");
  expect(document.querySelector('[role="status"]:not([data-status])').textContent).toBe("");
});

test("applies the intent as a plain class, with no built-in whitelist", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Failed.", { intent: "totally-unknown-name" });

  expect(target.classList.contains("totally-unknown-name")).toBe(true);
});

test("supports more than one intent class, space-separated", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Failed.", { intent: "danger uppercase" });

  expect(target.classList.contains("danger")).toBe(true);
  expect(target.classList.contains("uppercase")).toBe(true);
});

test("omitting intent removes the previous call's intent classes", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Failed.", { intent: "danger" });
  status("Saved.");

  expect(target.classList.contains("danger")).toBe(false);
  expect(target.classList.contains("status-bar")).toBe(true);
});

test("preserves classes the target already had before the first call", async () => {
  const { status } = await loadStatus(
    `<div class="status-bar local-app-class" data-status role="status"></div>`,
  );

  const target = document.querySelector('[data-status][role="status"]');
  status("Failed.", { intent: "danger" });
  status("Saved.");

  expect(target.classList.contains("local-app-class")).toBe(true);
  expect(target.classList.contains("status-bar")).toBe(true);
  expect(target.classList.contains("danger")).toBe(false);
});

test("shows by adding the open state class after writing the message", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Saved.", { duration: false });

  expect(target.classList.contains("is-open")).toBe(true);
});

test("clear closes immediately but keeps message and intent during the exit", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Could not save.", { intent: "danger", duration: false });
  status.clear();

  expect(target.classList.contains("is-open")).toBe(false);
  expect(target.textContent).toBe("Could not save.");
  expect(target.classList.contains("danger")).toBe(true);
});

test("clear empties the target and drops the intent once the exit is over", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Could not save.", { intent: "danger", duration: false });
  status.clear();
  await afterExit();

  expect(target.textContent).toBe("");
  expect(target.classList.contains("danger")).toBe(false);
  expect(target.classList.contains("status-bar")).toBe(true);
});

test("a status during the exit wins and is not emptied by the pending cleanup", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Saved.", { intent: "success", duration: false });
  status.clear();
  status("Could not sync.", { intent: "danger", duration: false });
  await afterExit();

  expect(target.textContent).toBe("Could not sync.");
  expect(target.classList.contains("danger")).toBe(true);
  expect(target.classList.contains("success")).toBe(false);
  expect(target.classList.contains("is-open")).toBe(true);
});

test("clear cancels the auto-dismiss timer", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Saving…", { duration: 20 });
  status.clear();
  await afterExit();
  status("Saved.", { duration: false });
  await sleep(40);

  expect(target.textContent).toBe("Saved.");
  expect(target.classList.contains("is-open")).toBe(true);
});

test("holds message and intent until the closing transition actually finishes", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Could not save.", { intent: "danger", duration: false });
  const endTransition = stubTransition(target);
  status.clear();
  await afterExit();

  expect(target.textContent).toBe("Could not save.");
  expect(target.classList.contains("danger")).toBe(true);

  endTransition();
  await afterExit();

  expect(target.textContent).toBe("");
  expect(target.classList.contains("danger")).toBe(false);
});

test("a status mid-transition survives the cleanup that resolves after it", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Saved.", { intent: "success", duration: false });
  const endTransition = stubTransition(target);
  status.clear();
  status("Could not sync.", { intent: "danger", duration: false });
  endTransition();
  await afterExit();

  expect(target.textContent).toBe("Could not sync.");
  expect(target.classList.contains("danger")).toBe(true);
  expect(target.classList.contains("success")).toBe(false);
  expect(target.classList.contains("is-open")).toBe(true);
});

test("an intent class with an endless animation does not strand the cleanup", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Syncing…", { intent: "pulsing", duration: false });
  stubEndlessAnimation(target);
  status.clear();
  await afterExit();

  expect(target.textContent).toBe("");
  expect(target.classList.contains("pulsing")).toBe(false);
});

test("an empty message closes the bar instead of opening a blank pill", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Saved.", { intent: "success", duration: false });
  status("", { intent: "danger" });
  await afterExit();

  expect(target.classList.contains("is-open")).toBe(false);
  expect(target.textContent).toBe("");
  expect(target.classList.contains("success")).toBe(false);
  expect(target.classList.contains("danger")).toBe(false);
});

test("lifts the bar above the band the software keyboard occludes", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  window.innerHeight = 800;
  const viewport = stubVisualViewport(800);

  status("Saving…", { duration: false });
  expect(offsetOf(target)).toBe("0px");

  viewport.height = 500;
  viewport.emit("resize");
  expect(offsetOf(target)).toBe("300px");

  status.clear();
  await afterExit();

  expect(offsetOf(target)).toBe("");
  expect(viewport.listenerCount).toBe(0);
});

test("releases the viewport tracker when the bar is removed while a message shows", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  const viewport = stubVisualViewport(500);

  status("Saving…", { duration: false });
  expect(viewport.listenerCount).toBeGreaterThan(0);

  target.remove();
  status.clear();

  expect(viewport.listenerCount).toBe(0);
});

test("classes added after first show are preserved on subsequent status calls", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Saving…", { intent: "danger", duration: false });
  target.classList.add("sticky-app-class");
  status("Saved.", { intent: "success", duration: false });

  expect(target.classList.contains("sticky-app-class")).toBe(true);
  expect(target.classList.contains("danger")).toBe(false);
  expect(target.classList.contains("success")).toBe(true);
});

test("auto-dismisses after the duration", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Reconnected.", { duration: 30 });

  expect(target.textContent).toBe("Reconnected.");
  await sleep(60);
  expect(target.classList.contains("is-open")).toBe(false);
  expect(target.textContent).toBe("");
});

test("is a no-op when no status target exists", async () => {
  const { status } = await loadStatus(`<main></main>`);

  expect(() => status("Orphan")).not.toThrow();
});

test("auto-shows validation errors as danger", async () => {
  await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  document.dispatchEvent(
    new CustomEvent("actual:invalid", {
      bubbles: true,
      detail: { message: "Please check the highlighted fields." },
    }),
  );

  expect(target.textContent).toBe("Please check the highlighted fields.");
  expect(target.classList.contains("danger")).toBe(true);
});

test("ignores actual:invalid events without a message", async () => {
  await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  document.dispatchEvent(
    new CustomEvent("actual:invalid", {
      bubbles: true,
      detail: { message: "" },
    }),
  );

  expect(target.textContent).toBe("");
});

test("ignores actual:invalid events without detail", async () => {
  await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');

  expect(() => {
    document.dispatchEvent(new CustomEvent("actual:invalid", { bubbles: true }));
  }).not.toThrow();
  expect(target.textContent).toBe("");
});

test("actual:status event shows a message", async () => {
  await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  document.dispatchEvent(
    new CustomEvent("actual:status", {
      bubbles: true,
      detail: { message: "Saved.", intent: "success" },
    }),
  );

  expect(target.textContent).toBe("Saved.");
  expect(target.classList.contains("success")).toBe(true);
});

test("actual:status event without a message clears the bar", async () => {
  const { status } = await loadStatus(`<div class="status-bar" data-status role="status"></div>`);

  const target = document.querySelector('[data-status][role="status"]');
  status("Saving…", { duration: false });
  document.dispatchEvent(new CustomEvent("actual:status", { bubbles: true, detail: {} }));
  await afterExit();

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
  await afterExit();

  expect(target.textContent).toBe("");
  expect(target.classList.contains("is-open")).toBe(false);
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
    .insertAdjacentHTML(
      "beforeend",
      '<div class="status-bar" data-status id="app-status" role="status"></div>',
    );
  const target = document.getElementById("app-status");
  const trigger = document.querySelector("button");

  click(trigger);

  expect(target.textContent).toBe("Saved.");
});
