import { afterEach, expect, test } from "bun:test";
import { registerEscapeDismissal } from "../src/js/escape.js";
import { cleanupDOM, setupDOM } from "./helpers/dom.js";

afterEach(() => {
  cleanupDOM();
});

test("Escape dismissal is LIFO and released entries leave the stack", () => {
  setupDOM('<div id="a"></div><div id="b"></div>');
  const dismissed = [];
  registerEscapeDismissal(document.getElementById("a"), () => dismissed.push("a"));
  const releaseB = registerEscapeDismissal(document.getElementById("b"), () =>
    dismissed.push("b"),
  );

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", cancelable: true }));
  expect(dismissed).toEqual(["b"]);

  releaseB();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", cancelable: true }));
  expect(dismissed).toEqual(["b", "a"]);
});

test("Escape dismissal ignores modified shortcuts", () => {
  setupDOM('<div id="target"></div>');
  let dismissed = false;
  registerEscapeDismissal(document.getElementById("target"), () => {
    dismissed = true;
  });
  const event = new KeyboardEvent("keydown", {
    key: "Escape",
    ctrlKey: true,
    cancelable: true,
  });

  document.dispatchEvent(event);

  expect(dismissed).toBe(false);
  expect(event.defaultPrevented).toBe(false);
});
