import { afterAll, afterEach, expect, test } from "bun:test";
import { cleanupDOM, mockRect, setupDOM } from "./helpers/dom.js";

setupDOM();

let resizeCallback;
let resizeObserver;
const resizeObserved = new Set();

window.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    resizeCallback = cb;
    resizeObserver = this;
  }

  observe(el) {
    resizeObserved.add(el);
  }

  unobserve(el) {
    resizeObserved.delete(el);
  }
};

const { autoUpdate, reposition, repositionAt } = await import(
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
  delete window.visualViewport;
  delete document.body.clientWidth;
  document.body.style.margin = "";
  resizeObserved.clear();
  document.body.innerHTML = "";
});

afterAll(() => {
  cleanupDOM();
});

test("autoUpdate registers an element and cleanup unregisters it", async () => {
  document.body.innerHTML = '<div id="float"></div>';
  const float = document.getElementById("float");
  const calls = [];
  const stop = autoUpdate(float, (detail) => calls.push(detail.type));

  window.dispatchEvent(new Event("resize"));
  await nextFrame();
  stop();
  window.dispatchEvent(new Event("resize"));
  await nextFrame();

  expect(calls).toEqual(["resize"]);
});

test("scroll and resize trigger autoUpdate callbacks", async () => {
  document.body.innerHTML = '<div id="float"></div>';
  const float = document.getElementById("float");
  const calls = [];
  untracks.push(autoUpdate(float, (detail) => calls.push(detail.type)));

  document.dispatchEvent(new Event("scroll"));
  await nextFrame();
  window.dispatchEvent(new Event("resize"));
  await nextFrame();

  expect(calls).toEqual(["scroll", "resize"]);
});

test("scroll and resize in the same frame keep distinct callback types", async () => {
  document.body.innerHTML = '<div id="float"></div>';
  const float = document.getElementById("float");
  const calls = [];
  untracks.push(autoUpdate(float, (detail) => calls.push(detail.type)));

  window.dispatchEvent(new Event("resize"));
  document.dispatchEvent(new Event("scroll"));
  await nextFrame();

  expect(calls).toEqual(["resize", "scroll"]);
});

test("autoUpdate fires on floating element resize", async () => {
  document.body.innerHTML = '<div id="float"></div>';
  const float = document.getElementById("float");
  const calls = [];
  untracks.push(autoUpdate(float, (detail) => calls.push(detail.type)));

  expect(resizeObserved.has(float)).toBe(true);

  resizeCallback([{ target: float }], resizeObserver);
  await nextFrame();
  await nextFrame();

  expect(calls).toEqual(["element-resize"]);
  expect(resizeObserved.has(float)).toBe(true);
});

test("autoUpdate does not dispatch Escape (Escape moved to surface layer)", () => {
  document.body.innerHTML = '<div id="float"></div>';
  const float = document.getElementById("float");
  let called = false;
  untracks.push(autoUpdate(float, () => { called = true; }));

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

  expect(called).toBe(false);
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
  expect(float.style.getPropertyValue("--available-height")).toBe("632px");
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

test("reposition uses body stable-scrollbar width when clamping to the viewport", () => {
  setViewport(1024, 768);
  document.body.style.margin = "0";
  Object.defineProperty(document.body, "clientWidth", {
    configurable: true,
    value: 1009,
  });
  document.body.innerHTML = '<button id="ref"></button><div id="float"></div>';
  const ref = document.getElementById("ref");
  const float = document.getElementById("float");
  mockRect(ref, { x: 950, y: 100, width: 60, height: 24 });
  mockRect(float, { x: 0, y: 0, width: 120, height: 80 });

  reposition(ref, float, { placement: "bottom", distance: 8 });

  expect(float.style.left).toBe("885px");
});

test("reposition uses visual viewport offsets as the fixed boundary", () => {
  setViewport(1024, 768);
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: {
      width: 500,
      height: 400,
      offsetLeft: 20,
      offsetTop: 30,
    },
  });
  document.body.innerHTML = '<button id="ref"></button><div id="float"></div>';
  const ref = document.getElementById("ref");
  const float = document.getElementById("float");
  mockRect(ref, { x: 480, y: 100, width: 20, height: 24 });
  mockRect(float, { x: 0, y: 0, width: 100, height: 80 });

  reposition(ref, float, { placement: "bottom", distance: 8 });

  expect(float.style.left).toBe("416px");
});

test("reposition returns false when the reference is outside the boundary", () => {
  setViewport();
  document.body.innerHTML = '<button id="ref"></button><div id="float"></div>';
  const ref = document.getElementById("ref");
  const float = document.getElementById("float");
  mockRect(ref, { x: -220, y: 100, width: 60, height: 24 });
  mockRect(float, { x: 0, y: 0, width: 120, height: 80 });

  const result = reposition(ref, float, { placement: "bottom-start", distance: 8 });

  expect(result).toBe(false);
  expect(float.style.left).toBe("");
});

test("reposition clamps side placements on the y axis", () => {
  setViewport(1024, 768);
  document.body.innerHTML = '<button id="ref"></button><div id="float"></div>';
  const ref = document.getElementById("ref");
  const float = document.getElementById("float");
  mockRect(ref, { x: 100, y: 730, width: 20, height: 20 });
  mockRect(float, { x: 0, y: 0, width: 100, height: 100 });

  reposition(ref, float, { placement: "right", distance: 8 });

  expect(float.style.top).toBe("664px");
  expect(float.style.getPropertyValue("--arrow-y")).toBe("24%");
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

test("physical side offsets are not flipped by RTL", () => {
  setViewport();
  document.documentElement.dir = "rtl";
  document.body.innerHTML = '<div id="float"></div>';
  const float = document.getElementById("float");
  mockRect(float, { x: 0, y: 0, width: 100, height: 50 });

  repositionAt(200, 160, float, { placement: "right", distance: 10 });

  // `right` is a physical direction; RTL must not reverse its offset.
  expect(float.style.left).toBe("210px");
  document.documentElement.dir = "";
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
