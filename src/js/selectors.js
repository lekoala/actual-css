/*
 * Selectors — the CSS class names this runtime looks for or writes, gathered
 * in one file.
 *
 * Every module that matches against or toggles one of Actual's own class
 * names imports its token from here instead of writing the string inline.
 * To run this runtime against a different CSS framework, edit this file (or
 * alias it in a bundler) — no other module needs to change.
 *
 * data-* attributes and ARIA are not listed: they are each module's own
 * behavior API, not CSS vocabulary, so they stay framework-neutral by
 * construction and never need remapping. A module with no entry here (see
 * status.js) has no CSS class dependency at all.
 */
export const CLASSES = {
  // flyout.js, context-menu.js — opt-in class on the panel/menu element.
  flyout: "flyout",
  // tab.js — opt-in class on the tablist element.
  tabs: "tabs",
  // scrollspy.js — opt-in class on the nav element.
  scrollspy: "scrollspy",
  // validation.js — opt-in class on the <form>.
  needsValidation: "needs-validation",
  // validation.js — written on <form> after the first submit attempt.
  wasValidated: "was-validated",
  // validation.js — read on the element an aria-describedby id resolves to.
  fieldError: "field-error",
  // validation.js — ancestor container searched for aria-invalid/danger state.
  field: "field",
  // validation.js — intents.css vocabulary class toggled on the field
  // container while any control inside it is invalid.
  danger: "danger",
  // surface.js — state class on the open flyout/menu/dialog surface.
  open: "is-open",
  // surface.js — state class while the surface renders as a mobile sheet.
  sheet: "is-sheet",
  // surface.js — class name written on the generated sheet backdrop.
  backdrop: "surface-backdrop",
  // dialog.js — transient class for the "can't dismiss" shake animation.
  static: "is-static",
  // dialog.js — written on <html> while any modal dialog is open.
  modalOpen: "has-modal-open",
  // dialog.js — written on <html> when the viewport had a classic scrollbar
  // before the first modal lock.
  hadScrollbar: "had-scrollbar",
  // tooltip.js — class name written on a shorthand-generated tooltip element.
  tooltip: "tooltip",
  // status.js — required alongside [data-status]. "status" is a common
  // domain word (order status, task status, …); the class keeps a
  // document-wide querySelector from matching an unrelated app element.
  statusBar: "status-bar",
};
