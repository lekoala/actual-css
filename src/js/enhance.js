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
 * adding/removing behavior attributes on an already-connected element.
 *
 * enhancers: { [selector]: (el) => cleanup | void }
 * Returns: { refresh, forget, disconnect }
 */

const registries = new WeakMap();

function noopRuntime() {
  return {
    refresh() {},
    forget() {},
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

  function updateSelectorString() {
    selectorString = [...records].flatMap((record) => record.selectors).join(",");
  }

  function start(record, el) {
    if (!(el instanceof Element)) return;
    let active = record.instances.get(el);

    for (const selector of record.selectors) {
      if (!el.matches(selector)) continue;
      if (active?.has(selector)) continue;

      const cleanup = record.enhancers[selector](el);
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
      node.querySelectorAll?.(record.selectorString).forEach((el) => start(record, el));
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
        if (!el.isConnected) stop(record, el);
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
      const selectors = Object.keys(enhancers);
      if (!selectors.length) return null;

      const record = {
        disconnected: false,
        enhancers,
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
    forget(record, el) {
      if (record.disconnected) return;
      record.instances.delete(el);
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
 * @returns {{ refresh: (node: Node) => void, forget: (el: Element) => void, disconnect: () => void }}
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
    forget: (el) => {
      registry.forget(record, el);
    },
    disconnect: () => {
      registry.remove(record);
    },
  };
}
