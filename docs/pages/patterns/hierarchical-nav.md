# Hierarchical Scrollable Nav

App shell with a collapsible nav tree. Uses existing primitives only — no treeview component.

```html demo
<aside>
  <nav class="nav-list scroller" data-enhance="scrollspy" aria-label="Docs">
    <details open>
      <summary>Getting started</summary>
      <a class="nav-link" href="#intro">Introduction</a>
      <a class="nav-link" href="#install">Installation</a>
    </details>
    <details>
      <summary>Components</summary>
      <a class="nav-link" href="#alert">Alert</a>
      <a class="nav-link" href="#badge">Badge</a>
    </details>
  </nav>
</aside>
```

- `.nav-list` + `.nav-link`: Actual's nav chrome
- Native `<details>`: exclusive accordion with `<details name>` (no JS engine)
- `data-enhance="scrollspy"`: scroll-driven `aria-current`
- `.scroller`: thin, theme-aware scrollbar
- No `.nav-heading` / `.nav-sublist` classes — the existing primitives are enough
