/*
 * In view — one-shot appearance trigger for reveal-style effects.
 *
 * Docs: docs/pages/components/reveal.md
 *
 * The runtime knows no animation. It marks an element `is-pending` while it
 * waits outside the viewport and removes the class the first time it enters.
 * Each effect's CSS decides what that state looks like, exactly as `is-open`
 * lets flyout.css own the panel's presentation.
 *
 * `is-pending` is written only after the observer's first callback reports the
 * element outside the viewport. An element visible at load therefore never
 * flickers: it is never hidden, and it never plays an entrance animation. The
 * first callback runs before the next paint, so an off-screen element is
 * masked before a scroll can expose it.
 *
 * A pending element keeps its text in the accessibility tree and in the tab
 * order; effects hide it with opacity alone. `focusin` releases it at once, so
 * keyboard focus never lands on invisible content, and reveal.css drops the
 * transition under :focus-within for the same reason. In-page find still
 * matches the text, because nothing is removed from the layer.
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

function reveal(record) {
  if (record.done) return;
  record.done = true;
  record.element.classList.remove(CLASSES.pending);
  record.initialObserver.unobserve(record.element);
  record.observer.unobserve(record.element);
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
    controller: new AbortController(),
  };
  records.set(element, record);

  // Focus may already sit inside the element before this registration (an
  // autofocused control, a second runtime copy attaching late). Hiding it then
  // would leave focus invisible until the observer's first callback.
  if (element.contains(element.ownerDocument.activeElement)) {
    reveal(record);
    return () => cleanup(record, records);
  }

  // Focus moves the page first, so this is the guarantee, not the observer:
  // the element is visible by the time its descendant takes focus.
  element.addEventListener("focusin", () => reveal(record), {
    signal: record.controller.signal,
  });
  observer.observe(element);

  return () => cleanup(record, records);
}

registerEnhancement("in-view", connect);
