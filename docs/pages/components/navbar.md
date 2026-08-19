# Navbar

> Horizontal top-level navigation bar with a brand, an inline link list, and a vertical nav-list for drawers.

- Use `.navbar` for the horizontal bar shell.
- `.navbar-brand` is the brand link at the inline start.
- `.navbar-nav` is the horizontal link list; its items are `.nav-link`.
- `.nav-list` is the shared vertical navigation list, reused by `.drawer` for stacked links.
- Mark the current page with `aria-current="page"` on the active `.nav-link`.

`.navbar-nav` and `.nav-list` are mutually exclusive: `.navbar-nav` is a horizontal
flex list, `.nav-list` a vertical grid. Putting both on one element resolves to
`.nav-list` (vertical) — pick one per container.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.navbar` | Component | Horizontal bar shell. |
| `.navbar-brand` | Composition | Brand link at the inline start. |
| `.navbar-nav` | Composition | Horizontal link list. |
| `.nav-link` | Component | A link item; current page via `aria-current="page"`. |
| `.nav-list` | Component | Shared vertical navigation list, reused by `.drawer`. |

## Basic usage

```html demo
<nav class="navbar" aria-label="Main">
  <a class="navbar-brand" href="/">Actual CSS</a>
  <ul class="navbar-nav">
    <li><a class="nav-link" href="/docs" aria-current="page">Docs</a></li>
    <li><a class="nav-link" href="/components">Components</a></li>
    <li><a class="nav-link" href="/examples">Examples</a></li>
  </ul>
</nav>
```

For a vertical sidebar nav, use `.nav-list` inside the drawer or sidebar.
