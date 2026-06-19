/*
 * Enhance — DOM lifecycle engine for behavioral enhancers.
 *
 * A single MutationObserver watches document.documentElement. On insert,
 * matching elements are enhanced. On removal, a sweep over live instances
 * disconnects any element where el.isConnected is false.
 *
 * Sweep (not removedNodes scanning) is the key design choice: it reasons
 * about final state after a batch, so a moved element (removed then
 * reinserted in the same batch) survives without a spurious disconnect.
 *
 * enhancers: { [selector]: (el) => cleanup | void }
 * Returns: { refresh, forget, disconnect }
 */

/**
 * @param {Record<string, (el: Element) => (() => void) | void>} enhancers
 * @param {Document | Element | DocumentFragment} [root=document.documentElement]
 * @returns {{ refresh: (node: Node) => void, forget: (el: Element) => void, disconnect: () => void }}
 */
export default function enhance(enhancers, root = document.documentElement) {
  const selectors = Object.keys(enhancers);
  const selectorString = selectors.join(",");

  // Strong Map on purpose: we need to iterate live instances for the sweep.
  // Cleanup runs on removal or disconnect(), so entries don't leak long-term.
  const instances = new Map();

  function start(el) {
    if (!(el instanceof Element)) return;
    let active = instances.get(el);

    for (const selector of selectors) {
      if (!el.matches(selector)) continue;
      if (active?.has(selector)) continue;

      const cleanup = enhancers[selector](el);
      if (!active) {
        active = new Map();
        instances.set(el, active);
      }
      active.set(selector, typeof cleanup === "function" ? cleanup : null);
    }
  }

  function stop(el) {
    const active = instances.get(el);
    if (!active) return;
    for (const cleanup of active.values()) {
      cleanup?.();
    }
    instances.delete(el);
  }

  function scan(node) {
    if (
      node.nodeType !== Node.ELEMENT_NODE &&
      node.nodeType !== Node.DOCUMENT_NODE &&
      node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
    ) {
      return;
    }
    if (node instanceof Element) start(node);
    node.querySelectorAll?.(selectorString).forEach(start);
  }

  function sweepDisconnected() {
    for (const el of Array.from(instances.keys())) {
      if (!el.isConnected) stop(el);
    }
  }

  const mo = new MutationObserver((records) => {
    let hasRemoval = false;
    for (const record of records) {
      for (const node of record.addedNodes) {
        scan(node);
      }
      if (record.removedNodes.length > 0) {
        hasRemoval = true;
      }
    }
    if (hasRemoval) sweepDisconnected();
  });

  mo.observe(root, { childList: true, subtree: true });

  scan(root);

  return {
    refresh: scan,
    forget: (el) => {
      instances.delete(el);
    },
    disconnect: () => {
      mo.disconnect();
      for (const el of Array.from(instances.keys())) {
        stop(el);
      }
    },
  };
}
