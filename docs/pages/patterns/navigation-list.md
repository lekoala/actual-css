# Navigation list

Arrange navigation links in vertical lists or horizontal rows using `.nav-list` and `.cluster`.

```html demo
<div class="stack">
  <h2>Navigation</h2>
  <nav aria-label="Main navigation">
    <ul class="cluster">
      <li><a href="/docs">Docs</a></li>
      <li><a href="/components">Components</a></li>
      <li><a href="/examples">Examples</a></li>
    </ul>
  </nav>
  <h2>Documentation</h2>
  <nav aria-label="Documentation">
    <ul class="nav-list">
      <li><a href="/docs/getting-started" aria-current="page">Getting started</a></li>
      <li><a href="/docs/tokens">Tokens</a></li>
      <li><a href="/docs/layout">Layout</a></li>
      <li><a href="/docs/components">Components</a></li>
    </ul>
  </nav>
</div>
```

## Usage

`.nav-list` removes native list chrome, stacks the rows and stretches each
`.nav-link` across the row. For a horizontal row of links, use `.cluster` on
the list, which removes the list chrome too.

Do not reset every list inside `nav`.

```css
/* Avoid */
nav ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
```

This is too broad and removes native list behavior from every navigation context, including nested documentation trees or rich content.

Prefer an explicit pattern class.

```html demo
<nav aria-label="Footer">
  <ul class="cluster">
    <li><a href="/privacy">Privacy</a></li>
    <li><a href="/terms">Terms</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

### Header Navigation

Header navigation is usually a composition of landmarks, layout primitives, and patterns.

```html demo
<header class="site-header">
  <div class="center cluster" style="--cluster-justify: space-between">
    <a class="brand" href="/">Actual CSS</a>

    <nav aria-label="Main navigation">
      <ul class="cluster">
        <li><a href="/docs">Docs</a></li>
        <li><a href="/components">Components</a></li>
        <li><a href="/examples">Examples</a></li>
      </ul>
    </nav>
  </div>
</header>
```

In this example:

- `header` provides the document landmark.
- `.center` constrains the content.
- `.cluster` arranges the brand and navigation.
- `nav` provides navigation semantics.
- the inner `.cluster` removes the list chrome and arranges the links horizontally.

A project may add `.site-header` when it needs a visual shell.

```css
.site-header {
  border-block-end: 1px solid var(--border);
  background: var(--surface);
}
```

### App shell with sidebar

A persistent sidebar beside the content — a dashboard, an admin panel — is
[`.sidebar-shell`](../layout/sidebar-shell.md): side by side from `64rem`, each
region scrolling on its own, and a drawer on a phone.

### Side Navigation

Side navigation is usually a `.nav-list` composed with `.stack`.

```html demo
<aside>
  <nav aria-label="Documentation">
    <ul class="nav-list">
      <li><a href="/docs/getting-started" aria-current="page">Getting started</a></li>
      <li><a href="/docs/tokens">Tokens</a></li>
      <li><a href="/docs/layout">Layout</a></li>
      <li><a href="/docs/components">Components</a></li>
    </ul>
  </nav>
</aside>
```

A project may add `.side-nav` only when it needs specific visual behavior such as indentation, sticky positioning, section labels, or active states.

```html demo
<aside class="side-nav">
  <nav aria-label="Documentation">
    <ul class="nav-list">
      <li><a href="/docs/getting-started" aria-current="page">Getting started</a></li>
      <li><a href="/docs/tokens">Tokens</a></li>
      <li><a href="/docs/layout">Layout</a></li>
    </ul>
  </nav>
</aside>
```

```css
.side-nav {
  font-size: var(--font-size-sm);
}

.side-nav a {
  color: inherit;
  text-decoration: none;
}

.side-nav a[aria-current="page"] {
  font-weight: 600;
}
```

### Link Styling

`.nav-link` gives a link its hit area, hover fill and `aria-current` state, in a
`.cluster` row or a `.nav-list` (see [Navbar](../components/navbar.md)). Set
`--gap` on a `.nav-list` to space its rows differently.
