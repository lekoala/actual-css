/*
 * Status — singleton floating status bar.
 *
 * A status bar is a transient, non-critical feedback area. Keep one element in
 * the HTML, empty by default; JavaScript only updates its text content. It is
 * hidden visually when empty but stays available as a live region.
 *
 * Importing the module auto-wires it to Actual's validation: a form that fails
 * to submit shows its data-validation-message in the status bar. The bar is a
 * view, not a validation mechanism, so validation and status stay decoupled.
 *
 *   import "actual-css/js/status";
 *
 * Three ways to trigger it, all funneling through the same `actual:status`
 * event so any of them can be observed the same way:
 *
 *   - Programmatic (bundlers, third-party code): `import { status } from
 *     "actual-css/js/status"`, then `status()` / `status.clear()`.
 *   - Declarative, no JS required beyond the runtime:
 *     <button commandfor="app-status" command="--status"
 *             data-status-message="Saved." data-status-intent="success">
 *     <button commandfor="app-status" command="--status-clear">
 *     (the status bar element itself needs the matching `id="app-status"`.)
 *   - Any other code, without importing this module: dispatch `actual:status`
 *     directly — `detail: { message, intent, duration }`, or `{}` to clear.
 *
 * The element contract is `[data-status][role="status"]`. Both are required:
 * "status" is a generic domain word, so `role="status"` keeps the
 * document-wide lookup from matching an unrelated app element that happens to
 * carry its own `data-status`. `intent` is applied verbatim as one or more
 * classes on the target (space-separated for more than one, e.g. "danger
 * uppercase"). status.js does not know or validate any specific names —
 * .danger, .success, and friends are Actual's own intents.css vocabulary, not
 * something this module hardcodes. Each call removes the intent classes the
 * previous call added (tracked in data-status-classes on the target itself),
 * then adds the current call's, so stale intent classes never accumulate and
 * classes the app added independently are left alone.
 */

import { registerCommands, targetFor } from "./command.js";
import { EVENTS } from "./events.js";

const STATUS_SELECTOR = '[data-status][role="status"]';
const STATUS_CLASSES_ATTR = "statusClasses";

let statusTimer;

function statusTarget() {
  if (typeof document === "undefined") return null;
  return document.querySelector(STATUS_SELECTOR);
}

function intentClasses(value) {
  return typeof value === "string" ? value.trim().split(/\s+/).filter(Boolean) : [];
}

function clearIntentClasses(target) {
  const previous = target.dataset[STATUS_CLASSES_ATTR];
  if (previous) {
    target.classList.remove(...previous.split(" "));
  }
  delete target.dataset[STATUS_CLASSES_ATTR];
}

export function status(message, options = {}) {
  const target = statusTarget();
  if (!target || message == null) return;

  clearTimeout(statusTimer);

  clearIntentClasses(target);
  const intent = intentClasses(options.intent);
  if (intent.length) {
    target.classList.add(...intent);
    target.dataset[STATUS_CLASSES_ATTR] = intent.join(" ");
  }

  target.textContent = message;

  if (options.duration !== false) {
    statusTimer = setTimeout(() => status.clear(), options.duration ?? 3000);
  }
}

status.clear = function clear() {
  const target = statusTarget();
  if (target) {
    target.textContent = "";
    clearIntentClasses(target);
  }
  clearTimeout(statusTimer);
};

const STATUS_SHOW_COMMANDS = ["--status"];
const STATUS_CLEAR_COMMANDS = ["--status-clear"];

function dispatchStatusEvent(source, detail) {
  source.dispatchEvent(new CustomEvent(EVENTS.status, { bubbles: true, detail }));
}

function readDuration(trigger) {
  const raw = trigger.getAttribute("data-status-duration");
  if (raw === null) return undefined;
  if (raw === "false") return false;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveStatusTrigger(trigger) {
  const target = targetFor(trigger);
  return target && target === statusTarget() ? target : null;
}

function connectStatusTrigger(trigger, target) {
  trigger.setAttribute("aria-controls", target.id);
}

if (typeof document !== "undefined") {
  document.addEventListener(EVENTS.invalid, (event) => {
    const message = event.detail?.message;
    if (message) status(message, { intent: "danger" });
  });

  // Public contract: any code can trigger the status bar this way, without
  // importing this module. A message shows it; omitting one clears it.
  document.addEventListener(EVENTS.status, (event) => {
    const { message, intent, duration } = event.detail ?? {};
    if (message) {
      status(message, { intent, duration });
    } else {
      status.clear();
    }
  });

  registerCommands(STATUS_SHOW_COMMANDS, {
    resolve: resolveStatusTrigger,
    prepare: connectStatusTrigger,
    handle: (event, trigger) => {
      event.preventDefault();
      dispatchStatusEvent(trigger, {
        message: trigger.getAttribute("data-status-message"),
        intent: trigger.getAttribute("data-status-intent") ?? undefined,
        duration: readDuration(trigger),
      });
    },
  });

  registerCommands(STATUS_CLEAR_COMMANDS, {
    resolve: resolveStatusTrigger,
    prepare: connectStatusTrigger,
    handle: (event, trigger) => {
      event.preventDefault();
      dispatchStatusEvent(trigger, {});
    },
  });
}

export default status;
