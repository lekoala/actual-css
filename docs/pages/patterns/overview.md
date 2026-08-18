# Patterns

> Small structural helpers for recurring semantic HTML shapes, between layout primitives and full components.

Patterns are small structural helpers for recurring semantic HTML shapes. They sit between layout primitives and full components.

They do not define page layout like `.stack`, `.cluster`, or `.grid`, and they do not provide a strong visual identity like `.alert`, `.card`, or `.btn`.

Use patterns when a semantic element needs a small amount of normalization before being composed with layout primitives or components.

## Principles

- Layout primitives control spatial behavior.
- Patterns normalize recurring semantic structures.
- Components provide visual identity, states, and interaction styling.
- Prefer composition over one-off component CSS.
- Avoid broad element selectors such as `nav ul` or `.alert menu`.
- A pattern should be useful in more than one component or context.

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

```html demo
<ul class="stack">
  <li>First important point</li>
  <li>Second important point</li>
  <li>Third important point</li>
</ul>
```

If list chrome should be removed, use an explicit pattern.

```html demo
<ul class="nav-list stack">
  <li><a href="/docs">Docs</a></li>
  <li><a href="/components">Components</a></li>
</ul>
```