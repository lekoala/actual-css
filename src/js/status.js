/*
 * Status — singleton floating status bar.
 *
 * A status bar is a transient, non-critical feedback area. Keep one element in
 * the HTML, empty by default; JavaScript writes its text content and toggles
 * the shared `.is-open` state class, which is the visual state the CSS
 * animates. The element itself is never hidden, so it stays a live region.
 *
 * Showing and clearing are asymmetric on purpose. A show writes content first
 * and opens after; a clear only closes, and empties content and intent once the
 * exit transition has finished, so the bar leaves in the state it was shown in
 * rather than collapsing to a neutral empty pill mid-animation. An empty
 * message is a clear, not a blank pill.
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
 * A message originating inside an open dialog temporarily mounts the singleton
 * bar in that dialog. Content outside a modal dialog is inert and cannot sit
 * above its top layer, so this keeps both the visual feedback and live region
 * in the active subtree. Programmatic callers pass the originating element as
 * `options.source`; event and command entry points propagate it automatically.
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
import { CLASSES } from "./selectors.js";
import { waitForTransitions } from "./transition.js";

const STATUS_SELECTOR = '[data-status][role="status"]';
const STATUS_CLASSES_ATTR = "statusClasses";
const VIEWPORT_OFFSET_PROPERTY = "--status-viewport-offset";

let statusTimer;
// Bumped by every show and every clear. A deferred exit cleanup only runs when
// its own generation is still current, so a message that arrives mid-exit is
// never emptied by the previous message's cleanup.
let statusGeneration = 0;
let viewportTracker = null;
const statusHomes = new WeakMap();

function statusTarget() {
  if (typeof document === "undefined") return null;
  return document.querySelector(STATUS_SELECTOR);
}

function restoreStatusTarget(target) {
  const home = statusHomes.get(target);
  if (!home) return;

  const parent = home.parent?.isConnected ? home.parent : target.ownerDocument?.body;
  if (parent) {
    const reference = home.nextSibling?.parentNode === parent ? home.nextSibling : null;
    parent.insertBefore(target, reference);
  }
  statusHomes.delete(target);
}

function mountStatusTarget(target, source) {
  const dialog = source?.closest?.("dialog[open]");
  if (!dialog || dialog.ownerDocument !== target.ownerDocument) {
    restoreStatusTarget(target);
    return;
  }
  if (dialog.contains(target)) return;

  if (!statusHomes.has(target)) {
    statusHomes.set(target, { parent: target.parentNode, nextSibling: target.nextSibling });
  }
  dialog.append(target);
}

// The bar is fixed to the layout viewport, so the mobile software keyboard
// covers it. visualViewport reports the occluded band; the CSS adds it to the
// bottom inset. Tracking runs only while a message is on screen.
function trackViewport(target) {
  if (viewportTracker?.target === target) return;
  releaseViewport();

  const view = target.ownerDocument?.defaultView;
  const viewport = view?.visualViewport;
  if (!viewport) return;

  const controller = new AbortController();
  const update = () => {
    // Self-heal: an app that drops the bar while a message is up never reaches
    // the clear() path, so the tracker would outlive its element.
    if (!target.isConnected) {
      releaseViewport();
      return;
    }
    const occluded = Math.max(0, view.innerHeight - viewport.height - viewport.offsetTop);
    target.style.setProperty(VIEWPORT_OFFSET_PROPERTY, `${occluded}px`);
  };

  viewport.addEventListener("resize", update, { signal: controller.signal });
  viewport.addEventListener("scroll", update, { signal: controller.signal });
  update();

  viewportTracker = { target, stop: () => controller.abort() };
}

function releaseViewport() {
  if (!viewportTracker) return;
  viewportTracker.stop();
  viewportTracker.target.style.removeProperty(VIEWPORT_OFFSET_PROPERTY);
  viewportTracker = null;
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

  // A live region with nothing to announce is not a message. `:empty` used to
  // absorb this case for free; now that the open state is explicit, an empty
  // message has to mean "close" or it would open a blank pill. This also keeps
  // status(await response.text()) from leaving a stale message on screen.
  if (message === "") {
    status.clear();
    return;
  }

  clearTimeout(statusTimer);
  statusGeneration++;

  mountStatusTarget(target, options.source);

  clearIntentClasses(target);
  const intent = intentClasses(options.intent);
  if (intent.length) {
    target.classList.add(...intent);
    target.dataset[STATUS_CLASSES_ATTR] = intent.join(" ");
  }

  // Content and intent are in place before the bar opens, so it enters at its
  // final size and color.
  target.textContent = message;
  target.classList.add(CLASSES.open);
  trackViewport(target);

  if (options.duration !== false) {
    statusTimer = setTimeout(() => status.clear(), options.duration ?? 3000);
  }
}

status.clear = function clear() {
  clearTimeout(statusTimer);

  const target = statusTarget();
  if (!target) {
    // No bar to animate out — but one may have been removed while open, and its
    // viewport listeners and element reference still have to go.
    releaseViewport();
    return;
  }

  const generation = ++statusGeneration;
  target.classList.remove(CLASSES.open);

  waitForTransitions(target).then(() => {
    // A show during the exit owns the bar now; leave its message alone.
    if (generation !== statusGeneration) return;
    target.textContent = "";
    clearIntentClasses(target);
    releaseViewport();
    restoreStatusTarget(target);
  });
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
    if (message) status(message, { intent: "danger", source: event.target });
  });

  // Public contract: any code can trigger the status bar this way, without
  // importing this module. A message shows it; omitting one clears it.
  document.addEventListener(EVENTS.status, (event) => {
    const { message, intent, duration } = event.detail ?? {};
    // An absent message clears here; "" reaches status() and closes there. Both
    // paths end in the same exit, so a detail that lost its message never
    // strands a stale one on screen.
    if (message != null) {
      status(message, { intent, duration, source: event.target });
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
