import { afterEach, expect, test } from "bun:test";
import {
  cleanupDOM,
  click,
  nextMicrotask,
  mockRect,
  patchDialogMethods,
  setupDOM,
} from "./helpers/dom.js";

let importId = 0;

async function loadDialog(html) {
  setupDOM(html);
  patchDialogMethods();
  await import(`../src/js/dialog.js?test=${++importId}`);
}

afterEach(() => {
  cleanupDOM();
});

test("trigger with commandfor opens the target dialog", async () => {
  await loadDialog('<button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs"></dialog>');
  const trigger = document.querySelector("button");
  const dialog = document.getElementById("prefs");

  click(trigger);

  expect(dialog.open).toBe(true);
  expect(dialog.hasAttribute("open")).toBe(true);
  expect(trigger.getAttribute("aria-controls")).toBe("prefs");
});

test("opening a modal dialog sets trigger-owned accessibility attributes", async () => {
  await loadDialog('<button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs"></dialog>');
  const trigger = document.querySelector("button");
  const dialog = document.getElementById("prefs");

  click(trigger);

  expect(dialog.open).toBe(true);
  expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
  expect(trigger.getAttribute("aria-controls")).toBe("prefs");
});

test("opening a modal dialog sets dialog accessibility attributes", async () => {
  await loadDialog(`
    <button commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs"><h2>Preferences</h2></dialog>
  `);
  const trigger = document.querySelector("button");
  const dialog = document.getElementById("prefs");
  const title = dialog.querySelector("h2");

  click(trigger);

  expect(dialog.getAttribute("aria-modal")).toBe("true");
  expect(dialog.getAttribute("aria-labelledby")).toBe(title.id);
});

test("dialog data-title provides an accessible label", async () => {
  await loadDialog(`
    <button commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs" data-title="Preferences"></dialog>
  `);
  const trigger = document.querySelector("button");
  const dialog = document.getElementById("prefs");

  click(trigger);

  expect(dialog.getAttribute("aria-label")).toBe("Preferences");
});

test("request-close buttons close an open dialog and restore focus", async () => {
  await loadDialog(`
    <button id="open" commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs">
      <button id="close" commandfor="prefs" command="request-close" value="done">Close</button>
    </dialog>
  `);
  const open = document.getElementById("open");
  const close = document.getElementById("close");
  const dialog = document.getElementById("prefs");

  click(open);
  click(close);

  expect(dialog.open).toBe(false);
  expect(dialog.returnValue).toBe("done");
  expect(document.activeElement).toBe(open);
});

test("close buttons do not get dialog popup semantics", async () => {
  await loadDialog(`
    <button id="open" commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs">
      <button id="close" commandfor="prefs" command="request-close">Close</button>
    </dialog>
  `);

  click(document.getElementById("open"));

  expect(document.getElementById("open").getAttribute("aria-haspopup")).toBe("dialog");
  expect(document.getElementById("close").getAttribute("aria-haspopup")).toBeNull();
});

test("cancel closes without requiring view transitions", async () => {
  await loadDialog(`
    <button id="open" commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs" data-dialog-dismissible></dialog>
  `);
  const open = document.getElementById("open");
  const dialog = document.getElementById("prefs");

  click(open);
  const event = new Event("cancel", { cancelable: true });
  dialog.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
  expect(dialog.open).toBe(false);
  expect(document.activeElement).toBe(open);
});

test("modal dialogs toggle the html scroll-lock hook", async () => {
  await loadDialog(`
    <button id="open" commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs">
      <button id="close" commandfor="prefs" command="request-close">Close</button>
    </dialog>
  `);
  const open = document.getElementById("open");
  const close = document.getElementById("close");

  click(open);

  expect(document.documentElement.classList.contains("has-modal-open")).toBe(true);

  click(close);

  expect(document.documentElement.classList.contains("has-modal-open")).toBe(false);
  expect(document.documentElement.classList.contains("had-scrollbar")).toBe(false);
});

test("modal lock marks had-scrollbar only when classic scrollbar existed", async () => {
  await loadDialog(`
    <button id="open" commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs">
      <button id="close" commandfor="prefs" command="request-close">Close</button>
    </dialog>
  `);
  const root = document.documentElement;
  const open = document.getElementById("open");
  const close = document.getElementById("close");

  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1000 });
  Object.defineProperty(root, "clientWidth", { configurable: true, value: 980 });

  click(open);
  expect(root.classList.contains("had-scrollbar")).toBe(true);

  click(close);
  expect(root.classList.contains("had-scrollbar")).toBe(false);

  Object.defineProperty(root, "clientWidth", { configurable: true, value: 1000 });
  click(open);
  expect(root.classList.contains("had-scrollbar")).toBe(false);
});

test("non-modal dialogs do not toggle the html scroll-lock hook", async () => {
  await loadDialog(
    '<button commandfor="prefs" command="show">Open</button><dialog id="prefs"></dialog>',
  );

  click(document.querySelector("button"));

  expect(document.getElementById("prefs").open).toBe(true);
  expect(document.documentElement.classList.contains("has-modal-open")).toBe(false);
});

test("command=show opens non-modal even when data-dialog-modal is true", async () => {
  setupDOM('<button commandfor="prefs" command="show">Open</button><dialog id="prefs" data-dialog-modal="true"></dialog>');
  patchDialogMethods();
  let showCalls = 0;
  let showModalCalls = 0;
  HTMLDialogElement.prototype.show = function show() {
    showCalls += 1;
    this.open = true;
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.showModal = function showModal() {
    showModalCalls += 1;
    this.open = true;
    this.setAttribute("open", "");
  };
  await import(`../src/js/dialog.js?test=${++importId}`);

  click(document.querySelector("button"));

  expect(showCalls).toBe(1);
  expect(showModalCalls).toBe(0);
  expect(document.getElementById("prefs").open).toBe(true);
});

test("command=show-modal opens modal even when data-dialog-modal is false", async () => {
  setupDOM('<button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs" data-dialog-modal="false"></dialog>');
  patchDialogMethods();
  let showCalls = 0;
  let showModalCalls = 0;
  HTMLDialogElement.prototype.show = function show() {
    showCalls += 1;
    this.open = true;
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.showModal = function showModal() {
    showModalCalls += 1;
    this.open = true;
    this.setAttribute("open", "");
  };
  await import(`../src/js/dialog.js?test=${++importId}`);

  click(document.querySelector("button"));

  expect(showCalls).toBe(0);
  expect(showModalCalls).toBe(1);
  expect(document.getElementById("prefs").open).toBe(true);
});

test("a trigger handles a dialog inserted immediately before the click", async () => {
  setupDOM('<main><button commandfor="prefs" command="show-modal">Open</button></main>');
  patchDialogMethods();
  await import(`../src/js/dialog.js?test=${++importId}`);

  document.querySelector("main").insertAdjacentHTML("beforeend", '<dialog id="prefs"></dialog>');
  const trigger = document.querySelector("button");
  const dialog = document.getElementById("prefs");

  click(trigger);

  expect(dialog.open).toBe(true);
  expect(trigger.getAttribute("aria-controls")).toBe("prefs");
});

test("dialog trigger re-resolves a same-id replacement", async () => {
  await loadDialog('<main><button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs"></dialog></main>');
  const trigger = document.querySelector("button");
  const first = document.getElementById("prefs");

  first.replaceWith(document.createRange().createContextualFragment('<dialog id="prefs"></dialog>'));
  await nextMicrotask();
  const replacement = document.getElementById("prefs");

  click(trigger);

  expect(first.open).toBe(false);
  expect(replacement.open).toBe(true);
});

test("dialog ignores application commands on dialog targets", async () => {
  await loadDialog('<button commandfor="prefs" command="--app-command">Run</button><dialog id="prefs"></dialog>');
  const trigger = document.querySelector("button");
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });

  trigger.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(false);
});

test("a dialog with a bare open attribute is not treated as an open modal", async () => {
  await loadDialog('<dialog id="prefs" open class="modal">Already open</dialog>');
  const dialog = document.getElementById("prefs");

  expect(dialog.open).toBe(true);
  expect(document.documentElement.classList.contains("has-modal-open")).toBe(false);
});

test("a dialog trigger inserted immediately before the click works", async () => {
  setupDOM('<main><dialog id="prefs"></dialog></main>');
  patchDialogMethods();
  await import(`../src/js/dialog.js?test=${++importId}`);

  document
    .querySelector("main")
    .insertAdjacentHTML("beforeend", '<button commandfor="prefs" command="show-modal">Open</button>');
  const trigger = document.querySelector("button");
  const dialog = document.getElementById("prefs");

  click(trigger);

  expect(dialog.open).toBe(true);
  expect(trigger.getAttribute("aria-controls")).toBe("prefs");
});

test("dismissible backdrop clicks close the dialog", async () => {
  await loadDialog('<button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs" data-dialog-dismissible></dialog>');
  const trigger = document.querySelector("button");
  const dialog = document.getElementById("prefs");
  mockRect(dialog, { x: 20, y: 20, width: 200, height: 120 });

  click(trigger);
  click(dialog, { clientX: 0, clientY: 0 });

  expect(dialog.open).toBe(false);
});

test("non-dismissible dialog blocks Escape cancel requests", async () => {
  await loadDialog('<button id="open" commandfor="prefs" command="show-modal">Open</button><dialog id="prefs" data-dialog-dismissible="false"></dialog>');
  const trigger = document.getElementById("open");
  const dialog = document.getElementById("prefs");

  click(trigger);
  const event = new Event("cancel", { cancelable: true });
  dialog.dispatchEvent(event);
  await nextMicrotask();

  expect(event.defaultPrevented).toBe(true);
  expect(dialog.open).toBe(true);
});

test("application can cancel dismissible dialog cancel event", async () => {
  await loadDialog('<button id="open" commandfor="prefs" command="show-modal">Open</button><dialog id="prefs" data-dialog-dismissible></dialog>');
  const trigger = document.getElementById("open");
  const dialog = document.getElementById("prefs");

  click(trigger);
  dialog.addEventListener("actual:dialog-cancel", (event) => event.preventDefault());

  const event = new Event("cancel", { cancelable: true });
  dialog.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
  expect(dialog.open).toBe(true);
});

test("Escape cancel uses view-transition close path when enabled", async () => {
  setupDOM(`
    <button id="open" commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs" data-dialog-dismissible data-dialog-view-transition></dialog>
  `);
  patchDialogMethods();
  const transitions = [];
  document.startViewTransition = (update) => {
    update();
    const finished = Promise.resolve();
    transitions.push(finished);
    return { finished };
  };
  await import(`../src/js/dialog.js?test=${++importId}`);

  const trigger = document.getElementById("open");
  const dialog = document.getElementById("prefs");

  click(trigger);
  const event = new Event("cancel", { cancelable: true });
  dialog.dispatchEvent(event);
  await nextMicrotask();

  expect(event.defaultPrevented).toBe(true);
  expect(dialog.open).toBe(false);
  expect(transitions.length).toBeGreaterThan(0);
});

test("view-transition opt-in does not throw when unsupported", async () => {
  await loadDialog('<button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs" data-dialog-view-transition></dialog>');
  const trigger = document.querySelector("button");
  const dialog = document.getElementById("prefs");

  expect(() => click(trigger)).not.toThrow();
  expect(dialog.open).toBe(true);
});
