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
});

test("non-modal dialogs do not toggle the html scroll-lock hook", async () => {
  await loadDialog(
    '<button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs" data-dialog-modal="false"></dialog>',
  );

  click(document.querySelector("button"));

  expect(document.getElementById("prefs").open).toBe(true);
  expect(document.documentElement.classList.contains("has-modal-open")).toBe(false);
});

test("data-dialog-modal=false uses show instead of showModal", async () => {
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

  expect(showCalls).toBe(1);
  expect(showModalCalls).toBe(0);
  expect(document.getElementById("prefs").open).toBe(true);
});

test("dialog triggers connect when the dialog is inserted later", async () => {
  setupDOM('<main><button commandfor="prefs" command="show-modal">Open</button></main>');
  patchDialogMethods();
  await import(`../src/js/dialog.js?test=${++importId}`);

  document.querySelector("main").insertAdjacentHTML("beforeend", '<dialog id="prefs"></dialog>');
  await nextMicrotask();
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

test("view-transition opt-in does not throw when unsupported", async () => {
  await loadDialog('<button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs" data-dialog-view-transition></dialog>');
  const trigger = document.querySelector("button");
  const dialog = document.getElementById("prefs");

  expect(() => click(trigger)).not.toThrow();
  expect(dialog.open).toBe(true);
});
