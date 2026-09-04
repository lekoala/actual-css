import { afterEach, expect, test } from "bun:test";
import { cleanupDOM, nextMicrotask, press, setupDOM } from "./helpers/dom.js";

// The transport no longer uses [hidden]; .is-open is the lifecycle state.
const isOpen = (el) => el.classList.contains("is-open");

let importId = 0;

async function loadSurface(html) {
  setupDOM(html);
  return import(`../src/js/surface.js?test=${++importId}`);
}

afterEach(() => {
  cleanupDOM();
});

test("a listbox surface opens and closes without interference", async () => {
  const { openSurface, closeSurface, prepareSurface, isSurfaceOpen } = await loadSurface(`
    <div data-actual-surface hidden>
      <div role="listbox">
        <div role="option" id="opt-a" tabindex="0">Option A</div>
        <div role="option" id="opt-b">Option B</div>
      </div>
    </div>
  `);
  const surface = document.querySelector("[data-actual-surface]");

  prepareSurface(surface);
  openSurface(surface);

  expect(isOpen(surface)).toBe(true);
  expect(isSurfaceOpen(surface)).toBe(true);
  expect(surface.classList.contains("is-open")).toBe(true);

  closeSurface(surface);

  expect(isOpen(surface)).toBe(false);
  expect(isSurfaceOpen(surface)).toBe(false);
});

test("surface does not hijack ArrowDown for a non-menu listbox", async () => {
  const { openSurface, prepareSurface } = await loadSurface(`
    <div data-actual-surface hidden>
      <div role="listbox">
        <div role="option" id="opt-a" tabindex="0">Option A</div>
        <div role="option" id="opt-b">Option B</div>
      </div>
    </div>
  `);
  const surface = document.querySelector("[data-actual-surface]");
  const optA = document.getElementById("opt-a");

  prepareSurface(surface);
  openSurface(surface);

  optA.focus();
  press(surface, "ArrowDown");

  // Surface.js does not handle ArrowDown for non-menu surfaces —
  // focus should stay where it was.
  expect(document.activeElement).toBe(optA);
});

test("surface does not autoclose on option click (D11 seam)", async () => {
  const { openSurface, prepareSurface, isSurfaceOpen } = await loadSurface(`
    <div data-actual-surface hidden>
      <div role="listbox">
        <div role="option" id="opt-a">Option A</div>
      </div>
    </div>
  `);
  const surface = document.querySelector("[data-actual-surface]");
  const optA = document.getElementById("opt-a");

  prepareSurface(surface);
  openSurface(surface);

  optA.click();

  expect(isSurfaceOpen(surface)).toBe(true);
});

test("removing a listbox surface from the DOM tears it down", async () => {
  const { openSurface, prepareSurface } = await loadSurface(`
    <div id="surface" hidden>
      <div role="listbox">
        <div role="option">Option A</div>
      </div>
    </div>
  `);
  const surface = document.getElementById("surface");

  prepareSurface(surface);
  openSurface(surface);
  expect(surface.classList.contains("is-open")).toBe(true);

  surface.remove();
  await nextMicrotask();

  expect(surface.classList.contains("is-open")).toBe(false);
});
