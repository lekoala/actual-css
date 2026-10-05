# Building with Actual CSS

Use Actual CSS as a vocabulary before writing application CSS.

The goal is not to eliminate custom CSS. The goal is to keep framework concerns in the framework and application identity in the application.

In short: **use Actual for generic structure and behavior; add product-specific
classes for brand and compositions rather than forcing a generic primitive.** A
local rule is not a failure of Actual — overfitting the framework to a
product-specific look is. Reach for an Actual primitive first, and write
application CSS when the need is genuinely product-specific (see §9–10). The
principles behind this order are in [Philosophy](../foundations/philosophy.md).

## 1. Start with the theme

Define palette values once, then derive decorative colors from them.

```css
[data-theme="brand"] {
  --primary: hsl(326 100% 60%);
  --secondary: hsl(187 100% 52%);

  --brand-glow:
    color-mix(in oklch, var(--primary) 40%, transparent);
  --brand-line:
    color-mix(in oklch, var(--secondary) 25%, transparent);
}
```

Avoid repeating literal palette colors elsewhere:

```css
/* Avoid */
.hero {
  box-shadow: 0 0 2rem hsl(326 100% 60% / 0.4);
}

/* Prefer */
.hero {
  box-shadow: 0 0 2rem var(--brand-glow);
}
```

**Rule:** keep palette literals inside the theme/token layer. Application styles should consume or derive tokens.

## 2. Choose layout by relationship

Do not choose a primitive because of the number of visible columns.

```text
Repeated items, intrinsic reflow   → .grid
Known equal peer density           → .grid-N
Peers that switch together         → .switcher
Main content + secondary region    → .sidebar-layout
Media + flexible content           → .media
Explicit 12-column placement       → .column-layout
Custom exact track template        → --grid-columns
```

For example, three panels that must all stack together are a `.switcher`, not automatically a `.grid-3`.

If local CSS mainly makes one layout primitive behave like another, reconsider the primitive first.

## 3. Keep outer spacing in the layout

Components own their internal rhythm; layout primitives own the space between
components.

```html
<div class="stack">
  <article class="card">…</article>
  <article class="card">…</article>
</div>
```

```css
/* Avoid */
.card + .card {
  margin-block-start: var(--space-50);
}
```

A card then moves between a stack, a grid or a sidebar without its outer
spacing to undo.

## 4. Tune before replacing

Actual primitives expose public hooks for common adjustments.

Prefer:

```css
.feature-grid {
  --grid-min: 18rem;
  --gap: var(--space-50);
}

.product-card {
  --card-pad: var(--space-50);
}

.product-actions {
  --cluster-justify: space-between;
}
```

`.product-actions` is an application class composed onto the primitive:
`<div class="cluster product-actions">`. The hook is read by `.cluster`, so the
CSS stays a local adjustment, not a reimplementation.

over reimplementing their layout:

```css
/* Avoid when an Actual primitive already owns this behavior */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(...);
}
```

**Rule:** tune the recipe before replacing the recipe.

`--gap` is inherited: set on a region, it re-spaces every nested stack, cluster
and grid too. Set it on the layout that reads it, as `.feature-grid` does above.
For a region's own rhythm, set the `gap` property instead; see
[Region rhythm](../layout/stack.md#region-rhythm-goes-on-gap-not-on-gap).

## 5. Reuse the existing vocabulary

Before introducing a generic application class, check whether Actual already expresses the idea.

Examples:

```text
Small uppercase label     → .overline
Unstyled list             → .list-reset
Readable line length      → .measure
Simple separator/dot      → .dot
Small alignment change    → existing utility
```

Application classes should primarily describe product-specific concepts, not recreate generic framework utilities.

## 6. Use structural component markup

When a component exposes meaningful structure, use it.

For cards, prefer semantic regions such as direct `header` and `footer` elements instead of reproducing their behavior inside arbitrary wrappers.

For transient application feedback, use `.status-bar`.

```html
<div
  class="status-bar"
  data-status
  role="status"
  aria-live="polite"
  aria-atomic="true"></div>
```

A status bar is for messages such as:

```text
Saved.
Item added.
Connection restored.
```

Persistent state such as metrics, availability, queue size or account information belongs in normal page content.

## 7. Style state through its attribute

Use the native attribute or the ARIA state the markup already needs, then
`data-*` for state with no equivalent. Classes stay for presentation.

```html
<a class="nav-link" aria-current="page">Settings</a>
<button class="btn primary" disabled>Save</button>
```

```css
.checkout-form[aria-busy="true"] { … }
```

Not `.nav-link.active` or `.is-disabled`: a state class duplicates the attribute
and drifts from it. Two runtime markers are off limits too:

- `data-enhance` turns behavior on; it is never a styling hook.
- `.is-*` classes (`.is-open`, `.is-static`) are runtime internals: neither set
  nor select them.

## 8. Bring third-party widgets onto the tokens

A date picker, rich text editor or data grid can come from a dedicated package.
Map its public visual hooks to Actual tokens instead of restyling it:

```css
.third-party-picker {
  --picker-bg: var(--surface-raised);
  --picker-border: var(--border);
  --picker-text: var(--text);
  --picker-focus: var(--focus);
}
```

The package keeps its behavior; the theme reaches it through the tokens.

## 9. Keep application CSS for application identity

Custom CSS is expected for things such as:

* brand marks and decorative treatments;
* unusual geometry;
* illustrations and visual effects;
* bespoke animation;
* product-specific compositions;
* product-specific responsive decisions.

These are healthy application styles:

```css
.brand-mark { ... }
.neon-glow { ... }
.ticket-cut { ... }
.signal-animation { ... }
```

The target is **not zero custom CSS**.

A better target is:

> No duplicated framework behavior and no palette literals outside the token layer.

## 10. Before adding a CSS rule

Ask, in this order:

1. Is there already a suitable layout primitive?
2. Is there already a component for this structure?
3. Can a public hook configure it?
4. Does an existing utility express the adjustment?
5. Can the color be derived from a theme token?
6. Does an attribute already name the state?
7. Is this genuinely application-specific CSS?

If the answer reaches step 7, write the CSS.

That is the intended integration model:

```text
Theme
  ↓
Choose the relationship
  ↓
Use the component
  ↓
Tune its hooks
  ↓
Use small utilities
  ↓
Add application identity
```
