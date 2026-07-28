/*
 * Selectors — the state-class vocabulary the runtime writes.
 *
 * This file no longer lists discovery selectors: behavior discovery moved
 * to data-enhance tokens in 0.2. What remains are the class names modules
 * write as state (is-open, was-validated, …) and validation's two read-side
 * presentation adapters (field, fieldError). To run this runtime against a
 * different CSS framework, edit this file (or alias it in a bundler).
 *
 * data-* attributes and ARIA are not listed: they are each module's own
 * behavior API, not CSS vocabulary, so they stay framework-neutral by
 * construction and never need remapping.
 */

export const CLASSES = {
  // validation.js — written on <form> after the first submit attempt.
  wasValidated: "was-validated",
  // validation.js — intents.css vocabulary class toggled on the field
  // container while any control inside it is invalid.
  danger: "danger",
  // validation.js — read-side presentation adapter: error slot among
  // aria-describedby targets. [data-field-error] is an accepted alias (D6).
  fieldError: "field-error",
  // validation.js — read-side presentation adapter: ancestor container
  // for aria-invalid/danger state. Optional — degrades to no-op.
  field: "field",
  // surface.js — state class on the open flyout/menu/dialog surface.
  open: "is-open",
  // surface.js — state class while the surface renders as a mobile sheet.
  sheet: "is-sheet",
  // surface.js — class name written on the generated sheet backdrop.
  backdrop: "surface-backdrop",
  // dialog.js — transient class for the "can't dismiss" shake animation.
  static: "is-static",
  // dialog-fallback.js — marker written on a dialog controlled by the legacy
  // shim (browsers without native <dialog>); dialog-fallback.css keys its
  // emulated dialog presentation on it.
  dialogFallback: "dialog-fallback",
  // dialog-fallback.js — state class on a shimmed dialog while it is open as
  // a modal; carries the fixed positioning and simulated backdrop.
  fallbackModal: "is-fallback-modal",
  // dialog.js — written on <html> while any modal dialog is open.
  modalOpen: "has-modal-open",
  // dialog.js — written on <html> when the viewport had a classic scrollbar
  // before the first modal lock.
  hadScrollbar: "had-scrollbar",
  // tooltip.js — class name written on a shorthand-generated tooltip element.
  tooltip: "tooltip",
};
