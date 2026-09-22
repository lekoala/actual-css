# Explicit Column Layout

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

These layouts can be expressed with `--grid-columns` and application-specific `grid-column` rules, but that gives no shared canvas and makes every application redefine the same conventions — including the auto-placement trap described below.

## Decision

An opt-in 12-column horizontal composition primitive, placed through two hooks on each direct child:

```css
.column-layout {
  display: grid;
  gap: var(--gap);
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

:where(.column-layout) > * {
  --column-start: initial;
  --column-span: initial;

  grid-column-start: var(--column-start, auto);
  grid-column-end: span var(--column-span, calc(13 - var(--column-start, 1)));
  min-inline-size: 0;
}
```

```css
.main {
  --column-span: 8;
}

.aside {
  --column-span: 4;
}
```

The public API is one class and two hooks. No responsive behavior is implied. No row placement, ordering, named areas, breakpoint variants, offsets, or configurable column counts are part of the primitive.

## Why hooks rather than placement classes

A span and a start are two numbers. As classes they need twenty-four adapters (`.column-span-1` … `.column-start-12`) to encode CSS coordinates, and those adapters interact: a start class must also set the end line so it can stand alone, a span class must refine that end, and the only thing separating them at zero specificity is source order. The primitive then depended on a file order no browser reports when it breaks, guarded by a test whose only job was that order.

As custom properties the two inputs are independent. One rule reads both, and there is nothing to order.

Recomposition also stays inside the primitive's API. With classes, an application's container query had to leave the vocabulary and write `grid-column` itself. With hooks, it sets the same two properties the region was placed with.

The API does not require inline styles. The documented form puts the hooks on an application class; `style="--column-span: 8"` is a shortcut for a composition that never changes. An inline value outranks every rule, so coordinates that a container query recomposes belong on a class.

## One rule, four placements

```text
neither set        start auto, span 12       auto-placed, full canvas
span only          start auto, span N        auto-placed over N units
start only         start S,    span 13 - S   from line S to the canvas end
start and span     start S,    span N        explicit
```

### The start defaults to `auto`

The obvious way to write "full canvas" is `grid-column: 1 / -1`. It gives every child a **definite** column start of line 1, which removes it from column auto-placement. Two placed peers then both resolve to column 1 and the second is pushed to the next row:

```text
<section style="--column-span: 8">   row 1, columns 1-8
<aside style="--column-span: 4">     row 2, columns 1-4    ← not 9-12
```

Measured, not reasoned: the pair renders on two rows with a definite default start and on one row with an `auto` start, which `tests/browser/column-layout.test.js` asserts. Keeping the start `auto` until an author sets it lets auto-placement flow peers across the canvas.

### A start alone runs to the edge

With a fixed `span 12` default, `--column-start: 9` would place a region across lines 9 to 21 and add nine implicit columns. The span fallback is therefore derived from the start, `calc(13 - start)`, so a start alone always ends on the canvas edge. With no start, the same expression resolves to `span 12`.

`calc()` in an integer position resolves to a whole number once `var()` is substituted. Support for `calc()` in number contexts predates the CSS floor by years (Chrome 31, Firefox 48, Safari 6); the browser tests prove the four placements in Chromium.

### Coordinates are local to the grid item

Custom properties inherit. A nested `.column-layout` placed with `--column-start: 3; --column-span: 8` would hand those values to each of its own children, which would all land on line 3.

The reset is declared on each child, not on the canvas: the nested canvas needs its coordinates for its own position in the parent, and its children must start from nothing. `--column-start: initial` makes the property guaranteed-invalid, so `var()` takes its fallback. The rule has zero specificity, so any author rule on the child wins.

`@property { inherits: false }` would express the same thing, but it is above the CSS floor and two declarations already do the job.

## Why this is separate from `.grid`

`.grid` and `.grid-N` are collection primitives. They answer:

> How many peer items should fit here?

`.column-layout` answers a different question:

> Where should these distinct regions sit on a shared composition canvas?

A layout that happens to contain three regions is not automatically a column layout. If those regions are peers that should switch together, `.switcher` is the correct primitive. If one region is secondary to another, `.sidebar-layout` is usually the better choice.

Use `.column-layout` because **placement is part of the design**, not merely because the design contains columns.

| Need                                                   | Primitive         |
| ------------------------------------------------------ | ----------------- |
| Independent repeated items with intrinsic reflow       | `.grid`           |
| Equal-width peers with a known structural density      | `.grid-N`         |
| Peer regions that must switch together                 | `.switcher`       |
| Main content with a secondary region                   | `.sidebar-layout` |
| Media paired with flexible content                     | `.media`          |
| Explicit region placement on a shared 12-column canvas | `.column-layout`  |

> If local CSS mainly makes one layout primitive behave like another, reconsider the primitive before adding more CSS.

## Why twelve columns

Twelve provides useful subdivisions without requiring a configurable grid system: `6 + 6`, `4 + 4 + 4`, `3 + 3 + 3 + 3`, `8 + 4`, `9 + 3`, `2 + 8 + 2`.

A configurable `--column-count` would weaken the shared canvas: a span of 8 would mean different widths in different layouts, and the start-only fallback would need the count too. Applications that genuinely require a different track system should use `--grid-columns`.

## Base recipe

`minmax(0, 1fr)` is an invariant, not responsive behavior. It prevents the track definition itself from creating a min-content floor that forces the layout wider than its container. It does **not** guarantee that arbitrary content remains usable inside a very narrow span; that is an application composition problem.

The track template never reads `--gap`, so `gap` and the track count are independent at every width. This is worth stating because an author who has read the grid page will reasonably assume the opposite.

## Exceeding the canvas

When combining a start and a span, the author keeps `start + span - 1 <= 12`. Actual CSS does not guard against invalid combinations, and the failure is worth stating precisely because it is not local.

When a placement exceeds the explicit canvas, CSS Grid adds implicit columns at the end. `grid-auto-columns` defaults to `auto`, so an implicit column is sized by its content while the twelve `1fr` tracks divide whatever inline size is left. Every region shifts, not just the one carrying the invalid placement.

A pair that does not fit *without* explicit starts wraps instead: two eight-unit regions occupy sixteen units, so the second moves to the next row. That is correct grid behavior, not a canvas violation.

## Responsive contract

`.column-layout` has **no automatic responsive collapse**. Different compositions have different useful breakpoints:

* `8 + 4` may remain useful longer than `3 + 9`;
* a centered article may only need reduced side gutters;
* a dashboard may recombine from three regions into two before eventually stacking;
* an editorial layout may switch to a completely different representation on narrow screens.

A single framework threshold would be arbitrary, and a hidden one would force authors to undo it before writing their own. The author owns narrow-container behavior, and writes it with the same hooks:

```css
@container (width < 48rem) {
  .profile-main {
    --column-start: 1;
    --column-span: 6;
  }

  .profile-aside {
    --column-start: 7;
    --column-span: 6;
  }
}

@container (width < 32rem) {
  .profile-main,
  .profile-aside {
    --column-start: 1;
    --column-span: 12;
  }
}
```

The ability to recompose through intermediate states is part of the value of a coordinate system; the framework should not reduce every narrow layout to a single automatic stack.

`.container-query` is not required by `.column-layout`. An author uses it because their own rules use `@container` — the author uses a query container because the author wrote a container query.

## Narrow containers

With the default `--gap: 0.75rem` and a container measuring 279px at a 360px viewport, the eleven gaps take 132px. The twelve tracks divide the remaining 147px, roughly **12px per unit**: a four-unit region is 84px wide.

That number is the argument. There is no useful composition to guess at that width, which is precisely why the primitive does not try. For intrinsic responsive behavior, prefer `.grid`, `.switcher`, or `.sidebar-layout`.

## One-dimensional scope

Despite being implemented with CSS Grid, `.column-layout` exposes only horizontal column placement. There are no row, area, end-line, or order hooks. Applications remain free to use native CSS Grid where a genuinely two-dimensional composition requires it:

```css
.dashboard-summary {
  grid-row: 1 / span 2;
}
```

Keeping the API one-dimensional prevents the primitive from growing into a general-purpose grid DSL.

Visual reordering has consequences for reading order, keyboard navigation, and accessibility, and is not specific to this primitive. Authors should prefer DOM order that stays sensible when the composition changes.

## Direct-child box requirement

Placement applies to grid items. A direct child carrying coordinates must generate a box: with `display: contents`, its own box is removed, its descendants become grid items, and the coordinates no longer control them.

## Why this is opt-in

A general coordinate system is easy to misuse. Given `main + aside`, it is tempting to write an 8 + 4 composition even when `.sidebar-layout` already expresses the relationship with intrinsic responsive behavior. Likewise, three peer panels should not become three four-unit regions merely because the canvas makes that possible.

The primitive belongs to the Layout family but is not part of the core baseline, and its documentation makes the selection boundary explicit.

## Rejected alternatives

### Placement classes (`.column-span-N`, `.column-start-N`)

Rejected. Twenty-four classes encode two numbers, the start and span classes must be ordered in the source for a start alone to end on the canvas edge, and application recomposition has to leave the vocabulary to write `grid-column`. See [Why hooks rather than placement classes](#why-hooks-rather-than-placement-classes).

### Reset the hooks on the canvas

Rejected. A nested canvas is also a grid item of its parent; resetting on `.column-layout` would erase the coordinates it needs for its own placement.

### `@property` with `inherits: false`

Rejected for the base contract: above the CSS floor, and the per-child reset already keeps coordinates local.

### Make `.grid-N` support arbitrary spans

Rejected. `.grid-N` represents structural peer density. Arbitrary child placement would blur the distinction between a collection and a composition canvas.

### Use `.layout-grid` or `.columns`

Rejected. `.layout-grid` is confusing beside `.grid` and `.grid-N`; `.columns` is too generic and reads as CSS multi-column layout.

### Add `--column-count`

Rejected. Twelve columns are part of the primitive's contract.

### Add automatic container-query collapse, breakpoint variants, or offsets

Rejected. There is no universally correct threshold; breakpoint variants would move responsive strategy back into markup; `--column-start` already expresses native grid placement without a second, margin-based model.

### Add row placement, named areas, or ordering

Rejected for this scope. Row placement and areas belong to native Grid on an application class; ordering carries separate accessibility concerns.

## Decision summary

The primitive:

* uses twelve equal `minmax(0, 1fr)` tracks;
* places each direct child from `--column-start` and `--column-span`, in one rule;
* keeps the start `auto` until set, so auto-placement composes spans;
* derives the default span from the start, so a start alone ends on the canvas edge;
* resets both hooks on each child, so coordinates never leak into a nested canvas;
* provides no automatic responsive behavior and leaves recomposition to the application, through the same hooks;
* remains horizontal-only;
* complements rather than replaces `.grid`, `.grid-N`, `.switcher`, `.sidebar-layout`, and `.media`.
