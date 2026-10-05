# Breadcrumb

> Trail of links showing the current page's location in a hierarchy.

- Use a semantic `<nav>` landmark.
- Put `.breadcrumb` on the ordered list.
- Use `aria-current="page"` for the current page, on its link or on its `<li>`,
  and keep it last.
- Separators are generated with CSS (`> li + li::before`).
- Put each ancestor label in an `<a>` or a `<span>`: that box carries the
  ellipsis. The current page may be bare text in an `<li aria-current="page">`.

```html demo
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb">
    <li><a href="/home">Home</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><a href="/projects/docs">Docs</a></li>
    <li><a href="/current" aria-current="page">Breadcrumb</a></li>
  </ol>
</nav>
```

## Narrow space

A trail stays on one line and never scrolls. When it does not fit, labels
truncate with an ellipsis: ancestors first, down to a couple of characters
each, then the current page. A link keeps its full text as its accessible
name; add a `title` if pointer users should see it on hover.

Truncation does not remove levels. For a deep hierarchy on a phone, collapse
it in markup — keep the root and the current page, and replace the middle
levels with a `…` item, or render only a link to the parent page.
