/*
 * Observer — DOM lifecycle tracker for fixed CSS selectors.
 *
 * Vendored from liveinit (MIT). A single MutationObserver watches
 * document.documentElement and reports connect/disconnect for elements
 * matching a fixed selector list. Safe to start in <head> before <body>
 * exists: it scans the current DOM immediately and catches later inserts.
 *
 * Dedup: an element matching multiple selectors fires once per selector;
 * the same (element, selector) pair never fires twice.
 */

/**
 * @param {string[]} queries CSS selectors to observe
 * @param {(el: Element, connected: boolean, selector: string) => void} callback
 * @param {Document|Element} [root=document.documentElement]
 * @returns {{ evaluate: (els: Element|Element[]|NodeList, connected?: boolean) => void, forget: (el: Element) => void, disconnect: () => void }}
 */
export default function observer(queries, callback, root = document.documentElement) {
  const liveElements = new WeakMap();
  const selectorString = queries.join(",");

  function notifyNode(element, isConnected) {
    if (!element.matches) return;
    let active = liveElements.get(element);

    if (isConnected) {
      for (const selector of queries) {
        if (element.matches(selector)) {
          if (!active) {
            active = new Set();
            liveElements.set(element, active);
          }
          if (!active.has(selector)) {
            active.add(selector);
            callback(element, true, selector);
          }
        }
      }
    } else if (active) {
      liveElements.delete(element);
      for (const selector of active) {
        callback(element, false, selector);
      }
    }
  }

  function processNode(node, isConnected, added, removed) {
    if (isConnected) {
      if (!added.has(node)) {
        added.add(node);
        removed.delete(node);
        notifyNode(node, true);
      }
    } else if (!removed.has(node)) {
      removed.add(node);
      added.delete(node);
      notifyNode(node, false);
    }

    const descendants = node.querySelectorAll(selectorString);
    for (const desc of descendants) {
      if (isConnected) {
        if (!added.has(desc)) {
          added.add(desc);
          removed.delete(desc);
          notifyNode(desc, true);
        }
      } else if (!removed.has(desc)) {
        removed.add(desc);
        added.delete(desc);
        notifyNode(desc, false);
      }
    }
  }

  const mo = new MutationObserver((records) => {
    const added = new Set();
    const removed = new Set();
    for (const { addedNodes, removedNodes } of records) {
      for (const node of removedNodes) {
        if (node.nodeType === 1) processNode(node, false, added, removed);
      }
      for (const node of addedNodes) {
        if (node.nodeType === 1) processNode(node, true, added, removed);
      }
    }
  });

  mo.observe(root, { childList: true, subtree: true });

  function evaluate(elements, isConnected = true) {
    const nodes =
      elements instanceof NodeList || Array.isArray(elements)
        ? elements
        : [elements];
    for (const node of nodes) {
      if (node.nodeType === 1) notifyNode(node, isConnected);
    }
  }

  evaluate(root.querySelectorAll(selectorString), true);

  return {
    evaluate,
    forget: (el) => liveElements.delete(el),
    disconnect: () => mo.disconnect(),
  };
}
