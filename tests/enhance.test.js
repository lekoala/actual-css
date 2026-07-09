import { afterEach, expect, test } from "bun:test";
import enhance from "../src/js/enhance.js";
import { cleanupDOM, nextMicrotask, setupDOM } from "./helpers/dom.js";

afterEach(() => {
  cleanupDOM();
});

test("enhances initial matching elements once", () => {
  setupDOM('<button data-test></button>');
  const calls = [];

  const runtime = enhance({
    "[data-test]": (el) => {
      calls.push(el);
    },
  });

  runtime.refresh(document.body);

  expect(calls).toHaveLength(1);
  expect(calls[0]).toBe(document.querySelector("[data-test]"));
  runtime.disconnect();
});

test("enhances dynamically inserted matching descendants", async () => {
  setupDOM("<section></section>");
  const calls = [];
  const runtime = enhance({
    "[data-test]": (el) => calls.push(el),
  });

  document.querySelector("section").innerHTML = "<div><button data-test></button></div>";
  await nextMicrotask();

  expect(calls).toHaveLength(1);
  expect(calls[0].matches("button")).toBe(true);
  runtime.disconnect();
});

test("shares one lifecycle across multiple enhance calls", async () => {
  setupDOM("<section></section>");
  const calls = [];
  const first = enhance({
    "[data-one]": (el) => calls.push(["one", el.id]),
  });
  const second = enhance({
    "[data-two]": (el) => calls.push(["two", el.id]),
  });

  document.querySelector("section").innerHTML = `
    <button id="a" data-one></button>
    <button id="b" data-two></button>
  `;
  await nextMicrotask();

  expect(calls).toEqual([
    ["one", "a"],
    ["two", "b"],
  ]);
  first.disconnect();
  second.disconnect();
});

test("disconnecting one enhance call leaves sibling enhancers alive", async () => {
  setupDOM('<section><button id="one" data-one></button><button id="two" data-two></button></section>');
  const cleanupCalls = [];
  const first = enhance({
    "[data-one]": (el) => () => cleanupCalls.push(el.id),
  });
  const second = enhance({
    "[data-two]": (el) => () => cleanupCalls.push(el.id),
  });

  first.disconnect();
  document.querySelector("[data-two]").remove();
  await nextMicrotask();

  expect(cleanupCalls).toEqual(["one", "two"]);
  second.disconnect();
});

test("runs cleanup when an enhanced element is removed", async () => {
  setupDOM('<button data-test></button>');
  const cleanupCalls = [];
  const button = document.querySelector("button");
  const runtime = enhance({
    "[data-test]": (el) => () => cleanupCalls.push(el),
  });

  button.remove();
  await nextMicrotask();

  expect(cleanupCalls).toEqual([button]);
  runtime.disconnect();
});

test("does not clean up an element moved within the same mutation batch", async () => {
  setupDOM('<main><section id="a"><button data-test></button></section><section id="b"></section></main>');
  const cleanupCalls = [];
  const button = document.querySelector("button");
  const runtime = enhance({
    "[data-test]": (el) => () => cleanupCalls.push(el),
  });

  document.getElementById("b").append(button);
  await nextMicrotask();

  expect(cleanupCalls).toHaveLength(0);
  expect(button.isConnected).toBe(true);
  runtime.disconnect();
});

test("does not enhance an already enhanced element twice after reinsertion", async () => {
  setupDOM('<section id="host"><button data-test></button></section>');
  const calls = [];
  const button = document.querySelector("button");
  const runtime = enhance({
    "[data-test]": (el) => {
      calls.push(el);
    },
  });

  button.remove();
  document.getElementById("host").append(button);
  await nextMicrotask();

  expect(calls).toEqual([button]);
  runtime.disconnect();
});

test("disconnect stops observation and cleans active instances once", async () => {
  setupDOM('<section><button data-test id="one"></button><button data-test id="two"></button></section>');
  const cleanupCalls = [];
  const runtime = enhance({
    "[data-test]": (el) => () => cleanupCalls.push(el.id),
  });

  runtime.disconnect();
  document.querySelector("section").insertAdjacentHTML("beforeend", '<button data-test id="three"></button>');
  await nextMicrotask();
  runtime.disconnect();

  expect(cleanupCalls).toEqual(["one", "two"]);
});

test("refresh is a no-op after disconnect", () => {
  setupDOM('<section><button data-test id="one"></button></section>');
  const calls = [];
  const runtime = enhance({
    "[data-test]": (el) => calls.push(el.id),
  });

  runtime.disconnect();
  runtime.refresh(document.body);

  expect(calls).toEqual(["one"]);
});

test("invalid selectors are skipped without blocking valid enhancers", () => {
  setupDOM('<button data-test></button>');
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args);

  try {
    const calls = [];
    const runtime = enhance({
      "[": () => calls.push("invalid"),
      "[data-test]": (el) => calls.push(el),
    });

    expect(calls).toEqual([document.querySelector("[data-test]")]);
    expect(errors.length).toBeGreaterThan(0);
    runtime.disconnect();
  } finally {
    console.error = original;
  }
});

test("a throwing enhancer does not stop sibling enhancers", () => {
  setupDOM('<button data-test data-other></button>');
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args);

  try {
    const calls = [];
    const runtime = enhance({
      "[data-test]": () => {
        throw new Error("boom");
      },
      "[data-other]": (el) => calls.push(el),
    });

    expect(calls).toEqual([document.querySelector("[data-other]")]);
    expect(errors.length).toBeGreaterThan(0);
    runtime.disconnect();
  } finally {
    console.error = original;
  }
});
