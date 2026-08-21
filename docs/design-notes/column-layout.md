# Explicit Column Layout

## Status

Proposed for Actual CSS 0.4.

## Problem

Actual CSS already provides several layout primitives with distinct responsive contracts:

* `.grid` for intrinsic collections whose item width drives reflow;
* `.grid-N` for equal-width structural collections with a known peer density;
* `.switcher` for peer regions that must switch together between horizontal and stacked layouts;
* `.sidebar-layout` for main content paired with a secondary region;
* `.media` for media paired with flexible content.

These primitives intentionally encode common layout relationships rather than exposing a general coordinate system.

There is still one legitimate case they do not cover well: **explicit composition where the placement of individual regions is itself part of the design**.

Examples include:

* an 8-column main region beside a 4-column supporting region;
* a centered 10-column article starting on column 2;
* a 3 / 6 / 3 application shell;
* editorial or dashboard compositions where regions must align to a shared column canvas.

Today these layouts can be expressed with `--grid-columns` and application-specific `grid-column` rules:

```css
.my-layout {
  --grid-columns: repeat(12, minmax(0, 1fr));
}

.my-main {
  grid-column: span 8;
}

.my-aside {
  grid-column: span 4;
}
```

This is already possible, but it provides no shared vocabulary and makes every application redefine the same placement conventions.

The missing feature is therefore not new CSS capability. It is a small, explicit composition vocabulary.

## Decision

Add an opt-in 12-column horizontal composition primitive:

```html
<div class="column-layout">
  <main class="column-span-8">
    ...
  </main>

  <aside class="column-span-4 column-start-9">
    ...
  </aside>
</div>
```

The public API is intentionally limited to:

```text
.column-layout
.column-span-1 … .column-span-12
.column-start-1 … .column-start-12
```

No responsive behavior is implied.

No row placement, ordering, named areas, breakpoint variants, offsets, or configurable column counts are part of the primitive.

## Why this is separate from `.grid`

`.grid` and `.grid-N` are collection primitives.

They answer questions such as:

> How many peer items should fit here?

or:

> Should these repeated items preserve a known structural density?

`.column-layout` answers a different question:

> Where should these distinct regions sit on a shared composition canvas?

The distinction is intentional.

A layout that happens to contain three regions is not automatically a column layout. If those regions are peers that should switch together, `.switcher` is the correct primitive. If one region is secondary to another, `.sidebar-layout` is usually the better choice.

Use `.column-layout` because **placement is part of the design**, not merely because the design contains columns.

## Choosing the primitive

Use the relationship between regions rather than their visual count.

| Need                                                   | Primitive         |
| ------------------------------------------------------ | ----------------- |
| Independent repeated items with intrinsic reflow       | `.grid`           |
| Equal-width peers with a known structural density      | `.grid-N`         |
| Peer regions that must switch together                 | `.switcher`       |
| Main content with a secondary region                   | `.sidebar-layout` |
| Media paired with flexible content                     | `.media`          |
| Explicit region placement on a shared 12-column canvas | `.column-layout`  |

A useful diagnostic is:

> If local CSS mainly makes one layout primitive behave like another, reconsider the primitive before adding more CSS.

## Why twelve columns

The column count is deliberately fixed at 12.

Twelve provides useful subdivisions without requiring a configurable grid system:

```text
6 + 6
4 + 4 + 4
3 + 3 + 3 + 3
8 + 4
9 + 3
2 + 8 + 2
```

The purpose of `.column-layout` is to provide a shared and predictable composition vocabulary.

A configurable `--column-count` would weaken that contract. It would also make utilities such as `.column-span-8` ambiguous once the underlying canvas no longer had twelve units.

Applications that genuinely require a different track system should use custom CSS or `--grid-columns`.

## Base recipe

The primitive uses twelve equal tracks with zero intrinsic minimum:

```css
.column-layout {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--gap);
}
```

Using `minmax(0, 1fr)` is an invariant, not responsive behavior.

It prevents the track definition itself from creating a min-content floor that forces the layout wider than its container.

It does **not** guarantee that arbitrary content will remain usable inside a very narrow span.

A two-column span in a narrow container may still be too small for its content. That is an application composition problem, not something the primitive should guess how to solve.

## Gap utilities are exact here

`grid.css` documents a pitfall: `.gap-sm` and `.gap-lg` set the `gap` property without updating `--gap`, and the unwrapped `.grid-N` baseline sizes its tracks from `--gap`, so the two disagree and a bare `.grid-4.gap-lg` stops one column short.

`.column-layout` has no such coupling. Its track template is `repeat(12, minmax(0, 1fr))` and never reads `--gap` for sizing, so `gap` and the track count are independent. Every gap utility is exact at every width.

This is worth stating explicitly because an author who has read the grid page will reasonably assume the opposite.

## Default child behavior

Unplaced direct children span the full canvas:

```css
:where(.column-layout) > * {
  grid-column-end: span 12;
  min-inline-size: 0;
}
```

This gives the primitive a safe failure mode. Without an explicit placement class, an element remains a normal full-width region instead of implicitly occupying one of twelve very narrow tracks.

Placement is therefore opt-in per child, and a heading or a full-width intro can sit in the same canvas as placed regions without carrying a class of its own.

The span form is load-bearing. The obvious alternative is:

```css
/* Rejected. */
:where(.column-layout) > * {
  grid-column: 1 / -1;
}
```

That gives every child a **definite** column start of line 1, which removes it from column auto-placement. Two placed peers then both resolve to column 1 and the second is pushed to the next row:

```text
<section class="column-span-8">   row 1, columns 1-8
<aside class="column-span-4">     row 2, columns 1-4    ← not 9-12
```

Measured, not reasoned: the pair renders at `top=8` and `top=26` with the shorthand reset, and at `top=8`/`top=8` with the span reset. Expressing the default as a span keeps the start line `auto`, so auto-placement continues to flow peers across the canvas.

## Placement tiers and source order

The primitive is three zero-specificity tiers, and **only source order separates them**:

```text
1. :where(.column-layout) > *    auto-placed, spanning the whole canvas
2. :where(.column-start-N)       a definite start line, running to the canvas end
3. :where(.column-span-N)        the end only, refining either of the above
```

Because every tier resolves to specificity `(0,0,0)`, reordering the file changes behavior silently:

* moving tier 3 above tier 2 makes every `start + span` pair run to column 12;
* moving either above tier 1 makes every placement full-span.

Neither failure produces an error, an override warning, or a visibly broken canvas — both look like a plausible layout. The order is therefore asserted twice: `tests/css-audit.test.js` locks the order of the blocks in the source file, and `tests/browser/column-layout.test.js` locks the geometry the order produces.

This is the cost of the zero-specificity design, and it is worth paying: the alternative is placement classes at normal class specificity, which would put every application-owned recomposition rule back into a source-order tie with the framework.

## Span utilities

Span utilities set only the column span:

```css
:where(.column-span-1) {
  grid-column-end: span 1;
}

:where(.column-span-2) {
  grid-column-end: span 2;
}

/* … */

:where(.column-span-12) {
  grid-column-end: span 12;
}
```

For example:

```html
<div class="column-layout">
  <section class="column-span-8">...</section>
  <aside class="column-span-4">...</aside>
</div>
```

With normal grid auto-placement, this produces an 8 / 4 composition: neither child has a definite start line, so the aside flows into columns 9-12.

Auto-placement also means a pair that does not fit wraps rather than overflowing. Two `column-span-8` regions occupy sixteen units, so the second moves to the next row. That is correct grid behavior, not a canvas violation.

## Start utilities

Start utilities set the explicit starting grid line:

```css
:where(.column-start-1) {
  grid-column: 1 / -1;
}

:where(.column-start-2) {
  grid-column: 2 / -1;
}

/* … */

:where(.column-start-12) {
  grid-column: 12 / -1;
}
```

This allows deliberate offsets without introducing a separate margin-based `offset-*` abstraction.

Each start utility also sets the end line to `-1`, so a start used **without** a span runs to the edge of the canvas:

```html
<aside class="column-start-9">...</aside>
```

occupies columns 9 through 12. The alternative — setting `grid-column-start` alone — would leave the tier 1 default of `span 12` in place and place the region across lines 9 to 21, adding nine implicit columns. A single class must not be able to do that.

A `column-span-*` on the same element then refines the end, because tier 3 follows tier 2 in source order.

For example:

```html
<div class="column-layout">
  <article class="column-span-10 column-start-2">
    ...
  </article>
</div>
```

The article occupies columns 2 through 11.

When combining `column-start-S` and `column-span-N`, the author must keep the placement inside the twelve-column canvas:

```text
S + N - 1 <= 12
```

For example:

```text
start 9 + span 4 → valid
start 10 + span 4 → exceeds the canvas
```

Actual CSS does not attempt to guard against invalid combinations, and the failure is worth stating precisely because it is not local.

When a placement exceeds the explicit canvas, CSS Grid adds implicit columns at the end. `grid-auto-columns` defaults to `auto`, so an implicit column is sized by its content while the twelve `1fr` tracks divide whatever inline size is left. Every region in the canvas therefore shifts, not just the region carrying the invalid placement — a thirteenth column silently re-scales the coordinate system for everything else.

## Low specificity is intentional

Placement utilities use `:where()` so their specificity remains zero.

This makes application-owned recomposition additive rather than corrective.

For example:

```html
<div class="container-query">
  <div class="column-layout profile-layout">
    <main class="column-span-8 profile-main">...</main>
    <aside class="column-span-4 column-start-9 profile-aside">...</aside>
  </div>
</div>
```

The application can later redefine placement with a normal class selector:

```css
@container (width < 48rem) {
  .profile-main {
    grid-column: 1 / span 6;
  }

  .profile-aside {
    grid-column: 7 / span 6;
  }
}
```

The author does not need to undo framework specificity before applying a new composition.

Normal cascade-layer rules still apply. If application CSS is placed in an earlier layer than Actual CSS, layer order can still take precedence over selector specificity.

## Responsive contract

`.column-layout` has **no automatic responsive collapse**.

This is deliberate.

Different compositions have different useful breakpoints:

* `8 + 4` may remain useful longer than `3 + 9`;
* a centered article may only need reduced side gutters;
* a dashboard may recombine from three regions into two before eventually stacking;
* an editorial layout may switch to a completely different representation on narrow screens.

A single framework threshold would therefore be arbitrary.

It would also recreate a hidden two-part contract where a layout class silently changes behavior only when combined with a wrapper or breakpoint rule.

Actual CSS does not make that decision.

The author owns narrow-container behavior.

## Author-owned recomposition

A simple composition may stack completely:

```css
@container (width < 40rem) {
  .profile-layout > * {
    grid-column: 1 / -1;
  }
}
```

A more complex composition can preserve the coordinate system through intermediate states.

For example, desktop:

```text
[              MAIN 8              ][   ASIDE 4   ]
```

Intermediate:

```text
[         MAIN 6        ][        ASIDE 6         ]
```

Narrow:

```text
[                     MAIN                     ]
[                    ASIDE                     ]
```

Implementation:

```css
@container (width < 48rem) {
  .profile-main {
    grid-column: 1 / span 6;
  }

  .profile-aside {
    grid-column: 7 / span 6;
  }
}

@container (width < 32rem) {
  .profile-main,
  .profile-aside {
    grid-column: 1 / -1;
  }
}
```

This ability to deliberately recompose regions is part of the value of a coordinate system.

The framework should not reduce every narrow layout to a single automatic stack.

## Relationship with `.container-query`

`.container-query` is not required by `.column-layout`.

The primitive does not inspect container width and does not contain hidden container-query behavior.

An author may choose to use `.container-query` because their own responsive rules use `@container`:

```html
<div class="container-query">
  <div class="column-layout profile-layout">
    ...
  </div>
</div>
```

In that case, the dependency is explicit:

> the author uses a query container because the author wrote a container query.

This is intentionally different from a framework primitive whose responsive contract depends on an unrelated wrapper being present.

## Narrow containers

A twelve-column coordinate system is primarily a wide-context composition tool.

At narrow widths, individual tracks can become extremely small, and eleven gaps consume a large share of the available inline size rather than a marginal one.

With the default `--gap: 0.75rem` and a `.center` container measuring 279px at a 360px viewport, the eleven gaps take 132px. The twelve tracks divide the remaining 147px, which is roughly **12px per unit**: a `column-span-4` region is 84px wide.

That number is the argument. There is no useful composition to guess at that width, which is precisely why the primitive does not try.

The framework guarantees that the explicit track definition can shrink:

```css
repeat(12, minmax(0, 1fr))
```

It does not guarantee that every arbitrary span remains a useful content width.

Applications should define an appropriate narrow representation where necessary.

This is not considered a failure of the primitive. The purpose of `.column-layout` is explicit composition, not intrinsic reflow.

For intrinsic responsive behavior, prefer `.grid`, `.switcher`, or `.sidebar-layout`.

## One-dimensional scope

Despite being implemented with CSS Grid, `.column-layout` exposes only horizontal column placement.

Actual CSS does not provide:

```text
.row-span-*
.row-start-*
.area-*
.column-end-*
```

as part of this primitive.

Applications remain free to use native CSS Grid features where a genuinely two-dimensional composition requires them:

```css
.dashboard-summary {
  grid-row: 1 / span 2;
}
```

Keeping the framework API one-dimensional prevents the primitive from growing into a general-purpose grid DSL.

The `column-*` prefix is reserved for placement on this canvas. If Actual CSS later needs CSS multi-column utilities, they must not be named `column-count-*` or `column-width-*` under the same prefix — the two concepts would be indistinguishable in markup. A separate name such as `text-columns-*` keeps the coordinate domain unambiguous.

## Source order and `order`

`column-layout` does not provide `order-*` utilities.

Visual reordering has consequences for reading order, keyboard navigation, and accessibility. It is also not specific to the column-layout primitive.

If Actual CSS introduces ordering utilities in the future, they should be designed and documented independently.

Authors should prefer DOM order that remains sensible when the composition changes.

## Direct-child box requirement

Placement applies to grid items.

A direct child carrying `column-span-*` or `column-start-*` must therefore generate a box.

Avoid:

```css
.region {
  display: contents;
}
```

when `.region` is the element carrying column placement.

With `display: contents`, the element's own box is removed and its descendants become grid items instead. The `grid-column-*` values assigned to the boxless element no longer control those descendants.

This is a general limitation of box-dependent layout primitives, not something `.column-layout` attempts to compensate for.

## Relationship with `--grid-columns`

Before `.column-layout`, custom `--grid-columns` was the only built-in escape hatch for arbitrary asymmetric track systems.

After introducing `.column-layout`, the responsibilities become clearer:

Use `.column-layout` when distinct regions need explicit spans or starts on a standard twelve-column canvas.

Use `--grid-columns` for genuinely custom track templates that do not fit existing primitives or the twelve-column composition model.

For example:

```css
.custom-layout {
  --grid-columns: minmax(12rem, 18rem) 1fr minmax(10rem, 14rem);
}
```

is still a legitimate custom grid because its tracks encode meaningful sizing rather than twelve interchangeable coordinate units.

## Why this is opt-in

A general coordinate system is easy to misuse.

Given:

```text
main + aside
```

it is tempting to write:

```html
<div class="column-layout">
  <main class="column-span-8">...</main>
  <aside class="column-span-4">...</aside>
</div>
```

even when `.sidebar-layout` already expresses the relationship and provides a more appropriate intrinsic responsive behavior.

Likewise, three peer panels should not become three `column-span-4` regions merely because the coordinate system makes that possible.

The primitive therefore belongs to the Layout family but is not part of the core baseline.

Its documentation must make the selection boundary explicit.

The convenience of `column-layout` should not turn every layout problem into coordinate arithmetic.

## Rejected alternatives

### Make `.grid-N` support arbitrary spans

Rejected.

`.grid-N` represents structural peer density. Adding arbitrary child placement would blur the distinction between a collection and an explicit composition canvas.

### Use `.layout-grid`

Technically accurate, but potentially confusing beside `.grid` and `.grid-N`.

The public concept exposed to authors is a column composition system. CSS Grid is its implementation mechanism.

### Use `.columns`

Rejected as too generic and potentially confused with CSS multi-column layout.

### Use `.span-N` and `.start-N`

Rejected because the class names are overly broad and would reserve generic application vocabulary.

`column-span-N` and `column-start-N` make the coordinate domain explicit.

### Add `--column-count`

Rejected.

Twelve columns are part of the primitive's contract. A configurable track count would make the placement vocabulary inconsistent and weaken interoperability between layouts.

### Give unplaced children `grid-column: 1 / -1`

Rejected, after measurement.

It reads as the natural way to express "spans the whole canvas", but the shorthand sets a definite `grid-column-start: 1` on every child, which removes all of them from column auto-placement. `.column-span-8` beside `.column-span-4` then stacks instead of composing 8 + 4, because both children resolve to column 1.

Every placed region would need an explicit `column-start-*`, turning the most common two-region composition into coordinate arithmetic. `grid-column-end: span 12` gives the same default width while leaving the start line `auto`.

### Add automatic container-query collapse

Rejected.

There is no universally correct threshold for arbitrary per-region compositions.

A hidden default would also force authors with different requirements to undo framework behavior before implementing their intended layout.

### Add breakpoint variants

Rejected.

Classes such as:

```text
md-column-span-6
lg-column-span-4
```

would recreate a breakpoint-driven layout DSL and move responsive strategy back into markup.

Author-owned CSS and container queries are preferred.

### Add offset utilities

Rejected.

`column-start-N` directly expresses native grid placement and avoids introducing a second, margin-based placement model.

### Add row placement and named areas

Rejected for the initial scope.

The primitive intentionally provides only horizontal coordinate placement.

### Add ordering utilities

Rejected as unrelated to the primitive and carrying separate accessibility concerns.

## Decision summary

Actual CSS will provide an explicit, opt-in twelve-column composition vocabulary:

```text
.column-layout
.column-span-1 … .column-span-12
.column-start-1 … .column-start-12
```

The primitive:

* uses twelve equal `minmax(0, 1fr)` tracks;
* gives unplaced direct children full-width placement, expressed as a span so auto-placement keeps working;
* uses low-specificity placement utilities in three source-order-dependent tiers;
* provides no automatic responsive behavior;
* leaves narrow-container recomposition to the application;
* remains horizontal-only;
* provides no order, row, area, breakpoint, offset, or configurable-count API;
* requires placed children to generate grid-item boxes;
* complements rather than replaces `.grid`, `.grid-N`, `.switcher`, `.sidebar-layout`, and `.media`.

The purpose is not to add layout capability that CSS Grid does not already provide.

The purpose is to give explicit application and editorial compositions a small, shared, readable coordinate vocabulary without weakening the intrinsic layout primitives used everywhere else.
