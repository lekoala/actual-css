/*
 * Layout — geometry stubs for deterministic scroll/rect tests.
 *
 * Overrides getBoundingClientRect, scrollTop, clientHeight and
 * requestAnimationFrame so tests can control geometry without mocking
 * IntersectionObserver or relying on real browser layout.
 *
 * Two levels, use whichever fits:
 *
 * - stubRect / stubScrollTop / stubClientHeight / rAFThunk — fixed values and
 *   a manually fired frame. Enough when a single measurement is under test.
 * - createLayout() — a scroll-position model: elements sit at absolute offsets
 *   and their viewport rect is *derived* on every read (top = offset -
 *   scrollTop). Needed whenever the behavior under test reacts to scrolling,
 *   because the dependency between scroll position and rect is the thing being
 *   tested; fixed rects cannot express it.
 *
 * Timing, the part that looks like "scroll events do not work in happy-dom":
 * window.dispatchEvent(new Event("scroll")) *does* reach a window listener, but
 * setupDOM() shims requestAnimationFrame as setTimeout(0), so an rAF-throttled
 * handler runs in a **macrotask**. await nextMicrotask() sees nothing; await
 * nextFrame() does. createLayout's scrollTo()/resize() await it for you.
 */

/** Resolves after shimmed requestAnimationFrame callbacks have run. */
export function nextFrame() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

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

/**
 * A scroll-position model for the viewport or a scroll container.
 *
 * @param {object} [options]
 * @param {number} [options.height]       visible height of the scroll root
 * @param {number} [options.scrollHeight] total scrollable height
 * @param {Element} [options.root]        scroll container; omit for the viewport
 */
export function createLayout({ height = 600, scrollHeight = 2000, root = null } = {}) {
  const boxes = new WeakMap();
  let scrollTop = 0;
  let viewport = height;

  const scroller = root ?? document.documentElement;
  Object.defineProperty(scroller, "clientHeight", { configurable: true, get: () => viewport });
  Object.defineProperty(scroller, "scrollHeight", { configurable: true, get: () => scrollHeight });
  Object.defineProperty(scroller, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (value) => {
      scrollTop = value;
    },
  });

  function place(el, top, blockSize = 200, { fixed = false } = {}) {
    boxes.set(el, { top, blockSize, fixed });
    el.getBoundingClientRect = () => {
      const box = boxes.get(el);
      // A container's own rect stays put; only its content scrolls.
      const viewportTop = box.fixed ? box.top : box.top - scrollTop;
      return {
        x: 0,
        y: viewportTop,
        top: viewportTop,
        bottom: viewportTop + box.blockSize,
        left: 0,
        right: 0,
        width: 0,
        height: box.blockSize,
        toJSON() {},
      };
    };
    el.getClientRects = () => [el.getBoundingClientRect()];
    return el;
  }

  if (root) place(root, 0, height, { fixed: true });

  return {
    place,

    /** Place sections in document order: { id: offset } or [[el, offset], …]. */
    placeAll(entries, blockSize = 200) {
      const pairs = Array.isArray(entries) ? entries : Object.entries(entries);
      for (const [target, top] of pairs) {
        const el = typeof target === "string" ? document.getElementById(target) : target;
        if (el) place(el, top, blockSize);
      }
    },

    /** Scroll the root, then let the throttled handler run. */
    async scrollTo(value) {
      scrollTop = value;
      (root ?? window).dispatchEvent(new Event("scroll"));
      await nextFrame();
    },

    /** Scroll to the very end of the scrollable content. */
    scrollToEnd() {
      return this.scrollTo(scrollHeight - viewport);
    },

    /** Change the visible height, then let the resize handler run. */
    async resize(next) {
      viewport = next;
      window.dispatchEvent(new Event("resize"));
      await nextFrame();
    },
  };
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
