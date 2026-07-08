/*
 * Command — shared plumbing for command/commandfor invoker triggers.
 *
 * Any element can act as an invoker via `commandfor="target-id" command="name"`.
 * Every module built on this pattern (dialog, status, …) needs the same
 * three things: resolve the commandfor target by id, wire the trigger's
 * click through enhance()'s connect/disconnect lifecycle, and re-attempt
 * that wiring later when the target arrives after the trigger did. This
 * module is that shared plumbing; each caller supplies only what is
 * specific to it — target validation, one-time wiring, and the click
 * behavior itself.
 *
 *   import { commandTrigger } from "./command.js";
 *
 *   const triggers = commandTrigger('button[commandfor][command="--foo"]', {
 *     resolve: (trigger) => targetFor(trigger),   // element or null
 *     connect: (trigger, target) => {...},        // optional, runs once
 *     click: (event, trigger, target) => {...},
 *   });
 *
 * `triggers.connectOne(trigger)` re-runs the same wiring outside of
 * enhance()'s own scan — needed when a late-inserted target should retry
 * triggers that already scanned as unresolved (enhance() never re-invokes an
 * enhancer for an element it has already matched against that selector).
 */
import enhance from "./enhance.js";

export function targetFor(trigger) {
  const id = trigger.getAttribute("commandfor");
  return id ? trigger.ownerDocument.getElementById(id) : null;
}

export function commandTrigger(selector, { resolve = targetFor, connect, click }) {
  const wired = new WeakMap();

  function handleClick(event) {
    const state = wired.get(event.currentTarget);
    if (state) click(event, event.currentTarget, state.target);
  }

  function connectOne(trigger) {
    if (wired.has(trigger)) return;

    const target = resolve(trigger);
    if (!target) return;

    const controller = new AbortController();
    wired.set(trigger, { target, controller });
    connect?.(trigger, target);
    trigger.addEventListener("click", handleClick, { signal: controller.signal });
  }

  function disconnectOne(trigger) {
    const state = wired.get(trigger);
    if (!state) return;

    state.controller.abort();
    wired.delete(trigger);
  }

  const runtime = enhance({
    [selector]: (trigger) => {
      connectOne(trigger);
      return () => disconnectOne(trigger);
    },
  });

  return { ...runtime, connectOne };
}
