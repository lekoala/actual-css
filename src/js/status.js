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
 */
import { commandTrigger, targetFor } from "./command.js";
import enhance from "./enhance.js";

const INTENTS = ["neutral", "success", "danger", "warning"];

let statusTimer;

function statusTarget() {
  if (typeof document === "undefined") return null;
  return (
    document.querySelector("[data-status]") ||
    document.querySelector(".status-bar")
  );
}

export function status(message, options = {}) {
  const target = statusTarget();
  if (!target || message == null) return;

  clearTimeout(statusTimer);

  for (const intent of INTENTS) {
    target.classList.remove(intent);
  }
  if (INTENTS.includes(options.intent)) {
    target.classList.add(options.intent);
  }

  target.textContent = message;

  if (options.duration !== false) {
    statusTimer = setTimeout(() => status.clear(), options.duration ?? 3000);
  }
}

status.clear = function clear() {
  const target = statusTarget();
  if (target) target.textContent = "";
  clearTimeout(statusTimer);
};

const STATUS_SHOW_SELECTOR = 'button[commandfor][command="--status"]';
const STATUS_CLEAR_SELECTOR = 'button[commandfor][command="--status-clear"]';
let statusShowTriggers;
let statusClearTriggers;

function dispatchStatusEvent(source, detail) {
  source.dispatchEvent(new CustomEvent("actual:status", { bubbles: true, detail }));
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

function connectStatusTarget(target) {
  if (!target.id) return;
  const triggers = target.ownerDocument.querySelectorAll(
    `button[commandfor="${CSS.escape(target.id)}"][command^="--status"]`,
  );
  for (const trigger of triggers) {
    statusShowTriggers.connectOne(trigger);
    statusClearTriggers.connectOne(trigger);
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("actual:invalid", (event) => {
    const message = event.detail?.message;
    if (message) status(message, { intent: "danger" });
  });

  // Public contract: any code can trigger the status bar this way, without
  // importing this module. A message shows it; omitting one clears it.
  document.addEventListener("actual:status", (event) => {
    const { message, intent, duration } = event.detail ?? {};
    if (message) {
      status(message, { intent, duration });
    } else {
      status.clear();
    }
  });

  statusShowTriggers = commandTrigger(STATUS_SHOW_SELECTOR, {
    resolve: resolveStatusTrigger,
    connect: connectStatusTrigger,
    click: (event, trigger) => {
      event.preventDefault();
      dispatchStatusEvent(trigger, {
        message: trigger.getAttribute("data-status-message"),
        intent: trigger.getAttribute("data-status-intent") ?? undefined,
        duration: readDuration(trigger),
      });
    },
  });

  statusClearTriggers = commandTrigger(STATUS_CLEAR_SELECTOR, {
    resolve: resolveStatusTrigger,
    connect: connectStatusTrigger,
    click: (event, trigger) => {
      event.preventDefault();
      dispatchStatusEvent(trigger, {});
    },
  });

  enhance({
    "[data-status], .status-bar": (target) => connectStatusTarget(target),
  });
}

export default status;
