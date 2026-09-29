/*
 * Command — stateless command/commandfor routing.
 *
 * The registry tracks command handlers, never triggers or targets. One click
 * listener per document reads the current DOM at event time, resolves the
 * current commandfor target, and routes the action. Newly inserted triggers,
 * late targets, changed commandfor values, and same-id replacements therefore
 * work immediately without an observer, scan, refresh call, or per-element
 * listener.
 *
 * A routed command cancels the click, so the browser never dispatches the
 * native `command` event to the target, and the router does not re-dispatch
 * one. Listen to the behavior's own events instead. Accessibility state that
 * must exist before interaction (`aria-controls`, `aria-haspopup`,
 * `aria-pressed`) belongs in the markup: the router has no connection step.
 */

/* One registry per document owns its delegated listener and command handlers.
 * The WeakMap does not retain discarded documents; registry entries contain
 * behavior definitions only, never DOM triggers or resolved targets. */
const registries = new WeakMap();

// The HTML `command` keywords. Any other value that does not start with "--"
// is the invalid state, which the browser ignores. Extend this list when HTML
// adds a keyword: registerCommands() throws on an unknown non-"--" name, so a
// stale list fails loudly instead of silently swallowing the new keyword.
// A future path that listens to the native `command` event instead of the
// click would need a per-tier matrix (native support varies) plus
// no-double-execution tests — the click stays the single routing event until
// then, which is why a routed command cancels it by design (see above).
const NATIVE_COMMANDS = new Set([
  "toggle-popover",
  "show-popover",
  "hide-popover",
  "close",
  "request-close",
  "show-modal",
]);

function isCustom(command) {
  return command.startsWith("--");
}

// Native command keywords are ASCII case-insensitive. Custom commands keep
// their exact spelling, as required by the command invoker contract.
function commandKey(command) {
  return isCustom(command) ? command : command.toLowerCase();
}

function commandNames(commands, caller) {
  const names = Array.isArray(commands) ? commands : [commands];
  if (!names.length || names.some((name) => typeof name !== "string")) {
    throw new TypeError(`${caller} requires one or more command names.`);
  }
  const invalid = names.find((name) => !isCustom(name) && !NATIVE_COMMANDS.has(commandKey(name)));
  if (invalid !== undefined) {
    throw new TypeError(
      `${caller}: "${invalid}" is neither a native command nor a custom "--" command.`,
    );
  }
  return [...new Set(names.map(commandKey))];
}

/**
 * Resolve a trigger's current `commandfor` target in the same document or
 * shadow root.
 *
 * @param {Element} trigger Element carrying the `commandfor` attribute.
 * @returns {Element | null} The current target, or `null` when it cannot be resolved.
 */
export function targetFor(trigger) {
  const id = trigger.getAttribute("commandfor");
  if (!id) return null;

  const root = trigger.getRootNode();
  return root.getElementById?.(id) ?? null;
}

/**
 * Build the button selector corresponding to one or more command names.
 *
 * Native keywords match case-insensitively, custom commands exactly — the
 * same rule the router applies.
 *
 * @param {string | string[]} commands Command name or names to include.
 * @returns {string} A selector matching command buttons with `commandfor`.
 * @throws {TypeError} When a name is neither native nor a custom `--` command.
 */
export function commandSelector(commands) {
  const attributes = commandNames(commands, "commandSelector()").map((name) => {
    const value = name.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
    return `[command="${value}"${isCustom(name) ? "" : " i"}]`;
  });
  return `button[commandfor]:is(${attributes.join(", ")})`;
}

function triggerFromEvent(event, doc) {
  for (const node of event.composedPath?.() ?? [event.target]) {
    // nodeType rather than instanceof: nodes from another realm still count.
    if (node.nodeType === 1 && node.matches("button[commandfor][command]")) {
      return node;
    }
    if (node === doc) break;
  }

  return null;
}

function createRegistry(doc) {
  const commands = new Map();

  function route(event) {
    if (event.defaultPrevented) return;

    const trigger = triggerFromEvent(event, doc);
    if (!trigger || trigger.matches(":disabled")) return;

    const command = commandKey(trigger.getAttribute("command"));
    const registration = commands.get(command);
    if (!registration) return;

    const target = registration.resolve(trigger);
    if (!target) return;

    // One routed command owns the click, even when the handler throws. This
    // is also what stops a second copy of this module, with its own registry
    // and listener, from handling the same activation.
    event.preventDefault();
    registration.handle(event, trigger, target, command);
  }

  doc.addEventListener("click", route);
  return { commands, route };
}

/**
 * Register one behavior for one or more command names.
 *
 * The router cancels the click once `resolve` returns a target, so `handle`
 * runs with `event.defaultPrevented` already true.
 *
 * @param {string | string[]} commands Command name or names owned by this behavior.
 * @param {object} options Behavior callbacks.
 * @param {(trigger: HTMLButtonElement) => Element | null} [options.resolve=targetFor]
 * Resolver evaluated for every action.
 * @param {(event: MouseEvent, trigger: HTMLButtonElement, target: Element, command: string) => void} options.handle
 * Command handler.
 * @returns {{ disconnect: () => void }} An idempotent registration teardown handle.
 * @throws {TypeError} When command names or callbacks are invalid.
 * @throws {Error} When a command already has an owner in the current document.
 */
export function registerCommands(commands, { resolve = targetFor, handle } = {}) {
  const names = commandNames(commands, "registerCommands()");
  if (typeof resolve !== "function" || typeof handle !== "function") {
    throw new TypeError("registerCommands() requires function callbacks.");
  }
  if (typeof document === "undefined") return { disconnect() {} };

  const doc = document;
  let registry = registries.get(doc);
  if (!registry) {
    registry = createRegistry(doc);
    registries.set(doc, registry);
  }

  const conflict = names.find((name) => registry.commands.has(name));
  if (conflict) {
    throw new Error(`Command "${conflict}" is already registered in this document.`);
  }

  const registration = { resolve, handle };
  for (const name of names) registry.commands.set(name, registration);

  let connected = true;
  return {
    disconnect() {
      if (!connected) return;
      connected = false;

      for (const name of names) {
        if (registry.commands.get(name) === registration) {
          registry.commands.delete(name);
        }
      }

      if (!registry.commands.size) {
        doc.removeEventListener("click", registry.route);
        registries.delete(doc);
      }
    },
  };
}
