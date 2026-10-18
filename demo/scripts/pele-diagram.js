/*
 * <pele-diagram> — a demo integration, not Actual CSS API. Copy and adapt it.
 *
 *   <pele-diagram [zoom]>
 *     <script type="text/plain">
 *       flowchart LR
 *         A --> B
 *     </script>
 *   </pele-diagram>
 *
 * No zoom by default: a diagram is a figure in the page flow, and Pele's
 * overlay controls covered its edge. The boolean `zoom` attribute, read at
 * mount, restores Pele's automatic zoom for a diagram that needs it.
 *
 * Pele (https://pele.run) renders the Mermaid source to SVG; Actual CSS only
 * provides the --pele-* token bridge, in the page stylesheet. A text/plain
 * script keeps the source verbatim (no HTML escaping for `<--`) and stays in
 * place after the render.
 *
 * pele/lazy loads each diagram type on first use, so a page pays only for the
 * types it draws. Pinned: Pele moves fast, and the bridge is checked against
 * this version.
 *
 * A classic script with a dynamic import(), not a module: browsers block
 * module scripts on file://, where the demo pages open locally.
 */
const PELE = "https://cdn.jsdelivr.net/npm/pele@1.6.0/dist/esm/lazy.js";

class PeleDiagram extends HTMLElement {
  #mounted = null;
  #container = null;

  async connectedCallback() {
    if (this.#container) return;
    const source = this.querySelector(':scope > script[type="text/plain"]')?.textContent.trim();
    if (!source) return;

    this.#container = document.createElement("div");
    this.append(this.#container);
    const container = this.#container;
    const { mountAsync } = await import(PELE);
    // Disconnected while the module loaded: nothing to mount into.
    if (this.#container !== container) return;
    const mounted = await mountAsync(container, source, {
      zoom: this.hasAttribute("zoom") ? "auto" : false,
    });
    // Disconnected while the diagram type loaded: drop the late render.
    if (this.#container !== container) return mounted.destroy();
    this.#mounted = mounted;
  }

  disconnectedCallback() {
    this.#mounted?.destroy();
    this.#container?.remove();
    this.#mounted = null;
    this.#container = null;
  }
}

customElements.define("pele-diagram", PeleDiagram);
