# Navigation List

Use `.nav-list` for a semantic list of navigation links.

It removes native list chrome but does not force a direction. Combine it with layout primitives depending on context.

```html demo
<div class="stack">
  <h2>Navigation</h2>
  <nav aria-label="Main navigation">
    <ul class="nav-list cluster">
      <li><a href="/docs">Docs</a></li>
      <li><a href="/components">Components</a></li>
      <li><a href="/examples">Examples</a></li>
    </ul>
  </nav>
  <h2>Documentation</h2>
  <nav aria-label="Documentation">
    <ul class="nav-list stack">
      <li><a href="/docs/getting-started" aria-current="page">Getting started</a></li>
      <li><a href="/docs/tokens">Tokens</a></li>
      <li><a href="/docs/layout">Layout</a></li>
      <li><a href="/docs/components">Components</a></li>
    </ul>
  </nav>
</div>
```

Use `.nav-list` for:

- header navigation
- side navigation
- footer navigation
- tab-like navigation lists
- documentation navigation

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
  <ul class="nav-list cluster">
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
      <ul class="nav-list cluster">
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
- `.nav-list` normalizes the navigation list.
- the inner `.cluster` arranges navigation items horizontally.

A project may add `.site-header` when it needs a visual shell.

```css
.site-header {
  border-block-end: 1px solid var(--border);
  background: var(--surface);
}
```

### App Shell With Sidebar

`.app-shell` (see Layout App Shell) covers the simple case: a single column stacked `header`/`main`/`footer`. A persistent-sidebar app — a dashboard, an admin panel — needs a second, distinct shape: a two-column grid where the sidebar collapses below a breakpoint. These are not the same primitive solving the same problem two ways; `.app-shell` has no sidebar at all.

```html
<div class="shell-sidebar">
  <aside class="shell-sidebar-nav" aria-label="Primary">
    <a class="navbar-brand" href="#"><span class="avatar primary"><abbr>AC</abbr></span> Product</a>
    <nav aria-label="Primary">
      <ul class="nav-list stack">
        <li><a class="nav-link" href="#" aria-current="page">Overview</a></li>
        <li><a class="nav-link" href="#">Settings</a></li>
      </ul>
    </nav>
  </aside>

  <div class="shell-sidebar-main">
    <header class="topbar">...</header>
    <main class="center">...</main>
  </div>
</div>
```

```css
.shell-sidebar {
  display: grid;
  grid-template-columns: 1fr;
  min-block-size: var(--viewport-block);
}

.shell-sidebar-nav {
  display: none;
  flex-direction: column;
  gap: var(--gap);
  inline-size: var(--shell-sidebar-size, 16rem);
  padding: var(--space-40);
  border-inline-end: var(--border-width) solid var(--border);
  background: var(--surface-raised);
}

.shell-sidebar-main {
  min-inline-size: 0;
}

@media (min-width: 64rem) {
  .shell-sidebar {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .shell-sidebar-nav {
    display: flex;
    position: sticky;
    inset-block-start: 0;
    block-size: var(--viewport-block);
    overflow-y: auto;
  }
}
```

The sidebar width is the one tunable a project reaches for often, so it is exposed as `--shell-sidebar-size` rather than hard-coded — override it locally (`style="--shell-sidebar-size: 18rem"` or in a project stylesheet) instead of forking the rule. The breakpoint stays a literal `64rem` in the media query: custom properties cannot be substituted into a media condition, so a project that genuinely needs a different one copies the rule rather than fighting the token.

Below the breakpoint, mirror the sidebar into a `.drawer` (see Components Drawer) for mobile access — the two are separate elements, not a responsive transform of one.

### Side Navigation

Side navigation is usually a `.nav-list` composed with `.stack`.

```html demo
<aside>
  <nav aria-label="Documentation">
    <ul class="nav-list stack">
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
    <ul class="nav-list stack">
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

### Optional Navigation Link Styling

`.nav-list` can stay purely structural. If the framework wants navigation links to have a default hit area and active state, this can be added as a lightweight visual pattern.

```css
.nav-list a {
  display: flex;
  align-items: center;
  gap: var(--space-20);
  min-block-size: 2rem;
  padding-inline: var(--space-20);
  border-radius: var(--radius-sm);
  color: inherit;
  text-decoration: none;
}

.nav-list a:hover {
  background: var(--surface-subtle);
}

.nav-list a[aria-current="page"] {
  background: var(--surface-subtle);
  font-weight: 600;
}
```

Keep this separate from layout primitives. `.cluster` and `.stack` should not style links.