## Patterns

> Small structural helpers for recurring semantic HTML shapes, between layout primitives and full components.

Patterns are small structural helpers for recurring semantic HTML shapes. They sit between layout primitives and full components.

They do not define page layout like `.stack`, `.cluster`, or `.grid`, and they do not provide a strong visual identity like `.alert`, `.card`, or `.btn`.

Use patterns when a semantic element needs a small amount of normalization before being composed with layout primitives or components.

### Principles

- Layout primitives control spatial behavior.
- Patterns normalize recurring semantic structures.
- Components provide visual identity, states, and interaction styling.
- Prefer composition over one-off component CSS.
- Avoid broad element selectors such as `nav ul` or `.alert menu`.
- A pattern should be useful in more than one component or context.

### Actions

Use `.actions` for a semantic list of actions.

It removes native list chrome and provides a baseline row layout (`display: flex`, wrap, shared gap). Compose with layout primitives only when you need a different direction or distribution.

```html{.stack}
<menu class="actions cluster">
  <li><button class="btn primary" type="button">Save</button></li>
  <li><button class="btn outline" type="button">Cancel</button></li>
</menu>

<menu class="actions stack">
  <li><a class="btn primary" href="/billing">Update billing</a></li>
  <li><a href="/support">Contact support</a></li>
</menu>
```

Use `.actions` for:

- dialog actions
- alert actions
- card actions
- toolbar actions
- form submit/cancel groups

Use layout primitives for contextual spacing.

```html
<div class="alert warning stack">
  <p>Your billing method has expired.</p>

  <menu class="actions cluster">
    <li><a class="btn danger sm" href="/billing">Update billing</a></li>
    <li><a href="/support">Contact support</a></li>
  </menu>
</div>
```

Prefer composition over making each component reimplement action-list layout.

```css
/* Avoid */
.alert > menu {
  display: flex;
  gap: var(--space-2);
  padding: 0;
  list-style: none;
}
```

### Navigation List

Use `.nav-list` for a semantic list of navigation links.

It removes native list chrome but does not force a direction. Combine it with layout primitives depending on context.

```html{.stack}
<nav aria-label="Main navigation">
  <ul class="nav-list cluster">
    <li><a href="/docs">Docs</a></li>
    <li><a href="/components">Components</a></li>
    <li><a href="/examples">Examples</a></li>
  </ul>
</nav>

<nav aria-label="Documentation">
  <ul class="nav-list stack">
    <li><a href="/docs/getting-started" aria-current="page">Getting started</a></li>
    <li><a href="/docs/tokens">Tokens</a></li>
    <li><a href="/docs/layout">Layout</a></li>
    <li><a href="/docs/components">Components</a></li>
  </ul>
</nav>
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

```html
<nav aria-label="Footer">
  <ul class="nav-list cluster">
    <li><a href="/privacy">Privacy</a></li>
    <li><a href="/terms">Terms</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

Links:
- https://picocss.com/docs/nav

### Header Navigation

Header navigation is usually a composition of landmarks, layout primitives, and patterns.

```html
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

Links:
- https://daisyui.com/components/navbar/

### Side Navigation

Side navigation is usually a `.nav-list` composed with `.stack`.

```html
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

```html
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
  gap: var(--space-2);
  min-block-size: 2rem;
  padding-inline: var(--space-2);
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

### Generic List

Use `.list-group` for rich content lists where each item may contain multiple elements.

```html
<figure class="list-group">
  <figcaption>Most played songs this week</figcaption>

  <ul>
    <li>
      <div class="avatar"><span>DL</span></div>
      <div>
        <div>Dio Lupa</div>
        <div class="muted">Remaining Reason</div>
      </div>
      <p>
        "Remaining Reason" became an instant hit, praised for its haunting sound
        and emotional depth.
      </p>
      <button class="btn ghost" aria-label="Play">
        <i class="ti ti-player-play"></i>
      </button>
    </li>
  </ul>
</figure>
```

`.list-group` is different from `.nav-list` and `.actions`.

- `.actions` is for action controls.
- `.nav-list` is for navigation links.
- `.list-group` is for structured content items.

If `.list-group` receives visual styling, document it as a component-like pattern rather than a layout primitive.

### Relationship With Layout

Patterns often compose with layout primitives.

```html
<menu class="actions cluster">...</menu>
<ul class="nav-list cluster">...</ul>
<ul class="nav-list stack">...</ul>
<section class="grid">...</section>
```

Avoid putting semantic resets into layout primitives.

```css
/* Avoid */
.stack {
  padding: 0;
  list-style: none;
}
```

`.stack` should remain useful for real content lists where markers are expected.

```html
<ul class="stack">
  <li>First important point</li>
  <li>Second important point</li>
  <li>Third important point</li>
</ul>
```

If list chrome should be removed, use an explicit pattern.

```html
<ul class="nav-list stack">
  <li><a href="/docs">Docs</a></li>
  <li><a href="/components">Components</a></li>
</ul>
```
