import { afterAll, afterEach, expect, test } from "bun:test";
import { EVENTS } from "../src/js/events.js";
import { cleanupDOM, mockRect, setupDOM } from "./helpers/dom.js";

setupDOM();

const { reposition, repositionAt, track } = await import(
  `../src/js/floating.js?test=${Date.now()}`
);

const untracks = [];

function setViewport(width = 1024, height = 768) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: height,
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
}

function nextFrame() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  while (untracks.length) untracks.pop()();
  document.body.innerHTML = "";
});

afterAll(() => {
  cleanupDOM();
});

test("track registers an element and cleanup unregisters it", async () => {
  document.body.innerHTML = '<div id="float"></div>';
  const float = document.getElementById("float");
  const events = [];
  float.addEventListener(EVENTS.reposition, (event) => events.push(event.detail.type));
  const untrack = track(float);

  window.dispatchEvent(new Event("resize"));
  await nextFrame();
  untrack();
  window.dispatchEvent(new Event("resize"));
  await nextFrame();

  expect(events).toEqual(["resize"]);
});

test("scroll and resize dispatch actual:reposition", async () => {
  document.body.innerHTML = '<div id="float"></div>';
  const float = document.getElementById("float");
  const events = [];
  untracks.push(track(float));
  float.addEventListener(EVENTS.reposition, (event) => events.push(event.detail.type));

  document.dispatchEvent(new Event("scroll"));
  await nextFrame();
  window.dispatchEvent(new Event("resize"));
  await nextFrame();

  expect(events).toEqual(["scroll", "resize"]);
});

test("Escape dispatches actual:hide", () => {
  document.body.innerHTML = '<div id="float"></div>';
  const float = document.getElementById("float");
  let hides = 0;
  untracks.push(track(float));
  float.addEventListener(EVENTS.hide, () => {
    hides += 1;
  });

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

  expect(hides).toBe(1);
});

test("reposition sets coordinates, placement, and arrow position", () => {
  setViewport();
  document.body.innerHTML = '<button id="ref"></button><div id="float"></div>';
  const ref = document.getElementById("ref");
  const float = document.getElementById("float");
  mockRect(ref, { x: 100, y: 100, width: 60, height: 24 });
  mockRect(float, { x: 0, y: 0, width: 120, height: 80 });

  reposition(ref, float, { placement: "bottom-start", distance: 8 });

  expect(float.style.left).toBe("100px");
  expect(float.style.top).toBe("132px");
  expect(float.dataset.placement).toBe("bottom-start");
  expect(float.style.getPropertyValue("--arrow-x")).toBe("50%");
});

test("reposition measures transformed floating elements from layout size", () => {
  setViewport();
  document.body.innerHTML = '<button id="ref"></button><div id="float"></div>';
  const ref = document.getElementById("ref");
  const float = document.getElementById("float");
  mockRect(ref, { x: 100, y: 100, width: 20, height: 20 });
  mockRect(float, { x: 0, y: 0, width: 80, height: 40 });
  Object.defineProperty(float, "offsetWidth", {
    configurable: true,
    value: 100,
  });
  Object.defineProperty(float, "offsetHeight", {
    configurable: true,
    value: 50,
  });

  reposition(ref, float, { placement: "bottom", distance: 0 });

  expect(float.style.left).toBe("60px");
  expect(float.style.top).toBe("120px");
});

test("reposition skips hidden elements without rejecting visible fixed elements", () => {
  setViewport();
  document.body.innerHTML = '<button id="ref"></button><div id="hidden" hidden></div><div id="fixed"></div>';
  const ref = document.getElementById("ref");
  const hidden = document.getElementById("hidden");
  const fixed = document.getElementById("fixed");
  mockRect(ref, { x: 100, y: 100, width: 60, height: 24 });
  mockRect(hidden, { x: 0, y: 0, width: 120, height: 80 });
  mockRect(fixed, { x: 0, y: 0, width: 120, height: 80 });
  fixed.style.position = "fixed";

  reposition(ref, hidden, { placement: "bottom-start", distance: 8 });
  reposition(ref, fixed, { placement: "bottom-start", distance: 8 });

  expect(hidden.style.left).toBe("");
  expect(fixed.style.left).toBe("100px");
});

test("repositionAt positions a floating element from a point reference", () => {
  setViewport();
  document.body.innerHTML = '<div id="float"></div>';
  const float = document.getElementById("float");
  mockRect(float, { x: 0, y: 0, width: 100, height: 50 });

  repositionAt(200, 160, float, { placement: "right", distance: 10 });

  expect(float.style.left).toBe("210px");
  expect(float.style.top).toBe("135px");
  expect(float.dataset.placement).toBe("right");
});

test("reposition flips when the preferred side overflows", () => {
  setViewport(1024, 768);
  document.body.innerHTML = '<button id="ref"></button><div id="float"></div>';
  const ref = document.getElementById("ref");
  const float = document.getElementById("float");
  mockRect(ref, { x: 100, y: 730, width: 60, height: 24 });
  mockRect(float, { x: 0, y: 0, width: 120, height: 80 });

  reposition(ref, float, { placement: "bottom-start", distance: 4 });

  expect(float.dataset.placement).toBe("top-start");
  expect(Number.parseFloat(float.style.top)).toBeLessThan(730);
});
