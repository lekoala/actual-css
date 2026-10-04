# Breadcrumb

> Trail of links showing the current page's location in a hierarchy.

- Use a semantic `<nav>` landmark.
- Put `.breadcrumb` on the ordered list.
- Use `aria-current="page"` for the current page.
- Separators are generated with CSS (`li + li::before`).
- Breadcrumbs remain on a single line and scroll horizontally when space is insufficient. Actual does not automatically truncate or collapse hierarchy levels.
- Compose `.scroller` to fade the edges an overflowing trail can still scroll toward.
- Add `data-enhance="reveal-current"` to start an overflowing trail on its current item instead of the root. The placement happens once at connect, on a visible trail.
- Add `.scroller` for a thin, theme-coloured scrollbar; see [one-row strips](../utilities/sizing-wrapping.md#one-row-strips).

```html demo
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb" data-enhance="reveal-current">
    <li><a href="/home">Home</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><a href="/projects/docs">Docs</a></li>
    <li><a href="/current" aria-current="page">Breadcrumb</a></li>
  </ol>
</nav>
```
