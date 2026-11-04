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
const DOCKED_ACTIONS_SELECTOR = `.${CLASSES.formActions}.${CLASSES.sticky}`;
const DEFAULT_DURATION_MS = 3000;

let statusTimer;
// Bumped by every show and every clear. A deferred exit cleanup only runs when
// its own generation is still current, so a message that arrives mid-exit is
// never emptied by the previous message's cleanup.
let statusGeneration = 0;
let viewportTracker = null;
const statusHomes = new WeakMap();
// Reference kept only while the bar is temporarily mounted in a dialog. If
// that dialog is removed from the DOM (htmx/Turbo swap), document lookup can
// no longer find the bar — this reference lets the next status()/clear()
// restore it to its home instead of silently no-opping forever.
let mountedStatusTarget = null;

function healDetachedStatusTarget() {
  if (!mountedStatusTarget || mountedStatusTarget.isConnected) return;
  if (!statusHomes.has(mountedStatusTarget)) {
    mountedStatusTarget = null;
    return;
  }
  restoreStatusTarget(mountedStatusTarget);
  mountedStatusTarget = null;
}

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
  if (mountedStatusTarget === target) mountedStatusTarget = null;
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
  mountedStatusTarget = target;
}

function dockedActionsBars(target) {
  const root = target.closest("dialog[open]") ?? target.ownerDocument;
  return root.querySelectorAll(DOCKED_ACTIONS_SELECTOR);
}

// A sticky action bar docks to the same bottom edge as the status bar. The
// validation docs pair the two, so an invalid submit would otherwise show its
// message on top of the submit button it is about. Any message is lifted, not
// only one from that form: the bar must not hide the page's primary actions
// whatever it says. A bar counts as docked when its bottom sits at its sticky
// offset from the visible bottom edge (above a bottom navigation, for one); a
// bar at rest higher up the page is not in the way. Detection assumes the
// bar's scrollport reaches the viewport bottom: a bar docked in a scroll
// container that ends higher (.app-main above an .app-nav row) is not seen.
function dockedActionsBand(target, view, visibleBottom) {
  let band = 0;
  for (const actions of dockedActionsBars(target)) {
    const rect = actions.getBoundingClientRect();
    const offset = Number.parseFloat(view.getComputedStyle(actions).bottom) || 0;
    if (rect.height > 0 && rect.top < visibleBottom && rect.bottom >= visibleBottom - offset - 1) {
      band = Math.max(band, visibleBottom - rect.top);
    }
  }
  return band;
}

// The bar is fixed to the layout viewport, so the mobile software keyboard
// covers it, and a docked sticky action bar sits where it would show.
// visualViewport reports the keyboard band; the docked bar's height is added on
// top; the CSS adds the sum to the bottom inset. Tracking runs only while a
// message is on screen.
function trackViewport(target) {
  if (viewportTracker?.target === target) return;
  releaseViewport();

  const view = target.ownerDocument?.defaultView;
  if (!view) return;
  const viewport = view.visualViewport;

  const controller = new AbortController();
  let frame = 0;
  let written = null;
  const update = () => {
    frame = 0;
    // Self-heal: an app that drops the bar while a message is up never reaches
    // the clear() path, so the tracker would outlive its element.
    if (!target.isConnected) {
      releaseViewport();
      return;
    }
    const keyboard = viewport
      ? Math.max(0, view.innerHeight - viewport.height - viewport.offsetTop)
      : 0;
    const docked = dockedActionsBand(target, view, view.innerHeight - keyboard);
    const value = `${keyboard + docked}px`;
    if (value === written) return;
    written = value;
    target.style.setProperty(VIEWPORT_OFFSET_PROPERTY, value);
  };
  // Scroll fires per frame and per scroll container; one layout read per frame
  // is enough.
  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(update);
  };

  // Installed before the first update, so a target already detached there is
  // released instead of leaving a tracker behind.
  const observer = view.ResizeObserver ? new view.ResizeObserver(schedule) : null;
  viewportTracker = {
    target,
    stop: () => {
      controller.abort();
      observer?.disconnect();
      if (frame) view.cancelAnimationFrame(frame);
    },
  };

  const options = { signal: controller.signal, passive: true };
  viewport?.addEventListener("resize", schedule, options);
  viewport?.addEventListener("scroll", schedule, options);
  // Scrolling docks and releases the action bar. Capture also hears the scroll
  // containers (.app-main) whose scroll events do not bubble.
  view.addEventListener("scroll", schedule, { ...options, capture: true });
  view.addEventListener("resize", schedule, options);
  // A docked bar can change height without any scroll: a wrapping button, a
  // spinner, an error line above the actions.
  for (const actions of dockedActionsBars(target)) observer?.observe(actions);
  update();
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
  healDetachedStatusTarget();
  const target = statusTarget();
  if (!target || message == null) return;

  // A live region with nothing to announce is not a message. The open state
  // is explicit, so an empty message has to mean "close" or it would open a
  // blank pill. This also keeps status(await response.text()) from leaving a
  // stale message on screen.
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
    statusTimer = setTimeout(() => status.clear(), options.duration ?? DEFAULT_DURATION_MS);
  }
}

status.clear = function clear() {
  clearTimeout(statusTimer);
  healDetachedStatusTarget();

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
    handle: (_event, trigger) => {
      dispatchStatusEvent(trigger, {
        message: trigger.getAttribute("data-status-message"),
        intent: trigger.getAttribute("data-status-intent") ?? undefined,
        duration: readDuration(trigger),
      });
    },
  });

  registerCommands(STATUS_CLEAR_COMMANDS, {
    resolve: resolveStatusTrigger,
    handle: (_event, trigger) => {
      dispatchStatusEvent(trigger, {});
    },
  });
}

export default status;
