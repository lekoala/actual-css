# App Navigation

> Primary application destinations in a persistent bottom bar or labelled side navigation.

Use one `.app-nav` landmark for the application's primary destinations. Links
remain links, and `aria-current="page"` is the only current-page state.

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

### Hooks

- `--app-nav-size` controls the minimum bottom-bar size.
- `--app-nav-gap` controls spacing between destinations.
