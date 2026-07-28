/*
 * Layout — geometry stubs for deterministic scroll/rect tests.
 *
 * Overrides getBoundingClientRect, scrollTop, clientHeight and
 * requestAnimationFrame so tests can control geometry without mocking
 * IntersectionObserver or relying on real browser layout.
 */

export function stubRect(el, rect) {
  const { top = 0, bottom = 0, height = bottom - top, width = 0 } = rect;
  Object.defineProperty(el, "getBoundingClientRect", {
    configurable: true,
    writable: true,
    value: () => ({ top, bottom, height, width, left: 0, right: width, x: 0, y: top, toJSON() {} }),
  });
}

export function stubScrollTop(el, value) {
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get: () => value,
  });
}

export function stubClientHeight(el, value) {
  Object.defineProperty(el, "clientHeight", {
    configurable: true,
    get: () => value,
  });
}

export function rAFThunk() {
  let cb = null;
  let id = 1;
  const orig = globalThis.requestAnimationFrame;

  globalThis.requestAnimationFrame = (callback) => {
    cb = callback;
    return id++;
  };

  return {
    fire() {
      if (cb) {
        const prev = cb;
        cb = null;
        prev(performance.now());
      }
    },
    restore() {
      globalThis.requestAnimationFrame = orig;
    },
  };
}
