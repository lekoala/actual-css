# Hierarchical scrollable nav

App shell with a collapsible nav tree. Uses existing primitives only — no treeview component.

**Related terms:** collapsible sidebar, nav group, sub-navigation, nested menu, expandable section, sidebar tree.

```html demo
<nav class="scroller" data-enhance="scrollspy" aria-label="Docs">
  <span class="overline">Documentation</span>
  <ul class="nav-list">
    <li>
      <details open>
        <summary class="nav-link">
          <i class="ti ti-rocket" aria-hidden="true"></i> Getting started
        </summary>
        <ul class="nav-list">
          <li><a class="nav-link" href="#intro">Introduction</a></li>
          <li><a class="nav-link" href="#install">Installation</a></li>
        </ul>
      </details>
    </li>
    <li>
      <details>
        <summary class="nav-link">
          <i class="ti ti-box" aria-hidden="true"></i> Components
        </summary>
        <ul class="nav-list">
          <li><a class="nav-link" href="#alert">Alert</a></li>
          <li><a class="nav-link" href="#badge">Badge</a></li>
        </ul>
      </details>
    </li>
  </ul>
</nav>
```

- A group is a `<details>` inside a row `<li>`, never a direct child of the
  `<ul>`. Its `<summary class="nav-link">` takes the row, hover and focus, and
  a chevron that follows the native `[open]` state.
- The group's links are a nested `.nav-list`, indented so its labels start
  under the parent label past a 1em icon. Set `--nav-list-indent` on the nav
  when the icons are larger.
- `.overline` labels a section of the nav.
- `<details name="…">` makes the groups an exclusive accordion, without
  JavaScript.
- `data-enhance="scrollspy"` sets `aria-current="location"` while the page
  scrolls; `.scroller` gives the nav a thin, theme-aware scrollbar.
