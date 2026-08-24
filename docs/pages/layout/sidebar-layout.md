# Sidebar Layout

Use `.sidebar-layout` for a main region followed by a secondary region. It
switches intrinsically according to its own available width: the regions sit
side by side when the main minimum, preferred aside width, and gap fit; they
otherwise stack. No `.container-query` ancestor is required.

```html demo
<div class="sidebar-layout">
  <article class="stack">
    <h1>Long-form article</h1>
    <p>Article body that benefits from a related table of contents.</p>
  </article>

  <aside class="stack">
    <h3>On this page</h3>
    <ol class="list-reset"><li><a class="link-muted" href="#">Section</a></li></ol>
  </aside>
</div>
```

The first child is the flexible main region and the last child is the aside.
Use a custom `.grid` template only when an exact editorial ratio is structural.

To place the aside on the inline start instead, add `.reverse` — it swaps only
the visual order, so the DOM keeps the main content first for reading and
keyboard order:

```html demo
<div class="sidebar-layout reverse">
  <article class="stack">
    <h1>Long-form article</h1>
    <p>Article body that benefits from a related table of contents.</p>
  </article>

  <aside class="stack">
    <h3>On this page</h3>
    <ol class="list-reset"><li><a class="link-muted" href="#">Section</a></li></ol>
  </aside>
</div>
```

When the layout stacks (narrow space), `.reverse` keeps the aside on top.

### Hooks

- `--sidebar-layout-size` sets the aside's preferred width.
- `--sidebar-content-min` sets the main region's minimum viable width.
