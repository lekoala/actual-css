# App Navigation

> Primary application destinations in a persistent bottom bar or labelled side navigation.

Use one `.app-nav` landmark for the application's primary destinations. Links
remain links, and `aria-current="page"` is the only current-page state.

Reach for `.app-nav` only as part of a persistent application shell: it exists
as a direct child of `.app-layout`, which turns the landmark from a bottom bar
into side navigation. A site or webapp header with normal scrolling stays
`.navbar` — `.app-nav` is not a stacked-icon variant of the horizontal bar. See
[Navbar](navbar.md).

**Related terms:** tab bar, bottom navigation, bottom nav, navigation rail, side navigation.

```html demo
<nav class="app-nav" aria-label="Primary">
  <a href="#today" aria-current="page">
    <span aria-hidden="true">☀</span>
    <span>Today</span>
  </a>
  <a href="#tasks">
    <span aria-hidden="true">✓</span>
    <span>Tasks</span>
  </a>
  <a href="#settings">
    <span aria-hidden="true">⚙</span>
    <span>Settings</span>
  </a>
</nav>
```

On its own, `.app-nav` is a sticky bottom bar. Compose it as a direct child of
`.app-layout` to let the layout turn the same landmark into side navigation when space
permits. The component contains no JavaScript and does not manage routing.
The icon slot accepts SVGs, images, and decorative elements such as icon-font
`i` elements marked with `aria-hidden="true"`.

### Hooks

- `--app-nav-size` controls the minimum bottom-bar size.
- `--app-nav-gap` controls spacing between destinations.
