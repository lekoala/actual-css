/*
 * Selectors — the state-class vocabulary the runtime writes.
 *
 * The file lists the class names modules write as state (is-open,
 * was-validated, …) and the classes they only read as presentation adapters:
 * validation's field and fieldError, status's formActions + sticky pair.
 * Behavior discovery is not listed here: it uses
 * data-enhance tokens. To run this runtime against a different CSS
 * framework, edit this file (or alias it in a bundler).
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
  // status.js — read-side presentation adapter, first half of the compound
  // .form-actions.sticky: the docked action bar the status bar rises above
  // instead of covering its submit button.
  formActions: "form-actions",
  // status.js — read-side presentation adapter, second half of the same
  // compound. Read only, never written: the runtime sets no sticky state.
  sticky: "sticky",
  // surface.js — state class on the open flyout/menu/dialog surface.
  // status.js writes the same class on the status bar while a message shows.
  open: "is-open",
  // in-view.js — transient state on an element that waits outside the viewport
  // for its first appearance. Each effect's CSS decides how to hide it.
  pending: "is-pending",
  // dialog.js — transient class for the "can't dismiss" shake animation.
  static: "is-static",
  // dialog.js — written on <html> while any modal dialog is open.
  modalOpen: "has-modal-open",
  // dialog.js — written on <html> when the viewport had a classic scrollbar
  // before the first modal lock.
  hadScrollbar: "had-scrollbar",
  // tooltip.js — class name written on a shorthand-generated tooltip element.
  tooltip: "tooltip",
};
