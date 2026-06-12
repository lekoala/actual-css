# Utilities

Utilities are a small escape hatch for common single-purpose needs. They should support composition, not become the primary way to build UI.

- Prefer semantic HTML, components, and layout primitives first.
- Add utilities only when the rule is broadly useful and unlikely to become a component.
- Keep utility names stable, boring, and few.
- Do not add spacing, color, width, breakpoint, or state utility scales by default.
- Utilities should use logical properties where relevant.

## Accessibility

### Screen Reader Only

Use `.sr-only` for text that should be available to assistive technology but visually hidden.

```html
<button class="btn ghost" type="button">
  <i class="ti ti-menu-2" aria-hidden="true"></i>
  <span class="sr-only">Open navigation</span>
</button>
```

```css
.sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Links:
- https://piccalil.li/blog/a-modern-css-reset/
- https://www.a11yproject.com/posts/how-to-hide-content/

## Overflow

> Explicit overflow handling for content that may exceed its container.

Use `.overflow-auto` when content may overflow its container, especially tables and code-like regions.

```html
<div class="overflow-auto">
  <table class="table">
    <caption>Team members</caption>
    <thead>
      <tr>
        <th>Name</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice Johnson</td>
        <td>Admin</td>
      </tr>
    </tbody>
  </table>
</div>
```

```css
.overflow-auto {
  overflow: auto;
}
```

Links:
- https://getbootstrap.com/docs/5.3/content/tables/#responsive-tables
- https://picocss.com/docs/overflow-auto

## Flex Helpers

> Small flex helpers for grow behavior and other one-line needs.

### Grow

Use `.grow` when one item in a flex layout should take available space without overflowing.

```html
<header class="cluster">
  <a href="/" class="brand">Actual CSS</a>
  <nav class="grow" aria-label="Main navigation">
    <a href="/docs">Docs</a>
    <a href="/components">Components</a>
  </nav>
  <button class="btn ghost" type="button">Menu</button>
</header>
```

```css
.grow {
  flex: 1 1 auto;
  min-inline-size: 0;
}
```

## Text Helpers

> Lightweight helpers for muted or secondary text without a full color scale.

### Muted

Use `.muted` for secondary text when no semantic element already carries the meaning.

```html
<p class="muted">Last updated June 12, 2026.</p>
```

```css
.muted {
  color: var(--text-muted);
}
```

Do not create a full text color utility scale. Intent colors belong to components and state, not arbitrary text decoration.

## Shape Helpers

> Rare shape utilities for cases that must be perfectly round or square.

Shape utilities should be rare because shape is mostly theme-level.

### Circle

Use `.circle` only when an element must be perfectly round.

```html
<img class="circle" src="/avatar.jpg" alt="Jane Doe" width="48" height="48" />
```

```css
.circle {
  --radius: 999px;
  border-radius: 999px;
}
```

Do not add `.rounded-sm`, `.rounded-lg`, `.square`, or `.pill` unless repeated real use proves they are needed.

## Non-Goals

> Utilities deliberately excluded to keep the surface small and intentional.

- No margin and padding scales such as `.mt-4` or `.p-2`.
- No display scale such as `.block`, `.flex`, `.grid`.
- No color scales such as `.text-primary` or `.bg-success`.
- No breakpoint utility variants.
- No utility variants for hover, focus, dark mode, or arbitrary selectors.

Links:
- https://github.com/knadh/oat/blob/master/src/css/utilities.css
