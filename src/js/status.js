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
 */

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

if (typeof document !== "undefined") {
  document.addEventListener("actual:invalid", (event) => {
    const message = event.detail?.message;
    if (message) status(message, { intent: "danger" });
  });
}

export default status;
