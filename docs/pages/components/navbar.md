# Navbar

> Horizontal top-level navigation bar with a brand, an inline link list, and a vertical nav-list for drawers.

- Use `.navbar` for the horizontal bar shell.
- `.navbar-brand` is the brand link at the inline start.
- `.navbar-nav` is the horizontal link list; its items are `.nav-link`.
- `.nav-list` is the shared vertical navigation list, reused by `.drawer` for stacked links.
- Mark the current page with `aria-current="page"` on the active `.nav-link`.

For a public or normally scrolling page, `.navbar` belongs inside the semantic
site header. Do not use `.topbar` or `.app-layout` unless the page actually has
the specialized persistent application-shell behavior those APIs describe.

`.navbar-nav` and `.nav-list` are mutually exclusive: `.navbar-nav` is a horizontal
flex list, `.nav-list` a vertical grid. Putting both on one element resolves to
`.nav-list` (vertical) — pick one per container.

## Class reference

| Class           | Kind        | Description                                           |
|-----------------|-------------|-------------------------------------------------------|
| `.navbar`       | Component   | Horizontal bar shell.                                 |
| `.navbar-brand` | Composition | Brand link at the inline start.                       |
| `.navbar-nav`   | Composition | Horizontal link list.                                 |
| `.nav-link`     | Component   | A link item; current page via `aria-current="page"`.  |
| `.nav-list`     | Component   | Shared vertical navigation list, reused by `.drawer`. |

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

## Responsive: navbar + drawer

There is no collapse/toggler mechanism. For a responsive navigation, keep the
horizontal `.navbar` for the desktop bar and compose the mobile experience from
a `.drawer` with a vertical `.nav-list`, opened by a `command="show-modal"` /
`commandfor` trigger. Keep that trigger outside the `<nav>` subtree you hide at
narrow widths, or hiding the nav hides the control that opens it.

```html demo
<nav class="navbar" aria-label="Main">
  <a class="navbar-brand" href="/">Actual CSS</a>
  <ul class="navbar-nav">
    <li><a class="nav-link" href="/" aria-current="page">Home</a></li>
    <li><a class="nav-link" href="/docs">Docs</a></li>
  </ul>
</nav>

<button class="btn ghost"
        type="button"
        command="show-modal"
        commandfor="site-nav"
        aria-haspopup="dialog"
        aria-controls="site-nav"
        aria-label="Open menu">
  <i class="ti ti-menu-2" aria-hidden="true"></i>
</button>

<dialog class="drawer"
        id="site-nav"
        aria-label="Main navigation"
        closedby="any"
        data-dialog-dismissible>
  <header>
    <strong>Menu</strong>
    <form method="dialog">
      <button class="drawer-close" type="submit" aria-label="Close navigation"></button>
    </form>
  </header>

  <nav>
    <ul class="nav-list stack">
      <li><a href="#" aria-current="page">Home</a></li>
      <li><a href="#">Docs</a></li>
      <li><a href="#">Components</a></li>
    </ul>
  </nav>
</dialog>
```

The drawer can be hidden until opened: give the `dialog` the `hidden` attribute
in the HTML and let the command runtime manage it, or rely on the drawer being
rendered only on the mobile layout. `command` and `commandfor` work without
JavaScript, and the drawer follows the same `closedby` / `data-dialog-dismissible`
rules as the [Drawer component](drawer.md).
