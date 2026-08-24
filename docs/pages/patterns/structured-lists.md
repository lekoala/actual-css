# Structured Lists

Choose list markup from the content semantics, then add only the layout or
component contract the collection needs.

| Need | Use |
| --- | --- |
| Bullets or order carry meaning | Native `<ul>` or `<ol>` |
| One leading element and one flexible content region | [`.media`](../layout/media.md) |
| Repeated application rows with leading, content, and trailing regions | [`.list`](../components/list.md) |
| A list of navigation links | [`.nav-list`](./navigation-list.md) |
| A richer collection with its own item structure | Native list plus layout primitives and components |

`.media` and `.list` are not interchangeable. `.media` is geometry for one
two-part composition and requires exactly two direct children. `.list` owns the
repeated-row treatment: three regions, row padding, minimum touch height,
dividers, navigable-row hover, and supporting text.

Keep native markers when they communicate sequence, rank, or grouping. Remove
them with `.list-reset` only when they are not part of the content. A reset
changes list chrome; it does not create a row component.

For a collection whose items are complete compositions rather than application
rows, keep the native list and compose each item independently:

```html demo
<ul class="list-reset grid" style="--grid-min: 16rem">
  <li>
    <article class="card stack">
      <span class="badge">Guide</span>
      <h2>Choose a layout</h2>
      <p>Match intrinsic behavior to the structure of the content.</p>
      <a href="#layout-guide">Read the guide</a>
    </article>
  </li>
  <li>
    <article class="card stack">
      <span class="badge">Reference</span>
      <h2>Compose spacing</h2>
      <p>Use shared rhythm without coupling content to a component.</p>
      <a href="#spacing-reference">View the reference</a>
    </article>
  </li>
</ul>
```
