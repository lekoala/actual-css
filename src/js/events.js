export const ACTUAL_EVENT_PREFIX = "actual";

export const EVENTS = {
  reposition: `${ACTUAL_EVENT_PREFIX}:reposition`,
  hide: `${ACTUAL_EVENT_PREFIX}:hide`,
  outOfView: `${ACTUAL_EVENT_PREFIX}:out-of-view`,
  // Cancelable: dispatched by a surface before it opens.
  // detail: { surface, options }
  surfaceOpen: `${ACTUAL_EVENT_PREFIX}:surface-open`,
  // Cancelable: dispatched by a context target before its menu opens.
  // detail: { menu, context, origin, trigger }
  contextMenu: `${ACTUAL_EVENT_PREFIX}:context-menu`,
  // Dispatched to show or clear the singleton status bar.
  // detail: { message, intent, duration } (or {} to clear)
  status: `${ACTUAL_EVENT_PREFIX}:status`,
  // Dispatched by a form after validation blocks submission.
  // detail: { form, firstInvalid, message }
  invalid: `${ACTUAL_EVENT_PREFIX}:invalid`,
  // Cancelable: dispatched by dialog.js before handling native cancel close.
  // detail: { dialog, sourceEvent }
  dialogCancel: `${ACTUAL_EVENT_PREFIX}:dialog-cancel`,
};
