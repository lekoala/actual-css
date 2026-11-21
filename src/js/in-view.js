/*
 * In view — one-shot appearance trigger for reveal-style effects.
 *
 * Docs: docs/pages/enhancements/in-view.md
 *
 * The runtime names no animation. It marks an element `is-pending` while it
 * waits outside the viewport and removes the class the first time it enters.
 * Each effect's CSS decides what that state looks like, exactly as `is-open`
 * lets flyout.css own the panel's presentation.
 *
 * `is-pending` is written only after the observer's first callback reports the
 * element outside the viewport. An element visible at load is therefore never
 * hidden by the runtime; whether it still enters is the effect's choice
 * (`.reveal` plays its keyframes on first render, `.mark-sweep` stays at
 * rest). The first callback runs before the next paint, so an off-screen
 * element is masked before a scroll can expose it.
 *
 * A pending element keeps its text in the accessibility tree and in the tab
 * order; effects hide it with opacity alone. `focusin` releases it at once and
 * finishes its entrance, also when the element was already released and the
 * entrance is still running or waiting out a delay, so keyboard focus never
 * lands on invisible or fading content. In-page find still matches the text,
 * because nothing is removed from the layer.
 *
 * One initial IntersectionObserver per document protects content already in
 * view. Optional data-in-view-margin values share additional observers for
 * the entrance itself, so delaying an entrance never hides visible content
 * at registration. Without IntersectionObserver nothing is hidden.
 *
 * No `actual:in-view` event yet. A numeric count-up associated with the same
 * trigger would need one; add it with that second consumer, not before.
 */
import { registerEnhancement } from "./enhance.js";
import { CLASSES } from "./selectors.js";

const documents = new WeakMap();

function observerFor(doc) {
  let connection = documents.get(doc);
  if (connection) return connection;

  // Records are keyed weakly by element; the observer holds only what it
  // observes, and every release path unobserves.
  const records = new WeakMap();
  const triggers = new Map();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const record = records.get(entry.target);
      if (!record || record.done) continue;
      if (entry.isIntersecting) reveal(record);
      else {
        entry.target.classList.add(CLASSES.pending);
        if (record.observer !== observer) {
          observer.unobserve(entry.target);
          record.observer.observe(entry.target);
        }
      }
    }
  });

  connection = { observer, records, triggers };
  documents.set(doc, connection);
  return connection;
}

function triggerFor(connection, margin) {
  if (!margin) return connection.observer;
  let observer = connection.triggers.get(margin);
  if (!observer) {
    // Resolve options before anything is hidden: an invalid rootMargin throws
    // through enhance.js's error reporting and leaves the content visible.
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const record = connection.records.get(entry.target);
          if (entry.isIntersecting && record) reveal(record);
        }
      },
      { rootMargin: margin },
    );
    connection.triggers.set(margin, observer);
  }
  return observer;
}

// Releasing the state also records the entrance it leaves running, so focus
// can finish it later. The entrance is what the release started, found by
// difference, plus what already runs on the element and its direct children:
// an element visible at load never goes pending and plays its first-render
// entrance instead. The runtime still names no effect, and a deeper component's
// own motion is left alone.
function reveal(record) {
  if (record.done) return;
  record.done = true;
  const { element } = record;
  const running = new Set(element.getAnimations({ subtree: true }));
  element.classList.remove(CLASSES.pending);
  record.initialObserver.unobserve(element);
  record.observer.unobserve(element);
  // getAnimations() flushes style, so the entrance released above is listed.
  record.entrance = element.getAnimations({ subtree: true }).filter((animation) => {
    const target = animation.effect?.target;
    const owned = target === element || target?.parentElement === element;
    // finish() throws on an animation that never ends.
    return (
      (owned || !running.has(animation)) &&
      animation.effect?.getComputedTiming().endTime !== Infinity
    );
  });
}

// Focus entered the element: the content must be usable on this frame, not at
// the end of an entrance, whether the element was pending, just released or
// still playing its first-render entrance. A CSS :focus-within override cannot
// do this: on blur the entrance resumes from its timeline, or replays.
function revealNow(record) {
  reveal(record);
  for (const animation of record.entrance) {
    if (animation.playState !== "finished") animation.finish();
  }
  record.entrance = [];
}

function cleanup(record, records) {
  record.controller.abort();
  record.initialObserver.unobserve(record.element);
  record.observer.unobserve(record.element);
  records.delete(record.element);
  record.element.classList.remove(CLASSES.pending);
}

function connect(element) {
  if (typeof IntersectionObserver === "undefined") return;

  const connection = observerFor(element.ownerDocument);
  const { observer, records } = connection;
  const record = {
    element,
    initialObserver: observer,
    observer: triggerFor(connection, element.getAttribute("data-in-view-margin")),
    done: false,
    entrance: [],
    controller: new AbortController(),
  };
  records.set(element, record);

  // Focus moves the page first, so this is the guarantee, not the observer:
  // the element is visible by the time its descendant takes focus. It stays
  // after the release, while the entrance may still run.
  element.addEventListener("focusin", () => revealNow(record), {
    signal: record.controller.signal,
  });

  // Focus may already sit inside the element before this registration (an
  // autofocused control, a second runtime copy attaching late). Hiding it then
  // would leave focus invisible until the observer's first callback.
  if (element.contains(element.ownerDocument.activeElement)) revealNow(record);
  else observer.observe(element);

  return () => cleanup(record, records);
}

registerEnhancement("in-view", connect);
