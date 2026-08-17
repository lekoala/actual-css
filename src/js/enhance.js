/*
 * Enhance — DOM lifecycle engine for behavioral enhancers.
 *
 * One MutationObserver per root watches DOM insertions/removals. Multiple calls
 * to enhance() share that observer while keeping separate teardown handles.
 *
 * Sweep (not removedNodes scanning) is the key design choice: it reasons
 * about final state after a batch, so a moved element (removed then
 * reinserted in the same batch) survives without a spurious disconnect.
 *
 * Attribute changes are intentionally not observed. Call refresh(node) after
 * adding a behavior attribute to an already-connected element. Behavior
 * attributes are setup-time contracts, not live enable/disable switches.
 *
 * enhancers: { [selector]: (el) => cleanup | void }
 * Returns: { refresh, disconnect }
 *
 * Enhancement tokens — the data-enhance layer on top of enhance().
 *
 * enhancementSelector("tabs") returns [data-enhance~="tabs"], the generic
 * opt-in for root-controller behaviors. registerEnhancement() owns a name per
 * root — a second registration for the same name on the same root throws, and
 * disconnect() releases ownership. Third-party behaviors register exactly
 * like built-in ones.
 *
 * See docs/design-notes/enhancement-contract.md.
 */

const registries = new WeakMap();
const ownedNames = new WeakMap();

function noopRuntime() {
  return {
    refresh() {},
    disconnect() {},
  };
}

function canScan(node) {
  return (
    node?.nodeType === Node.ELEMENT_NODE ||
    node?.nodeType === Node.DOCUMENT_NODE ||
    node?.nodeType === Node.DOCUMENT_FRAGMENT_NODE
  );
}

function createRegistry(root) {
  const records = new Set();
  let selectorString = "";

  function isValidSelector(selector) {
    try {
      root.querySelector?.(selector);
      if (root instanceof Element) root.matches(selector);
      return true;
    } catch (error) {
      console.error(`Invalid enhancer selector "${selector}"`, error);
      return false;
    }
  }

  function updateSelectorString() {
    selectorString = [...records].flatMap((record) => record.selectors).join(",");
  }

  function start(record, el) {
    if (!(el instanceof Element)) return;
    let active = record.instances.get(el);

    for (const selector of record.selectors) {
      if (!el.matches(selector)) continue;
      if (active?.has(selector)) continue;

      let cleanup;
      try {
        cleanup = record.enhancers[selector](el);
      } catch (error) {
        console.error(`Enhancer failed for selector "${selector}"`, error);
        continue;
      }
      if (!active) {
        active = new Map();
        record.instances.set(el, active);
      }
      active.set(selector, typeof cleanup === "function" ? cleanup : null);
    }
  }

  function stop(record, el) {
    const active = record.instances.get(el);
    if (!active) return;
    for (const cleanup of active.values()) {
      cleanup?.();
    }
    record.instances.delete(el);
  }

  function scanFor(record, node) {
    if (!canScan(node)) return;
    if (node instanceof Element) start(record, node);
    if (record.selectorString) {
      node.querySelectorAll?.(record.selectorString).forEach((el) => {
        start(record, el);
      });
    }
  }

  function scan(node) {
    if (!canScan(node) || !selectorString) return;
    if (node instanceof Element) {
      for (const record of records) start(record, node);
    }
    node.querySelectorAll?.(selectorString).forEach((el) => {
      for (const record of records) start(record, el);
    });
  }

  function sweepDisconnected() {
    for (const record of records) {
      for (const el of Array.from(record.instances.keys())) {
        if (!el.isConnected || !root.contains(el)) stop(record, el);
      }
    }
  }

  const observer = new MutationObserver((mutationRecords) => {
    let hasRemoval = false;
    for (const mutationRecord of mutationRecords) {
      for (const node of mutationRecord.addedNodes) {
        scan(node);
      }
      if (mutationRecord.removedNodes.length > 0) {
        hasRemoval = true;
      }
    }
    if (hasRemoval) sweepDisconnected();
  });

  observer.observe(root, { childList: true, subtree: true });

  return {
    add(enhancers) {
      const selectors = Object.keys(enhancers).filter(isValidSelector);
      if (!selectors.length) return null;
      const validEnhancers = Object.fromEntries(
        selectors.map((selector) => [selector, enhancers[selector]]),
      );

      const record = {
        disconnected: false,
        enhancers: validEnhancers,
        instances: new Map(),
        selectors,
        selectorString: selectors.join(","),
      };
      records.add(record);
      updateSelectorString();
      scanFor(record, root);
      return record;
    },
    refresh(record, node) {
      if (record.disconnected) return;
      scanFor(record, node);
    },
    remove(record) {
      if (record.disconnected) return;
      record.disconnected = true;
      for (const el of Array.from(record.instances.keys())) {
        stop(record, el);
      }
      records.delete(record);
      updateSelectorString();
      if (records.size === 0) {
        observer.disconnect();
        registries.delete(root);
      }
    },
  };
}

const ENHANCEMENT_NAME = /^[a-z][a-z0-9-]*$/;

export function enhancementSelector(name) {
  if (!ENHANCEMENT_NAME.test(name)) {
    throw new TypeError(`Invalid enhancement name: ${name}`);
  }
  return `[data-enhance~="${name}"]`;
}

export function hasEnhancement(el, name) {
  return el.matches(enhancementSelector(name));
}

export function registerEnhancement(name, init, root) {
  if (typeof document === "undefined") return noopRuntime();

  enhancementSelector(name);

  root ??= document.documentElement;
  let names = ownedNames.get(root);
  if (!names) {
    names = new Map();
    ownedNames.set(root, names);
  }
  if (names.has(name)) {
    throw new Error(`Enhancement "${name}" is already registered on this root.`);
  }

  const runtime = enhance({ [enhancementSelector(name)]: init }, root);
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

function registryFor(root) {
  let registry = registries.get(root);
  if (!registry) {
    registry = createRegistry(root);
    registries.set(root, registry);
  }
  return registry;
}

/**
 * @param {Record<string, (el: Element) => (() => void) | void>} enhancers
 * @param {Document | Element | DocumentFragment} [root]
 * @returns {{ refresh: (node: Node) => void, disconnect: () => void }}
 */
export default function enhance(enhancers, root) {
  if (typeof document === "undefined") {
    return noopRuntime();
  }

  root ??= document.documentElement;
  const registry = registryFor(root);
  const record = registry.add(enhancers);
  if (!record) return noopRuntime();

  return {
    refresh: (node) => registry.refresh(record, node),
    disconnect: () => {
      registry.remove(record);
    },
  };
}
