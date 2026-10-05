# Navbar

> Horizontal top-level navigation bar with a brand, an inline `.cluster` link list, and a vertical `.nav-list` for drawers.

- Use `.navbar` for the horizontal bar shell.
- `.navbar-brand` is the brand link at the inline start.
- Horizontal links live in a `.cluster`; its items are `.nav-link`.
- `.nav-list` is the shared vertical navigation list, reused by `.drawer` for stacked links.
- Mark the current page with `aria-current="page"` on the active `.nav-link`.
- Any `aria-current` value marks the link current except `false` and an empty
  value, so a framework binding that writes `"false"` stays inactive. Scrollspy
  sets `aria-current="location"`.

For a public or normally scrolling page, `.navbar` belongs inside the semantic
site header. Do not use `.topbar` or `.app-layout` unless the page actually has
the specialized persistent application-shell behavior those APIs describe.

Horizontal navbar links use a `.cluster`. Use `.nav-list` when the navigation
becomes a full-width vertical list. The two are distinct contracts, so pick one
per container.

`.navbar` stays the horizontal bar for a site or webapp header with a brand and
normal document scrolling. `.app-nav` is not merely a stacked-icon flavour of it:
reach for that component only when the destinations are part of a persistent
application shell — bottom navigation or labelled side navigation via
`.app-layout`. The choice follows the shell contract, not a preference for
icons. See [App Navigation](app-navigation.md).

## Class reference

| Class           | Kind        | Description                                           |
| --------------- | ----------- | ----------------------------------------------------- |
| `.navbar`       | Component   | Horizontal bar shell.                                 |
| `.navbar-brand` | Composition | Brand link at the inline start.                       |
| `.nav-link`     | Component   | A link item; current page via `aria-current="page"`.  |
| `.nav-list`     | Component   | Shared vertical navigation list, reused by `.drawer`. |

## Basic usage

```html demo
<nav class="navbar" aria-label="Main">
  <a class="navbar-brand" href="/">Actual CSS</a>
  <ul class="cluster">
    <li><a class="nav-link" href="/docs" aria-current="page">Docs</a></li>
    <li><a class="nav-link" href="/components">Components</a></li>
    <li><a class="nav-link" href="/examples">Examples</a></li>
  </ul>
</nav>
```

For a vertical sidebar nav, use `.nav-list` inside the drawer or sidebar.
Links inside `.nav-list` stretch to the available inline size, providing a
full-row hit target for vertical navigation. The [Workspaces example](../examples/overview.md#page-shapes)
shows the sectioned-sidebar composition: grouped `.nav-list` blocks with
section titles, a pinned account footer, and the native current state.

## Responsive: navbar + drawer

There is no collapse/toggler mechanism. For a responsive navigation, keep the
horizontal `.navbar` for the desktop bar and compose the mobile experience from
a `.drawer` with a vertical `.nav-list`, opened by a `command="show-modal"` /
`commandfor` trigger. Keep that trigger in the bar but outside the `<nav>`
subtree you hide at narrow widths, or hiding the nav hides the control that
opens it: the bar is then the `<header>`, and the links get their own `<nav>`.

When the compact layout drops labels, keep that text in the DOM and hide it
visually instead of replacing it with `aria-label` strings: one source for the
accessible name.

```html demo
<header class="navbar">
  <a class="navbar-brand" href="/">Actual CSS</a>
  <div class="cluster">
    <nav class="site-links" aria-label="Main">
      <ul class="cluster">
        <li><a class="nav-link" href="/" aria-current="page">Home</a></li>
        <li><a class="nav-link" href="/docs">Docs</a></li>
      </ul>
    </nav>

    <button class="btn ghost site-menu"
            type="button"
            command="show-modal"
            commandfor="site-nav"
            aria-haspopup="dialog"
            aria-controls="site-nav"
            aria-label="Open menu">
      <i class="ti ti-menu-2" aria-hidden="true"></i>
    </button>
  </div>
</header>

<dialog class="drawer"
        id="site-nav"
        aria-label="Main navigation"
        closedby="any"
        data-dialog-dismissible>
  <header>
    <strong>Menu</strong>
    <form method="dialog">
      <button class="close" type="submit" aria-label="Close navigation"></button>
    </form>
  </header>

  <nav>
    <ul class="nav-list">
      <li><a class="nav-link" href="#" aria-current="page">Home</a></li>
      <li><a class="nav-link" href="#">Docs</a></li>
      <li><a class="nav-link" href="#">Components</a></li>
    </ul>
  </nav>
</dialog>
```

The demo shows both controls; the application picks one per width:

```css
@media (width < 40rem) {
  .site-links {
    display: none;
  }
}

@media (width >= 40rem) {
  .site-menu {
    display: none;
  }
}
```

The drawer can be hidden until opened: give the `dialog` the `hidden` attribute
in the HTML and let the command runtime manage it, or rely on the drawer being
rendered only on the mobile layout. `command` and `commandfor` work without
JavaScript, and the drawer follows the same `closedby` / `data-dialog-dismissible`
rules as the [Drawer component](drawer.md).
