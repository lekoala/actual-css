import { afterEach, expect, test } from "bun:test";
import enhance from "../src/js/enhance.js";
import { enhancementSelector, hasEnhancement, registerEnhancement } from "../src/js/enhance.js";
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

test("enhancementSelector returns [data-enhance~=\"name\"]", () => {
  expect(enhancementSelector("tabs")).toBe('[data-enhance~="tabs"]');
});

test("enhancementSelector throws TypeError on invalid names", () => {
  for (const name of ["de mo", "Demo", "1tabs", ""]) {
    expect(() => enhancementSelector(name)).toThrow(TypeError);
  }
});

test("hasEnhancement returns true when token is present", () => {
  setupDOM('<div data-enhance="tabs flyout"></div>');
  const el = document.querySelector("div");
  expect(hasEnhancement(el, "tabs")).toBe(true);
  expect(hasEnhancement(el, "flyout")).toBe(true);
  expect(hasEnhancement(el, "validation")).toBe(false);
});

test("hasEnhancement does not match substrings (~= word matching)", () => {
  setupDOM('<div data-enhance="demoish"></div>');
  const el = document.querySelector("div");
  expect(hasEnhancement(el, "demo")).toBe(false);
  expect(hasEnhancement(el, "demoish")).toBe(true);
});

test("registerEnhancement connects an element already in the DOM", () => {
  setupDOM('<div data-enhance="demo"></div>');
  const calls = [];
  const runtime = registerEnhancement("demo", (el) => calls.push(el));
  expect(calls).toHaveLength(1);
  expect(calls[0]).toBe(document.querySelector("[data-enhance~=demo]"));
  runtime.disconnect();
});

test("registerEnhancement connects an element inserted later", async () => {
  setupDOM("<section></section>");
  const calls = [];
  const runtime = registerEnhancement("demo", (el) => calls.push(el));

  document.querySelector("section").innerHTML = '<div data-enhance="demo"></div>';
  await nextMicrotask();

  expect(calls).toHaveLength(1);
  runtime.disconnect();
});

test("registerEnhancement: token added after registration needs refresh", () => {
  setupDOM('<div id="target"></div>');
  const calls = [];
  const runtime = registerEnhancement("demo", (el) => calls.push(el));

  const el = document.getElementById("target");
  el.setAttribute("data-enhance", "demo");
  // Not connected automatically — attribute changes are not observed
  expect(calls).toHaveLength(0);

  runtime.refresh(el);
  expect(calls).toHaveLength(1);
  expect(calls[0]).toBe(el);
  runtime.disconnect();
});

test("registerEnhancement runs cleanup when element is removed", async () => {
  setupDOM('<div data-enhance="demo"></div>');
  const cleanupCalls = [];
  const el = document.querySelector("div");
  const runtime = registerEnhancement("demo", () => () => cleanupCalls.push(el));

  el.remove();
  await nextMicrotask();

  expect(cleanupCalls).toEqual([el]);
  runtime.disconnect();
});

test("multiple tokens on one element run both registered inits", () => {
  setupDOM('<div data-enhance="demo other"></div>');
  const calls = [];
  const el = document.querySelector("div");

  const a = registerEnhancement("demo", (el) => calls.push("demo"));
  const b = registerEnhancement("other", (el) => calls.push("other"));

  expect(calls).toContain("demo");
  expect(calls).toContain("other");
  a.disconnect();
  b.disconnect();
});

test("registers a third-party behavior without touching core", async () => {
  setupDOM('<div data-enhance="third-party"></div>');
  let connected = null;
  const runtime = registerEnhancement("third-party", (el) => {
    connected = el;
    el.setAttribute("data-hooked", "");
    return () => el.removeAttribute("data-hooked");
  });

  const el = document.querySelector("[data-enhance~=third-party]");
  expect(connected).toBe(el);
  expect(el.hasAttribute("data-hooked")).toBe(true);

  el.remove();
  await nextMicrotask();

  expect(el.hasAttribute("data-hooked")).toBe(false);
  runtime.disconnect();
});

test("registerEnhancement: duplicate name on the same root throws", () => {
  setupDOM('<div data-enhance="demo"></div>');
  const runtime = registerEnhancement("demo", () => {});

  expect(() => registerEnhancement("demo", () => {})).toThrow(/already registered/);
  runtime.disconnect();
});

test("registerEnhancement: same name on different roots works", () => {
  setupDOM(`
    <section id="a"><div data-enhance="demo"></div></section>
    <section id="b"><div data-enhance="demo"></div></section>
  `);
  const calls = [];
  const a = registerEnhancement("demo", () => calls.push("a"), document.getElementById("a"));
  const b = registerEnhancement("demo", () => calls.push("b"), document.getElementById("b"));

  expect(calls).toEqual(["a", "b"]);
  a.disconnect();
  b.disconnect();
});

test("registerEnhancement: disconnect releases the name for re-registration", () => {
  setupDOM('<div data-enhance="demo"></div>');
  const first = registerEnhancement("demo", () => {});
  first.disconnect();

  const second = registerEnhancement("demo", () => {});
  expect(second.disconnect).toBeTypeOf("function");
  second.disconnect();
});

test("enhance() remains multi-registration for the same selector", () => {
  setupDOM('<div data-test></div>');
  const calls = [];
  const first = enhance({ "[data-test]": () => calls.push("first") });
  const second = enhance({ "[data-test]": () => calls.push("second") });

  expect(calls).toEqual(["first", "second"]);
  first.disconnect();
  second.disconnect();
});

test("cleans up an element moved out of its custom root while staying connected", async () => {
  setupDOM('<section id="root"><div data-test></div></section><section id="elsewhere"></section>');
  const cleanupCalls = [];
  const el = document.querySelector("[data-test]");
  const runtime = enhance({ "[data-test]": () => () => cleanupCalls.push(el) }, document.getElementById("root"));

  document.getElementById("elsewhere").append(el);
  await nextMicrotask();

  expect(el.isConnected).toBe(true);
  expect(cleanupCalls).toEqual([el]);
  runtime.disconnect();
});

test("does not clean up an element moved within its custom root", async () => {
  setupDOM('<section id="root"><div id="a"><div data-test></div></div><div id="b"></div></section>');
  const cleanupCalls = [];
  const el = document.querySelector("[data-test]");
  const runtime = enhance({ "[data-test]": () => () => cleanupCalls.push(el) }, document.getElementById("root"));

  document.getElementById("b").append(el);
  await nextMicrotask();

  expect(el.isConnected).toBe(true);
  expect(cleanupCalls).toHaveLength(0);
  runtime.disconnect();
});
