# Pagination

> Navigation controls to move between pages of content.

- Use a semantic `<nav>` landmark.
- Put `.pagination` on the ordered list.
- Use `aria-current="page"` for the current page.
- Put `.sm` or `.lg` on `.pagination` to scale its controls.
- Numeric links may use `aria-label="Page N"` for clearer screen reader output.
- Prefer text labels for Previous and Next; a chevron icon may accompany them. Icon-only controls need an accessible name.
- Compose page links with `.btn.ghost`; `aria-current="page"` fills the current one, so it is the only boxed item.
- Arrows, page numbers, and truncation ellipses share one geometric system: every item gets the same minimum footprint, and wider content (100, 1000, text labels) grows past it naturally.
- Truncated ranges are plain text with `.muted` and `aria-hidden="true"`, not `.btn` — they are decorative, not actionable.

## Class reference

| Class         | Kind      | Description                    |
| ------------- | --------- | ------------------------------ |
| `.pagination` | Component | Ordered list of page controls. |
| `.sm` / `.lg` | Size      | Control geometry and type.     |

## Basic usage

```html demo
<nav aria-label="Pagination">
  <ol class="pagination sm">
    <li><a href="?page=2" class="btn ghost" rel="prev"><i class="ti ti-chevron-left" aria-hidden="true"></i> Previous</a></li>
    <li><a href="?page=1" class="btn ghost" aria-label="Page 1">1</a></li>
    <li><a href="?page=2" class="btn ghost" aria-label="Page 2">2</a></li>
    <li><a href="?page=3" class="btn ghost" aria-current="page" aria-label="Page 3">3</a></li>
    <li><a href="?page=4" class="btn ghost" aria-label="Page 4">4</a></li>
    <li><a href="?page=5" class="btn ghost" rel="next">Next <i class="ti ti-chevron-right" aria-hidden="true"></i></a></li>
  </ol>
</nav>
```

## Truncated ranges

Truncated ranges are plain text (`<span class="muted" aria-hidden="true">`), not
buttons — they are decorative, not actionable.

```html demo
<nav aria-label="Pagination">
  <ol class="pagination sm">
    <li><a href="?page=7" class="btn ghost" rel="prev"><i class="ti ti-chevron-left" aria-hidden="true"></i> Previous</a></li>
    <li><a href="?page=1" class="btn ghost" aria-label="Page 1">1</a></li>
    <li><span class="muted" aria-hidden="true">…</span></li>
    <li><a href="?page=7" class="btn ghost" aria-label="Page 7">7</a></li>
    <li><a href="?page=8" class="btn ghost" aria-current="page" aria-label="Page 8">8</a></li>
    <li><a href="?page=9" class="btn ghost" aria-label="Page 9">9</a></li>
    <li><span class="muted" aria-hidden="true">…</span></li>
    <li><a href="?page=20" class="btn ghost" aria-label="Page 20">20</a></li>
    <li><a href="?page=9" class="btn ghost" rel="next">Next <i class="ti ti-chevron-right" aria-hidden="true"></i></a></li>
  </ol>
</nav>
```

## Narrow screens

When the items do not fit, the row wraps: every page stays visible and
clickable. That is the fallback, not the mobile design. For a phone or a
narrow column (responsive, mobile, small screen), render a shorter range — the
server knows which pages matter around the current one:

```html demo
<nav aria-label="Pagination">
  <ol class="pagination sm">
    <li><a href="?page=7" class="btn ghost" rel="prev"><i class="ti ti-chevron-left" aria-hidden="true"></i> Previous</a></li>
    <li><a href="?page=7" class="btn ghost" aria-label="Page 7">7</a></li>
    <li><a href="?page=8" class="btn ghost" aria-current="page" aria-label="Page 8">8</a></li>
    <li><a href="?page=9" class="btn ghost" aria-label="Page 9">9</a></li>
    <li><a href="?page=9" class="btn ghost" rel="next">Next <i class="ti ti-chevron-right" aria-hidden="true"></i></a></li>
  </ol>
</nav>
```
