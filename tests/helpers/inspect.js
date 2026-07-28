// Loaded through bunfig.toml's [test] preload.
//
// A failed `expect(node).toBe(other)` makes bun deep-print the node, and a
// happy-dom node walks up through parentNode/ownerDocument to the window —
// tens of megabytes of SVG*Element constructors that read like a hung test
// run. Bun has no knob for the diff depth, but its inspector honours the node
// util.inspect hook, so give nodes and windows a one-line form:
// `<button id="first" class="menu-item">`.
//
// happy-dom shares one Node class across every Window, so patching the
// exported classes once covers every test, including those that build a
// Window outside setupDOM().

import { Node, Window } from "happy-dom";

const inspectCustom = Symbol.for("nodejs.util.inspect.custom");

function describeNode() {
  switch (this.nodeType) {
    case Node.TEXT_NODE:
      return `#text ${JSON.stringify(this.data?.slice(0, 40) ?? "")}`;
    case Node.COMMENT_NODE:
      return "#comment";
    case Node.DOCUMENT_NODE:
      return "#document";
    case Node.DOCUMENT_FRAGMENT_NODE:
      return "#document-fragment";
    default: {
      const name = this.nodeName?.toLowerCase?.() ?? "node";
      const id = this.id ? ` id="${this.id}"` : "";
      const className = this.getAttribute?.("class");
      return `<${name}${id}${className ? ` class="${className}"` : ""}>`;
    }
  }
}

function define(prototype, value) {
  Object.defineProperty(prototype, inspectCustom, { configurable: true, value });
}

define(Node.prototype, describeNode);
define(Window.prototype, () => "[Window]");
