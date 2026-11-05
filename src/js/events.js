export const ACTUAL_EVENT_PREFIX = "actual";

export const EVENTS = {
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
  // Dispatched by a dirty-tracked form after data-dirty flips.
  // detail: { form, dirty }
  dirtyChange: `${ACTUAL_EVENT_PREFIX}:dirty-change`,
  // Dispatched by an ajax form when its request starts.
  // detail: { form, submitter }
  ajaxStart: `${ACTUAL_EVENT_PREFIX}:ajax-start`,
  // Dispatched by an ajax form with any HTTP response: after display, or
  // before navigating to a redirect. From the root when display replaced the
  // form.
  // detail: { form, submitter, response }
  ajaxResponse: `${ACTUAL_EVENT_PREFIX}:ajax-response`,
  // Dispatched by an ajax form when the request fails (network, CORS).
  // detail: { form, submitter, error }
  ajaxError: `${ACTUAL_EVENT_PREFIX}:ajax-error`,
  // Cancelable: dispatched by dialog.js before handling native cancel close.
  // detail: { dialog, sourceEvent }
  dialogCancel: `${ACTUAL_EVENT_PREFIX}:dialog-cancel`,
  // Dispatched after a command hides its target.
  // detail: { trigger }
  dismiss: `${ACTUAL_EVENT_PREFIX}:dismiss`,
};
