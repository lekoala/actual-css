/*
 * Command — stateless command/commandfor routing.
 *
 * The registry tracks command handlers, never triggers or targets. One click
 * listener per document reads the current DOM at event time, resolves the
 * current commandfor target, and routes the action. Newly inserted triggers,
 * late targets, changed commandfor values, and same-id replacements therefore
 * work immediately without an observer, scan, refresh call, or per-element
 * listener.
 */

const registries = new WeakMap();

function commandNames(commands, caller) {
  const names = Array.isArray(commands) ? commands : [commands];
  if (!names.length || names.some((name) => typeof name !== "string" || !name)) {
    throw new TypeError(`${caller} requires one or more command names.`);
  }
  return [...new Set(names)];
}

export function targetFor(trigger) {
  const id = trigger.getAttribute("commandfor");
  if (!id) return null;

  const root = trigger.getRootNode();
  return root.getElementById?.(id) ?? null;
}

export function commandSelector(commands) {
  const attributes = commandNames(commands, "commandSelector()").map(
    (name) => `[command="${name.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"]`,
  );
  return `button[commandfor]:is(${attributes.join(", ")})`;
}

function triggerFromEvent(event, doc) {
  const ElementClass = doc.defaultView?.Element;
  if (!ElementClass) return null;

  for (const node of event.composedPath?.() ?? [event.target]) {
    if (node instanceof ElementClass && node.matches("button[commandfor][command]")) {
      return node;
    }
    if (node === doc) break;
  }

  return null;
}

function createRegistry(doc) {
  const commands = new Map();

  function route(event) {
    const trigger = triggerFromEvent(event, doc);
    if (!trigger || trigger.disabled) return;

    const command = trigger.getAttribute("command");
    const registration = commands.get(command);
    if (!registration) return;

    const target = registration.resolve(trigger);
    if (!target) return;

    registration.prepare?.(trigger, target, command);
    registration.handle(event, trigger, target, command);
  }

  doc.addEventListener("click", route);
  return { commands, route };
}

/**
 * Register one behavior for one or more command names.
 *
 * `prepare`, when present, runs immediately before `handle` on every matching
 * action. It must be idempotent; it is useful for semantics derived from the
 * resolved target, without introducing a connection lifecycle.
 */
export function registerCommands(commands, { resolve = targetFor, prepare, handle } = {}) {
  const names = commandNames(commands, "registerCommands()");
  if (
    typeof resolve !== "function" ||
    (prepare !== undefined && typeof prepare !== "function") ||
    typeof handle !== "function"
  ) {
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

  const registration = { resolve, prepare, handle };
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
