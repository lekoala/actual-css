/*
 * Command — shared plumbing for command/commandfor invoker triggers.
 *
 * Any element can act as an invoker via `commandfor="target-id" command="name"`.
 * Every module built on this pattern (dialog, status, …) needs the same
 * three things: resolve the commandfor target by id, wire one-time connect
 * semantics (aria-controls, etc.) through enhance()'s lifecycle, and react to
 * clicks. This module is that shared plumbing; each caller supplies only
 * what is specific to it — target validation, one-time wiring, and the click
 * behavior itself.
 *
 *   import { commandTrigger } from "./command.js";
 *
 *   const triggers = commandTrigger(["--foo"], {
 *     resolve: (trigger) => targetFor(trigger),   // element or null
 *     connect: (trigger, target) => {...},        // optional, runs once
 *     click: (event, trigger, target) => {...},
 *   });
 *
 * Clicks are handled by a single delegated listener shared across every
 * commandTrigger() call, not one listener per trigger — cheap to keep
 * around regardless of how many invokers a page ends up with. A click only
 * does something if its trigger is already connected (registered in this
 * call's WeakMap), so the listener stays a no-op for every command it
 * doesn't own.
 *
 * `triggers.connectOne(trigger)` re-runs the connect step outside of
 * enhance()'s own scan — needed when a late-inserted target should retry
 * triggers that already scanned as unresolved (enhance() never re-invokes an
 * enhancer for an element it has already matched against that selector).
 */
import enhance from "./enhance.js";

export function targetFor(trigger) {
  const id = trigger.getAttribute("commandfor");
  return id ? trigger.ownerDocument.getElementById(id) : null;
}

export function commandSelector(commands) {
  const names = Array.isArray(commands) ? commands : [commands];
  if (!names.length || names.some((name) => typeof name !== "string" || !name)) {
    throw new TypeError("commandTrigger() requires one or more command names.");
  }
  const attributes = names.map(
    (name) => `[command="${name.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"]`,
  );
  return `button[commandfor]:is(${attributes.join(", ")})`;
}

const registrations = [];
// Keyed by document, not a plain once-ever flag: `document` is stable for a
// real page's lifetime, so this only ever runs once there, but test harnesses
// swap in a fresh document per test and each one needs its own listener.
const delegatedDocuments = new WeakSet();

function delegateClicks() {
  if (typeof document === "undefined" || delegatedDocuments.has(document)) return;
  delegatedDocuments.add(document);

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const trigger = event.target.closest("[commandfor][command]");
    if (!trigger) return;

    for (const { wired, resolve, connect, click } of registrations) {
      let target = wired.get(trigger);
      if (target !== undefined) {
        if (!target?.isConnected) {
          target = resolve(trigger);
          if (!target) continue;
          wired.set(trigger, target);
          connect?.(trigger, target);
        }
        click(event, trigger, target);
        return;
      }
    }
  });
}

export function commandTrigger(commands, { resolve = targetFor, connect, click }) {
  const selector = commandSelector(commands);
  const wired = new WeakMap();
  registrations.push({ wired, resolve, connect, click });
  delegateClicks();

  function connectOne(trigger) {
    if (wired.has(trigger)) return;

    const target = resolve(trigger);
    if (!target) return;

    wired.set(trigger, target);
    connect?.(trigger, target);
  }

  const runtime = enhance({
    [selector]: (trigger) => {
      connectOne(trigger);
      return () => wired.delete(trigger);
    },
  });

  return { ...runtime, connectOne };
}
