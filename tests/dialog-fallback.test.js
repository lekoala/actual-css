import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, click, mockRect, nextMicrotask, press, setupDOM } from "./helpers/dom.js";

let importId = 0;

/* Simulate a browser without native <dialog>: happy-dom implements the
 * methods on HTMLDialogElement.prototype, so deleting them makes
 * supportsDialog() false and forces dialog.js onto the shim path. */
function stripDialogSupport() {
  delete HTMLDialogElement.prototype.show;
  delete HTMLDialogElement.prototype.showModal;
  delete HTMLDialogElement.prototype.close;
  delete HTMLDialogElement.prototype.requestClose;
}

async function loadLegacyDialog(html) {
  setupDOM(html);
  stripDialogSupport();
  await import(`../src/js/dialog.js?fallback=${++importId}`);
}

afterEach(() => {
  cleanupDOM();
});

test("show-modal opens through the shim instead of alerting", async () => {
  await loadLegacyDialog(
    '<button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs"></dialog>',
  );
  let alerts = 0;
  window.alert = () => {
    alerts += 1;
  };
  const dialog = document.getElementById("prefs");

  click(document.querySelector("button"));

  expect(alerts).toBe(0);
  expect(dialog.open).toBe(true);
  expect(dialog.hasAttribute("open")).toBe(true);
  expect(dialog.classList.contains("dialog-fallback")).toBe(true);
  expect(dialog.classList.contains("is-fallback-modal")).toBe(true);
  expect(document.documentElement.classList.contains("has-modal-open")).toBe(true);
});

test("request-close closes a shimmed dialog and restores focus", async () => {
  await loadLegacyDialog(`
    <button id="open" commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs">
      <button id="close" commandfor="prefs" command="request-close" value="done">Close</button>
    </dialog>
  `);
  const open = document.getElementById("open");
  const dialog = document.getElementById("prefs");

  click(open);
  click(document.getElementById("close"));

  expect(dialog.open).toBe(false);
  expect(dialog.returnValue).toBe("done");
  expect(dialog.classList.contains("is-fallback-modal")).toBe(false);
  expect(document.documentElement.classList.contains("has-modal-open")).toBe(false);
  expect(document.activeElement).toBe(open);
});

test("Escape closes a dismissible shimmed modal", async () => {
  await loadLegacyDialog(`
    <button id="open" commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs" data-dialog-dismissible></dialog>
  `);
  const dialog = document.getElementById("prefs");

  click(document.getElementById("open"));
  press(document, "Escape");

  expect(dialog.open).toBe(false);
  expect(document.activeElement).toBe(document.getElementById("open"));
});

test("Escape keeps a non-dismissible shimmed modal open", async () => {
  await loadLegacyDialog(`
    <button id="open" commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs" data-dialog-dismissible="false"></dialog>
  `);
  const dialog = document.getElementById("prefs");

  click(document.getElementById("open"));
  press(document, "Escape");

  expect(dialog.open).toBe(true);
});

test("backdrop clicks dismiss a shimmed dismissible modal", async () => {
  await loadLegacyDialog(
    '<button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs" data-dialog-dismissible></dialog>',
  );
  const dialog = document.getElementById("prefs");
  mockRect(dialog, { x: 20, y: 20, width: 200, height: 120 });

  click(document.querySelector("button"));
  click(dialog, { clientX: 0, clientY: 0 });

  expect(dialog.open).toBe(false);
});

test("command=show opens a shimmed dialog without the modal fallback state", async () => {
  await loadLegacyDialog(
    '<button commandfor="prefs" command="show">Open</button><dialog id="prefs"></dialog>',
  );
  const dialog = document.getElementById("prefs");

  click(document.querySelector("button"));

  expect(dialog.open).toBe(true);
  expect(dialog.classList.contains("is-fallback-modal")).toBe(false);
  expect(document.documentElement.classList.contains("has-modal-open")).toBe(false);
});

test("a shimmed dialog focuses its autofocus element on open", async () => {
  await loadLegacyDialog(`
    <button commandfor="prefs" command="show-modal">Open</button>
    <dialog id="prefs"><input autofocus /></dialog>
  `);

  click(document.querySelector("button"));

  expect(document.activeElement).toBe(document.querySelector("input"));
});

test("the shim applies to a dialog inserted immediately before the click", async () => {
  setupDOM('<main><button commandfor="prefs" command="show-modal">Open</button></main>');
  stripDialogSupport();
  await import(`../src/js/dialog.js?fallback=${++importId}`);

  document.querySelector("main").insertAdjacentHTML("beforeend", '<dialog id="prefs"></dialog>');
  const dialog = document.getElementById("prefs");

  click(document.querySelector("button"));

  expect(dialog.open).toBe(true);
  expect(dialog.classList.contains("is-fallback-modal")).toBe(true);
});

test("an element-level polyfill is left untouched by the shim", async () => {
  setupDOM('<button commandfor="prefs" command="show-modal">Open</button><dialog id="prefs"></dialog>');
  stripDialogSupport();
  const dialog = document.getElementById("prefs");
  let polyfillCalls = 0;
  dialog.show = () => {};
  dialog.showModal = () => {
    polyfillCalls += 1;
    dialog.open = true;
    dialog.setAttribute("open", "");
  };
  dialog.close = () => {};
  await import(`../src/js/dialog.js?fallback=${++importId}`);

  await nextMicrotask();
  click(document.querySelector("button"));

  expect(polyfillCalls).toBe(1);
  expect(dialog.classList.contains("dialog-fallback")).toBe(false);
});
