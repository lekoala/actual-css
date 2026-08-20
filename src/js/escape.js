/*
 * Per-document LIFO dismissal for transient UI that closes on Escape.
 * Consumers register only while visible, so the topmost dismissable UI owns
 * one key press and pinned or hidden UI never consumes it.
 */

const dismissableStacks = new WeakMap();

export function registerEscapeDismissal(element, dismiss) {
  const doc = element.ownerDocument;
  let stack = dismissableStacks.get(doc);
  if (!stack) {
    stack = [];
    dismissableStacks.set(doc, stack);
    doc.addEventListener("keydown", onDocumentEscape);
  }

  const entry = { element, dismiss };
  stack.push(entry);

  return () => {
    const index = stack.indexOf(entry);
    if (index >= 0) stack.splice(index, 1);
  };
}

function onDocumentEscape(event) {
  if (event.key !== "Escape" || event.ctrlKey || event.altKey || event.shiftKey) return;

  const stack = dismissableStacks.get(event.currentTarget);
  const entry = stack.at(-1);
  if (!entry) return;

  event.preventDefault();
  entry.dismiss({ restoreFocus: true });
}
