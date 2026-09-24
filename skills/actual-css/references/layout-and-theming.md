# Layout and theming

## Integration order

Translate designs in this order:

```text
Theme -> relationship -> component -> public hook -> small utility -> application identity
```

## Theme first

Keep palette literals centralized in a theme/token block. Application rules should consume or derive semantic values rather than copy palette literals repeatedly.

```css
[data-theme="brand"] {
  --primary: hsl(326 100% 60%);
  --brand-glow: color-mix(in oklch, var(--primary) 40%, transparent);
}

.hero {
  box-shadow: 0 0 2rem var(--brand-glow);
}
```

Global semantic tokens are the first choice for application CSS. Component hooks are local tuning points.

## Choose layout by relationship

```text
.stack           vertical flow
.cluster         wrapping inline peers / toolbar-like rows
.grid            responsive repeated items
.grid-N          known equal peer density
.switcher        peer regions that switch together
.sidebar-layout  main content plus secondary region
.media           fixed media plus flexible content
.column-layout   explicit shared-canvas placement
```

For exact tracks that do not match a built-in contract, use `.grid` with `--grid-columns` rather than inventing a new generic grid primitive.

Do not choose `.app-layout` just because the product is an app. It is a specific viewport-sized shell with internal scrolling and adaptive navigation.

## Tune before replacing

Prefer public hooks:

```css
.feature-grid {
  --grid-min: 18rem;
  --gap: var(--space-50);
}

.product-card {
  --card-pad: var(--space-50);
}
```

If local CSS mainly reconstructs an Actual primitive with `display`, tracks, gaps, focus styling, or component geometry, reconsider the primitive or its hooks first.

## `--gap` and local `gap`

`--gap` can be an inherited rhythm contract. Rebinding it may intentionally affect nested layout primitives.

If only one element's spacing should change, set the CSS `gap` property directly instead of rebinding inherited rhythm.

## Public vs internal custom properties

Use documented public hooks. Treat runtime-written, state-owned, derived, relay, and undocumented variables as internal.

A component-scoped hook does not exist everywhere. If application CSS intentionally reads one outside its component, provide a fallback:

```css
.panel {
  padding: var(--card-pad, var(--space-40));
}
```

## Application CSS is expected

Good application CSS includes brand marks, illustrations, unusual geometry, bespoke animation, and product-specific compositions. The goal is not zero custom CSS; it is no duplicated framework behavior.
