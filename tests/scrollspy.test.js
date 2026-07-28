import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, nextMicrotask, setupDOM } from "./helpers/dom.js";

let importId = 0;
let observers = [];
let PreviousIntersectionObserver;

class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = [];
    observers.push(this);
  }

  observe(el) {
    this.observed.push(el);
  }

  disconnect() {
    this.disconnected = true;
  }
}

async function loadScrollspy(html) {
  setupDOM(html);
  PreviousIntersectionObserver = globalThis.IntersectionObserver;
  observers = [];
  globalThis.IntersectionObserver = MockIntersectionObserver;
  await import(`../src/js/scrollspy.js?test=${++importId}`);
}

afterEach(() => {
  if (PreviousIntersectionObserver === undefined) {
    delete globalThis.IntersectionObserver;
  } else {
    globalThis.IntersectionObserver = PreviousIntersectionObserver;
  }
  cleanupDOM();
});

test("scrollspy marks the visible section link", async () => {
  await loadScrollspy(`
    <nav class="scrollspy" data-enhance="scrollspy">
      <a href="#alpha">Alpha</a>
      <a href="#beta">Beta</a>
    </nav>
    <section id="alpha"></section>
    <section id="beta"></section>
  `);

  const io = observers.at(-1);
  io.callback([
    {
      isIntersecting: true,
      target: document.getElementById("beta"),
      boundingClientRect: { top: 10 },
    },
  ]);

  expect(document.querySelector('a[href="#beta"]').getAttribute("aria-current")).toBe("location");
  expect(document.querySelector('a[href="#alpha"]').hasAttribute("aria-current")).toBe(false);
});

test("scrollspy uses data-scrollspy-root and picks up dynamic links", async () => {
  await loadScrollspy(`
    <main id="viewport">
      <nav class="scrollspy" data-enhance="scrollspy" data-scrollspy-root="#viewport">
        <a href="#alpha">Alpha</a>
      </nav>
      <section id="alpha"></section>
    </main>
  `);

  expect(observers.at(-1).options.root).toBe(document.getElementById("viewport"));
  expect(observers.at(-1).observed).toEqual([document.getElementById("alpha")]);

  document.querySelector("nav").insertAdjacentHTML("beforeend", '<a href="#beta">Beta</a>');
  document.getElementById("viewport").insertAdjacentHTML("beforeend", '<section id="beta"></section>');
  await nextMicrotask();

  expect(observers.at(-1).observed).toEqual([
    document.getElementById("alpha"),
    document.getElementById("beta"),
  ]);
});

test("scrollspy ignores unrelated body mutations", async () => {
  await loadScrollspy(`
    <nav class="scrollspy" data-enhance="scrollspy">
      <a href="#alpha">Alpha</a>
    </nav>
    <section id="alpha"></section>
    <aside></aside>
  `);

  expect(observers).toHaveLength(1);

  document.querySelector("aside").insertAdjacentHTML("beforeend", "<p>Unrelated</p>");
  await nextMicrotask();

  expect(observers).toHaveLength(1);
});

test("scrollspy keeps intersection state across callback batches", async () => {
  await loadScrollspy(`
    <nav class="scrollspy" data-enhance="scrollspy">
      <a href="#alpha">Alpha</a>
      <a href="#beta">Beta</a>
    </nav>
    <section id="alpha"></section>
    <section id="beta"></section>
  `);

  const io = observers.at(-1);
  io.callback([
    {
      isIntersecting: true,
      target: document.getElementById("alpha"),
      boundingClientRect: { top: 10 },
    },
  ]);

  io.callback([
    {
      isIntersecting: true,
      target: document.getElementById("beta"),
      boundingClientRect: { top: 30 },
    },
  ]);

  expect(document.querySelector('a[href="#alpha"]').getAttribute("aria-current")).toBe("location");
  expect(document.querySelector('a[href="#beta"]').hasAttribute("aria-current")).toBe(false);

  io.callback([
    {
      isIntersecting: false,
      target: document.getElementById("beta"),
      boundingClientRect: { top: 30 },
    },
  ]);

  expect(document.querySelector('a[href="#alpha"]').getAttribute("aria-current")).toBe("location");
  expect(document.querySelector('a[href="#beta"]').hasAttribute("aria-current")).toBe(false);
});
