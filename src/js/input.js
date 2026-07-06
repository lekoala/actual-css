/*
 * Input helpers shared by text-entry enhancers.
 */

export function selectionStart(el) {
  return typeof el.selectionStart === "number" ? el.selectionStart : el.value.length;
}

export function setCaret(el, position) {
  if (document.activeElement !== el) return;
  if (typeof el.setSelectionRange !== "function") return;
  try {
    el.setSelectionRange(position, position);
  } catch {
    // Some input types do not support text selection.
  }
}

export function dispatchInput(el) {
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

export function onTextInput(el, handler, signal) {
  let composing = false;

  function run(event) {
    if (composing || event.isComposing) return;
    handler(event);
  }

  el.addEventListener("compositionstart", () => {
    composing = true;
  }, { signal });
  el.addEventListener("compositionend", (event) => {
    composing = false;
    run(event);
  }, { signal });
  el.addEventListener("input", run, { signal });
}
