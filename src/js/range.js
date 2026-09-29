/*
 * Range — fill share and named-value semantics for range inputs.
 *
 * The `range` enhancement token is the opt-in; it stays independent from
 * the `.range` presentation class:
 *
 *   <input class="range" data-enhance="range" type="range" min="0" max="100">
 *
 * Every opted-in input gets `--range-progress`, the fill share the track
 * gradient in range.css reads. Without this module the variable stays at
 * its `0%` default and the track renders plain — the control is fully
 * usable, only unfilled.
 *
 * When the input references a datalist whose option carries a `label`, the
 * module also sets `aria-valuetext` (the announced value when the numeric
 * value really means a text, e.g. `2` means "High") and mirrors the label
 * into each associated `<output for="…">`. Those writes are owned: when a
 * later value has no label, the module restores the pre-existing
 * `aria-valuetext` (or removes the attribute if it was absent) and each
 * output's original text — but only where the current value is still the
 * module's own last write, so author state is never destroyed.
 * Options without a label leave author-written `aria-valuetext` and outputs
 * untouched.
 *
 *   <output for="effort">High</output>
 *   <input data-enhance="range" type="range" id="effort" min="0" max="3" list="effort-levels" aria-label="Effort">
 */

import { registerEnhancement } from "./enhance.js";

const RANGE_SELECTOR = 'input[type="range"]';

// Writes this module owns per input: for the valuetext and each output,
// the value before the first write (original) and the last value written
// (last). A later unlabeled value restores an entry only when its current
// value is still the module's last write — author state, whether present
// from the start or written since, is never destroyed. Entries live on the
// node, not the tree, so a disconnected output is still restored.
const owned = new WeakMap();

function toFinite(value, fallback) {
  // Absent min/max read back as "" (Number("") is 0, not missing).
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function labelFor(input) {
  const listId = input.getAttribute("list");
  if (!listId) return undefined;
  const list = input.getRootNode().getElementById?.(listId);
  if (!list) return undefined;
  const option = [...(list.options ?? [])].find((entry) => entry.value === input.value);
  const label = option?.label ?? option?.getAttribute?.("label") ?? "";
  return label ? label : undefined;
}

function outputsFor(input) {
  if (!input.id) return [];
  const root = input.getRootNode();
  if (typeof root.querySelectorAll !== "function") return [];
  return [...root.querySelectorAll(`output[for~="${CSS.escape(input.id)}"]`)];
}

function syncRange(input) {
  const min = toFinite(input.min, 0);
  const max = toFinite(input.max, 100);
  const value = toFinite(input.value, min);
  const share = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const clamped = Math.min(100, Math.max(0, share));
  input.style.setProperty("--range-progress", `${clamped}%`);

  const label = labelFor(input);
  if (label === undefined) {
    releaseOwned(input);
    return;
  }
  const record = owned.get(input) ?? { aria: null, outputs: new Map() };
  if (!record.aria) {
    record.aria = { original: input.getAttribute("aria-valuetext"), last: label };
  } else {
    record.aria.last = label;
  }
  input.setAttribute("aria-valuetext", label);
  for (const output of outputsFor(input)) {
    const entry = record.outputs.get(output) ?? { original: output.textContent, last: label };
    entry.last = label;
    record.outputs.set(output, entry);
    output.textContent = label;
  }
  owned.set(input, record);
}

function releaseOwned(input) {
  const record = owned.get(input);
  if (!record) return;
  // Restore only what this module wrote: an author may have set its own
  // value since, and that state is not ours to destroy. A null original
  // means the attribute was absent before the first write.
  if (record.aria && input.getAttribute("aria-valuetext") === record.aria.last) {
    if (record.aria.original === null) {
      input.removeAttribute("aria-valuetext");
    } else {
      input.setAttribute("aria-valuetext", record.aria.original);
    }
  }
  for (const [output, entry] of record.outputs) {
    if (output.textContent === entry.last) output.textContent = entry.original;
  }
  owned.delete(input);
}

// Private on purpose: `owned` holds one record per input, so a second,
// independent connection would restore and drop state the enhancement still
// owns. The lifecycle is the only caller. A programmatic value change goes
// through dispatchInput() from ./input.js, which every listener sees.
function connectRange(input) {
  const controller = new AbortController();
  syncRange(input);
  input.addEventListener("input", () => syncRange(input), {
    signal: controller.signal,
  });
  // Listen on the root so form="…" and moves between forms keep working.
  input.getRootNode().addEventListener(
    "reset",
    (event) => {
      if (event.target !== input.form) return;
      // Reset fires before native values change. A new task also lets later
      // listeners cancel it; a microtask can run before the native reset.
      setTimeout(() => {
        if (
          !controller.signal.aborted &&
          !event.defaultPrevented &&
          input.isConnected &&
          input.form === event.target
        ) {
          syncRange(input);
        }
      }, 0);
    },
    { capture: true, signal: controller.signal },
  );
  return () => {
    releaseOwned(input);
    controller.abort();
  };
}

registerEnhancement("range", (input) =>
  input.matches(RANGE_SELECTOR) ? connectRange(input) : undefined,
);
