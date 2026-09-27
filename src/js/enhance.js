/*
 * Enhance — DOM lifecycle engine for behavioral enhancers.
 *
 * One MutationObserver per root watches DOM insertions/removals and serves
 * every enhance() and registerEnhancement() record on that root, each with
 * its own teardown handle. A record pairs a discovery query with
 * selector-keyed initialisers: enhance() queries its own selectors; a named
 * enhancement keys `[data-enhance~="name"]` behind the shared
 * `[data-enhance]` query, so any number of named behaviors cost the root a
 * single discovery gate.
 *
 * Sweep (not removedNodes scanning) is the key design choice: it reasons
 * about final state after a batch, so a moved element (removed then
 * reinserted in the same batch) survives without a spurious disconnect.
 *
 * Attribute changes are intentionally not observed. The owner of a handle
 * calls refresh(node) after adding a behavior attribute to an
 * already-connected element; for a data-enhance token, applyEnhancement()
 * does it. The built-in data-* behaviors (mask, filter, context menu, …)
 * keep their handle private, so for them insert the element with the
 * attribute already set. Behavior attributes are setup-time contracts, not
 * live enable/disable switches.
 *
 * registerEnhancement() owns a name per root — a second registration for the
 * same name on the same root throws, and disconnect() releases ownership.
 * Third-party behaviors register exactly like built-in ones.
 *
 * See docs/design-notes/enhancement-contract.md.
 */

const registries = new WeakMap();
const ownedNames = new WeakMap();

// Node type constants as literals, not the realm's Node global, so nodes from
// another document/window compare correctly.
const ELEMENT_NODE = 1;
const DOCUMENT_NODE = 9;
const DOCUMENT_FRAGMENT_NODE = 11;

const ENHANCEMENT_NAME = /^[a-z][a-z0-9-]*$/;

function noopRuntime() {
  return {
    refresh() {},
    disconnect() {},
  };
}

function canScan(node) {
  return (
    node?.nodeType === ELEMENT_NODE ||
    node?.nodeType === DOCUMENT_NODE ||
    node?.nodeType === DOCUMENT_FRAGMENT_NODE
  );
}

function createRegistry(root) {
  const records = new Set();
  let discovery = "";

  function start(record, el) {
    let active = record.instances.get(el);
    for (const key of record.keys) {
      if (active?.has(key) || !el.matches(key)) continue;

      let cleanup;
      try {
        cleanup = record.enhancers[key](el);
      } catch (error) {
        console.error(`Enhancer "${key}" failed`, error);
        continue;
      }
      if (!active) {
        active = new Map();
        record.instances.set(el, active);
      }
      active.set(key, typeof cleanup === "function" ? cleanup : null);
    }
  }

  function stop(record, el) {
    for (const cleanup of record.instances.get(el)?.values() ?? []) {
      try {
        cleanup?.();
      } catch (error) {
        console.error("Enhancer cleanup failed", error);
      }
    }
    record.instances.delete(el);
  }

  function scan(node, targets, selector) {
    if (!canScan(node) || !selector) return;
    const visit = (el) => {
      for (const record of targets) start(record, el);
    };
    if (node.nodeType === ELEMENT_NODE) visit(node);
    node.querySelectorAll(selector).forEach(visit);
  }

  function sweepDisconnected() {
    for (const record of records) {
      for (const el of Array.from(record.instances.keys())) {
        if (!el.isConnected || !root.contains(el)) stop(record, el);
      }
    }
  }

  function updateDiscovery() {
    // Named records all share `[data-enhance]`; the Set collapses them.
    discovery = [...new Set(Array.from(records, (record) => record.query))].join(",");
  }

  const observer = new MutationObserver((mutationRecords) => {
    let hasRemoval = false;
    for (const mutationRecord of mutationRecords) {
      for (const node of mutationRecord.addedNodes) {
        scan(node, records, discovery);
      }
      if (mutationRecord.removedNodes.length > 0) {
        hasRemoval = true;
      }
    }
    if (hasRemoval) sweepDisconnected();
  });

  return {
    add(spec) {
      const record = { ...spec, disconnected: false, instances: new Map() };
      records.add(record);
      // Observe only once there is a record to act on; an enhance() call with
      // no valid selector must not leave an idle observer behind.
      if (records.size === 1) observer.observe(root, { childList: true, subtree: true });
      updateDiscovery();
      scan(root, [record], record.query);

      return {
        refresh(node) {
          if (!record.disconnected) scan(node, [record], record.query);
        },
        disconnect() {
          if (record.disconnected) return;
          record.disconnected = true;
          for (const el of Array.from(record.instances.keys())) stop(record, el);
          records.delete(record);
          updateDiscovery();
          if (records.size) return;
          observer.disconnect();
          registries.delete(root);
        },
      };
    },
  };
}

function registryFor(root) {
  let registry = registries.get(root);
  if (!registry) {
    registry = createRegistry(root);
    registries.set(root, registry);
  }
  return registry;
}

// The name check is what keeps the interpolation safe: a quote or space in a
// name would otherwise break or widen the selector.
function enhancementSelector(name) {
  if (!ENHANCEMENT_NAME.test(name)) {
    throw new TypeError(`Invalid enhancement name: ${name}`);
  }
  return `[data-enhance~="${name}"]`;
}

/**
 * Apply a named opt-in once; presentation selectors remain application-owned.
 * @param {string} name
 * @param {string} selector
 * @param {Document | Element | DocumentFragment} [root] Query scope, excluding itself.
 * @returns {Element[]} Matched descendants.
 */
export function applyEnhancement(name, selector, root) {
  if (typeof document === "undefined") return [];

  const enhanced = enhancementSelector(name);
  root ??= document.documentElement;
  const elements = [...root.querySelectorAll(selector)];

  for (const el of elements) {
    if (el.matches(enhanced)) continue;
    const tokens = el.getAttribute("data-enhance");
    el.setAttribute("data-enhance", tokens ? `${tokens} ${name}` : name);
  }
  // Refresh the scope once per owner; parentNode stops at shadow boundaries.
  // A Document scope can own registrations, but its default root —
  // documentElement — is a descendant the ancestor walk never reaches.
  for (let owner = root; owner; owner = owner.parentNode) {
    ownedNames.get(owner)?.get(name)?.refresh(root);
    if (owner === root && owner.nodeType === DOCUMENT_NODE) {
      ownedNames.get(owner.documentElement)?.get(name)?.refresh(root);
    }
  }
  return elements;
}

export function registerEnhancement(name, init, root) {
  if (typeof document === "undefined") return noopRuntime();

  const selector = enhancementSelector(name);
  if (typeof init !== "function") {
    throw new TypeError("registerEnhancement() requires a function init.");
  }

  root ??= document.documentElement;
  let names = ownedNames.get(root);
  if (!names) {
    names = new Map();
    ownedNames.set(root, names);
  }
  if (names.has(name)) {
    throw new Error(`Enhancement "${name}" is already registered on this root.`);
  }

  const runtime = registryFor(root).add({
    keys: [selector],
    enhancers: { [selector]: init },
    query: "[data-enhance]",
  });
  names.set(name, runtime);

  return {
    refresh: (node) => runtime.refresh(node),
    disconnect: () => {
      runtime.disconnect();
      if (names.get(name) === runtime) names.delete(name);
      if (names.size === 0) ownedNames.delete(root);
    },
  };
}

/**
 * @param {Record<string, (el: Element) => (() => void) | void>} enhancers
 * @param {Document | Element | DocumentFragment} [root]
 * @returns {{ refresh: (node: Node) => void, disconnect: () => void }}
 */
export default function enhance(enhancers, root) {
  if (typeof document === "undefined") return noopRuntime();

  root ??= document.documentElement;
  const keys = Object.keys(enhancers).filter((selector) => {
    try {
      root.querySelector?.(selector);
      if (root.nodeType === ELEMENT_NODE) root.matches(selector);
      return true;
    } catch (error) {
      console.error(`Invalid enhancer selector "${selector}"`, error);
      return false;
    }
  });
  if (!keys.length) return noopRuntime();

  return registryFor(root).add({ keys, enhancers, query: keys.join(",") });
}
