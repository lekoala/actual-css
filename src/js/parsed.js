/*
 * Runs a callback once the document has finished parsing — internal, not a
 * package export.
 *
 * The runtime connects an element as soon as the parser inserts it. With a
 * classic script in <head>, a <script> inside the element hands control back
 * mid-parse, so an enhancer that reads its children at connect can find them
 * missing. Deferring that one read to DOMContentLoaded needs no observer; after
 * parsing the callback runs at once. Returns a cancel for the enhancer's
 * cleanup, so an element removed before the document is parsed does nothing.
 */
export function afterParse(node, callback) {
  const doc = node.ownerDocument;
  if (doc.readyState !== "loading") {
    callback();
    return () => {};
  }
  const controller = new AbortController();
  doc.addEventListener("DOMContentLoaded", callback, { once: true, signal: controller.signal });
  return () => controller.abort();
}
