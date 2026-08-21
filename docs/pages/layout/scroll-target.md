# Scroll Target

Anchor scroll offset: keep `#hash` and `scrollIntoView()` targets clear of sticky headers.

> **Module** — import `actual-css/css/layout/scroll-target` or `actual-css/css/layout`.

A hash link or scripted scroll places the target flush at the scroll container's start edge. Under a sticky header such as `.topbar`, the heading you jumped to lands underneath it. Add `.scroll-target` to the elements that are link targets — sections, headings — and the browser stops early, reserving space above them.

```html demo
<nav class="cluster" aria-label="Sections" style="margin-block-end: var(--space-30)">
  <a class="btn neutral sm" href="#st-alpha">Alpha</a>
  <a class="btn neutral sm" href="#st-beta">Beta</a>
  <a class="btn neutral sm" href="#st-gamma">Gamma</a>
</nav>
<div class="overflow-auto" style="block-size: 10rem; border: var(--border-width) solid var(--border); border-radius: var(--radius)">
  <section id="st-alpha" class="scroll-target" style="padding: var(--space-30)">
    <h3>Alpha</h3>
    <p>The first section. Followed by enough content to make the container scroll.</p>
  </section>
  <section id="st-beta" class="scroll-target" style="padding: var(--space-30)">
    <h3>Beta</h3>
    <p>The second section. Its top edge stops below the container edge.</p>
  </section>
  <section id="st-gamma" class="scroll-target" style="padding: var(--space-30)">
    <h3>Gamma</h3>
    <p>The last section.</p>
  </section>
</div>
```

The offset is a plain `scroll-margin-block-start`, so it works in every scroll container — the viewport, a sidebar, an overflow region — and composes with the scrollspy enhancer. Scrollspy only decides which link is active; this offset decides where the page actually lands when the link is followed.

## CSS hooks

- `--scroll-target-offset` — space kept above the target after scrolling. Set it
  once on `:root` (or on the sticky header's height) in applications with a
  fixed header:

```css
:root {
  --scroll-target-offset: 5rem;
}
```

Deliberately no `[id]` global rule: making the offset explicit per target keeps plain ids (modals, form fields, skip links) untouched.
