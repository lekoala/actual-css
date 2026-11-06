/*
 * Dismiss command — the generic `--dismiss` action. Hides the resolved target
 * and emits the bubbling `actual:dismiss` event.
 *
 * Focus contract: when focus is inside the target (the usual case, a close
 * button in an alert), it moves to the next tab stop after the target, else to
 * the nearest ancestor with an explicit tabindex; with neither, the browser's
 * focus fixup applies. Focus outside the target is left alone, and so is focus
 * a listener of `actual:dismiss` placed itself (a surface restores its opener).
 */

import { registerCommands } from "./command.js";
import { EVENTS } from "./events.js";
import { isElementVisible, nextTabStop } from "./focus.js";

function focusSuccessor(target) {
  const next = nextTabStop(target);
  if (next) return next;
  const region = target.parentElement?.closest("[tabindex]");
  return region && isElementVisible(region) && !region.closest("[inert]") ? region : null;
}

registerCommands("--dismiss", {
  handle(_event, trigger, target) {
    const doc = target.ownerDocument;
    // Resolved before hiding: a browser may move focus as soon as the focused
    // element is hidden, so a check made afterwards would miss it, and the
    // successor search needs the target's descendants still visible to skip.
    const successor = target.contains(doc.activeElement) ? focusSuccessor(target) : null;
    target.hidden = true;
    target.dispatchEvent(
      new CustomEvent(EVENTS.dismiss, {
        bubbles: true,
        detail: { trigger },
      }),
    );
    // Only when focus is still stranded: in the hidden target, or dropped to
    // <body> by the browser. No scroll: the next Tab scrolls to the successor.
    const active = doc.activeElement;
    if (successor && (!active || active === doc.body || target.contains(active))) {
      successor.focus({ preventScroll: true });
    }
  },
});
