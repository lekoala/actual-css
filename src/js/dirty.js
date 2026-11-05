/*
 * Dirty — optional unsaved-changes tracking for forms.
 *
 * Opt in with data-enhance="dirty". The form carries data-dirty while the
 * data it would submit differs from its baseline, and dispatches
 * actual:dirty-change ({ form, dirty }) after each transition. The event
 * reports state; it cannot veto it.
 *
 * The module observes, it never submits and never guards navigation: the
 * transport (native, fetch, htmx, a library) decides when data is saved and
 * tells the module through FormDirty.markClean().
 *
 * Comparison runs on FormData, so it covers exactly what would be submitted:
 * disabled and unnamed controls do not count, form-associated controls
 * outside the <form> do. Controls marked data-dirty-ignore are left out by
 * name (CSRF tokens, computed fields).
 */

import { registerEnhancement } from "./enhance.js";
import { EVENTS } from "./events.js";

const ATTR = "data-dirty";
const IGNORE_ATTR = "data-dirty-ignore";

// Baselines outlive the enhancer instance on purpose: a form removed and
// reinserted keeps its baseline, so moving or re-parenting it does not
// silently mark unsaved edits as clean.
const baselines = new WeakMap();
const connected = new WeakSet();

function isFormElement(el) {
  return typeof HTMLFormElement !== "undefined" && el instanceof HTMLFormElement;
}

function ignoredNames(form) {
  const names = new Set();
  for (const el of form.elements) {
    if (el.hasAttribute(IGNORE_ATTR) && el.name) names.add(el.name);
  }
  return names;
}

// A file is compared by identity hints, not content: two different files with
// the same name, size and timestamp read as unchanged. An empty file input
// still yields an entry, whose lastModified is "now" — normalized so an
// untouched input stays clean.
function fileKey(file) {
  if (file.name === "" && file.size === 0) return [];
  return [file.name, file.size, file.lastModified];
}

/** Serializes the data the form would submit, in submission order. */
function capture(form) {
  const ignored = ignoredNames(form);
  const entries = [];
  for (const [name, value] of new FormData(form)) {
    if (ignored.has(name)) continue;
    entries.push([name, typeof value === "string" ? value : fileKey(value)]);
  }
  // JSON keeps names and values unambiguous: no separator a value can forge.
  return JSON.stringify(entries);
}

function refresh(form) {
  if (!connected.has(form)) return;
  const dirty = capture(form) !== baselines.get(form);
  if (dirty === form.hasAttribute(ATTR)) return;
  form.toggleAttribute(ATTR, dirty);
  form.dispatchEvent(
    new CustomEvent(EVENTS.dirtyChange, { bubbles: true, detail: { form, dirty } }),
  );
}

function connectForm(form) {
  if (!baselines.has(form)) baselines.set(form, capture(form));
  connected.add(form);

  const controller = new AbortController();
  const options = { signal: controller.signal };
  const update = () => refresh(form);
  const onEdit = (event) => {
    if (event.target.form === form) update();
  };

  // Listen on the root: a control associated through form="…" sits outside
  // the <form>, so its events never bubble through it.
  const root = form.getRootNode();
  root.addEventListener("input", onEdit, options);
  root.addEventListener("change", onEdit, options);
  // The reset event fires before the controls revert, and microtasks would
  // run between listeners of a user-initiated reset — still too early. A task
  // runs after the reset algorithm completes.
  form.addEventListener("reset", () => setTimeout(update), options);

  refresh(form);

  // Release listeners only: data-dirty and the baseline stay, like validation
  // state, so a reinserted form resumes where it was.
  return () => {
    controller.abort();
    connected.delete(form);
  };
}

// biome-ignore lint/complexity/noStaticOnlyClass: Stable public namespace, like FormValidator.
export class FormDirty {
  /**
   * Opaque snapshot of what the form would submit. Take it at submit time
   * and pass it to markClean() once that submission is saved, so edits
   * made during the request stay dirty.
   */
  static capture(form) {
    return capture(form);
  }

  /** Makes `snapshot` (default: current data) the new baseline. */
  static markClean(form, snapshot = capture(form)) {
    if (!isFormElement(form)) return;
    baselines.set(form, snapshot);
    refresh(form);
  }

  /** Re-evaluates after programmatic value changes or added controls. */
  static refresh(form) {
    if (isFormElement(form)) refresh(form);
  }
}

registerEnhancement("dirty", (el) => (isFormElement(el) ? connectForm(el) : undefined));
