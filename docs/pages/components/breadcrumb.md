# Breadcrumb

> Trail of links showing the current page's location in a hierarchy.

- Use a semantic `<nav>` landmark.
- Put `.breadcrumb` on the ordered list.
- Use `aria-current="page"` for the current page.
- Separators are generated with CSS (`li + li::before`).
- Breadcrumbs remain on a single line and scroll horizontally when space is insufficient. Actual does not automatically truncate or collapse hierarchy levels.
- An overflowing trail fades at the inline end to signal continuation; the last item rests outside the fade once scrolled into view.

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
