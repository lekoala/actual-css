# Building with Actual CSS

Use Actual CSS as a vocabulary before writing application CSS.

The goal is not to eliminate custom CSS. The goal is to keep framework concerns in the framework and application identity in the application.

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

## 3. Tune before replacing

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

.actions {
  --cluster-justify: space-between;
}
```

over reimplementing their layout:

```css
/* Avoid when an Actual primitive already owns this behavior */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(...);
}
```

**Rule:** tune the recipe before replacing the recipe.

## 4. Reuse the existing vocabulary

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

## 5. Use structural component markup

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

## 6. Keep application CSS for application identity

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

## 7. Before adding a CSS rule

Ask, in this order:

1. Is there already a suitable layout primitive?
2. Is there already a component for this structure?
3. Can a public hook configure it?
4. Does an existing utility express the adjustment?
5. Can the color be derived from a theme token?
6. Is this genuinely application-specific CSS?

If the answer reaches step 6, write the CSS.

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
