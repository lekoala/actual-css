# Patterns

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

## Actions

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

## Navigation List

Use `.nav-list` for a semantic list of navigation links.

It removes native list chrome but does not force a direction. Combine it with layout primitives depending on context.

```html{.stack}
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

### App Shell With Sidebar

`.app-shell` (see [Layout → Header And Footer](layout.md#header-and-footer)) covers the simple case: a single column stacked `header`/`main`/`footer`. A persistent-sidebar app — a dashboard, an admin panel — needs a second, distinct shape: a two-column grid where the sidebar collapses below a breakpoint. These are not the same primitive solving the same problem two ways; `.app-shell` has no sidebar at all.

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
  padding: var(--space-4);
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

Below the breakpoint, mirror the sidebar into a `.drawer` (see [UI → Drawer](ui.md#drawer)) for mobile access — the two are separate elements, not a responsive transform of one.

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

## Icon Input

Use `.input-icon` for a search or filter input with a leading icon.

```html
<label class="input-icon">
  <i class="ti ti-search" aria-hidden="true"></i>
  <input class="input" type="search" placeholder="Search accounts, invoices, notes" aria-label="Search">
</label>
```

It positions the wrapper's first child absolutely inside a relative container and grows the input's start padding to clear it. `pointer-events: none` on the icon keeps clicks passing through to the input underneath. It is icon-library agnostic — an `<i>` webfont icon, an inline `<svg>`, or a `<span>` all work as the wrapper's first child.

The icon keeps a fixed `--input-icon-size` (1.25rem); density contexts shrink
the control geometry around it, not the pictogram. Apply the density class to
the wrapper and to the input so the control height follows:

```html{.stack}
<label class="input-icon sm">
  <i class="ti ti-search" aria-hidden="true"></i>
  <input class="input sm" type="search" aria-label="Search">
</label>
```

Trailing icons (e.g. a clear button) aren't covered by this class — it only handles the leading case.

## Structured Lists

Use native lists plus layout primitives for rich content rows. Reset list chrome only when markers are not part of the content.

```html
<figure class="stack">
  <figcaption><strong>Most played songs this week</strong></figcaption>

  <ul class="list-reset stack gap-none">
    <li class="media items-center py" style="border-block-end: var(--border-width) solid var(--border)">
      <div class="avatar">
        <img src="https://i.pravatar.cc/48?img=5" alt="Dio Lupa" />
      </div>
      <div class="cluster">
        <div class="stack grow" style="--gap: var(--space-1)">
          <strong>Dio Lupa</strong>
          <span class="muted">Remaining Reason</span>
        </div>
        <span class="muted">3:45</span>
        <button class="btn ghost" type="button" aria-label="Play">
          <i class="ti ti-player-play" aria-hidden="true"></i>
        </button>
      </div>
    </li>

    <li class="media items-center py" style="border-block-end: var(--border-width) solid var(--border)">
      <div class="avatar">
        <img src="https://i.pravatar.cc/48?img=10" alt="Astral Planes" />
      </div>
      <div class="cluster">
        <div class="stack grow" style="--gap: var(--space-1)">
          <strong>Astral Planes</strong>
          <span class="muted">Neon Drift</span>
        </div>
        <span class="muted">4:12</span>
        <button class="btn ghost" type="button" aria-label="Play">
          <i class="ti ti-player-play" aria-hidden="true"></i>
        </button>
      </div>
    </li>
  </ul>
</figure>
```

Use `.actions` for action controls and `.nav-list` for navigation links. For structured content items, compose `.list-reset`, `.stack`, `.cluster`, `.media`, and components directly.

`.media` is a two-slot object: it lays out exactly two children — the leading element and one content column. Trailing metadata and actions belong inside the content column (nest a `.cluster` and put `.grow` on the flexible part), never as extra row children: additional children silently wrap onto a second grid row.

## Relationship With Layout

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

## Hierarchical scrollable nav

App shell with a collapsible nav tree. Uses existing primitives only — no
treeview component.

```html
<aside class="sidebar">
  <nav class="nav-list scroller" data-enhance="scrollspy" aria-label="Docs">
    <details open>
      <summary class="nav-heading">Getting started</summary>
      <a class="nav-link" href="#intro">Introduction</a>
      <a class="nav-link" href="#install">Installation</a>
    </details>
    <details>
      <summary class="nav-heading">Components</summary>
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

## Code block with copy button

```html
<div class="code-block">
  <pre><code>npm install actual-css</code></pre>
  <button class="btn sm ghost" data-copy>Copy</button>
</div>
```

```css
.code-block { position: relative; }
.code-block > [data-copy] {
  position: absolute;
  inset-block-start: var(--space-2);
  inset-inline-end: var(--space-2);
}
```

```js
import enhance from "actual-css/js/enhance";

enhance({
  "[data-copy]": (button) => {
    const controller = new AbortController();
    button.addEventListener("click", async () => {
      const code = button.closest(".code-block")?.querySelector("code");
      if (code) await navigator.clipboard.writeText(code.textContent);
    }, { signal: controller.signal });
    return () => controller.abort();
  },
});
```

No core JS, no syntax highlighter — the recipe is the documentation.

## `<details name>` exclusive accordion

Browsers that support the `name` attribute on `<details>` get native exclusive
accordions — no JS engine needed. Omit `name` to allow several open at once.

```html
<details name="faq" open>
  <summary>What is this?</summary>
  <p>A CSS framework.</p>
</details>
<details name="faq">
  <summary>Does it need JS?</summary>
  <p>Only the progressive enhancers you import.</p>
</details>
```

Not shipping an accordion JS engine is a design decision, not a gap.

## Intent nesting

Intent on an ancestor must not tint nested components, and a local intent inside
an intent-carrying ancestor must win. Both directions are verified in
`tests/css-audit.test.js` and the kitchen-sink demo template. Every
intent-consuming component must declare its `@sync intent-boundary` block —
that is what prevents inheritance from leaking across components.
