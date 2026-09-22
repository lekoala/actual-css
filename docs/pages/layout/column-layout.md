# Column Layout

`.column-layout` is an explicit twelve-column composition canvas. Each direct
child places itself with two numbers: `--column-span` (how many units) and
`--column-start` (which line it begins on).

Reach for it when the placement of each region **is** the design. If the regions
are a collection, a known density, peers that switch together, or a main region
with an aside, one of the other primitives already says so — and says it with
intrinsic responsive behavior this one does not have.

```css
.article-main {
  --column-span: 8;
}

.article-aside {
  --column-span: 4;
}
```

```html demo
<div class="column-layout">
  <main class="card" style="--column-span: 8">Main — 8 columns</main>
  <aside class="card" style="--column-span: 4">Aside — 4 columns</aside>
</div>
```

The hooks are plain CSS: set them from an application class, or inline as a
shortcut for a composition that never changes. Neither child names a start
line, so grid auto-placement flows the aside into columns 9 through 12.

## Spans

A span declares how many of the twelve units a region occupies.

```html demo
<div class="column-layout">
  <div class="card" style="--column-span: 3">3</div>
  <div class="card" style="--column-span: 6">6</div>
  <div class="card" style="--column-span: 3">3</div>
</div>
```

A child with no coordinates spans the whole canvas, so a heading can share the
canvas with placed regions without setting anything.

```html demo
<div class="column-layout">
  <h3>Full canvas — nothing set</h3>
  <div class="card" style="--column-span: 4">4</div>
  <div class="card" style="--column-span: 4">4</div>
  <div class="card" style="--column-span: 4">4</div>
</div>
```

Regions that do not fit wrap to the next row, as any grid does. Two eight-unit
regions need sixteen units, so the second moves down.

## Starts

A start declares the line a region begins on. This replaces margin-based
offsets and is direction-independent: line 1 is the inline start, so the
placement flips with `dir="rtl"` on its own.

```html demo
<div class="column-layout">
  <article class="card" style="--column-start: 2; --column-span: 10">
    Columns 2 through 11
  </article>
</div>
```

Used without a span, a start runs to the end of the canvas.

```html demo
<div class="column-layout">
  <aside class="card" style="--column-start: 9">Columns 9 through 12</aside>
</div>
```

Keep a combined placement inside the canvas: `start + span - 1 <= 12`. Start 9
with span 4 is valid; start 10 with span 4 is not. Exceeding the canvas adds a
thirteenth, content-sized column, and every other region shrinks with it — the
failure is canvas-wide, not local to the region you got wrong.

## Cross-section alignment

The canvas is shared across sibling sections, so regions in different sections
can line up on the same columns — something a collection or a sidebar cannot
guarantee. This is the case no other primitive can replace.

```html demo
<div class="stack">
  <div class="column-layout">
    <h3 style="--column-start: 3; --column-span: 8">Feature title</h3>
    <p class="muted" style="--column-start: 3; --column-span: 8">Kicker aligned to the same line.</p>
  </div>

  <div class="column-layout">
    <p style="--column-start: 3; --column-span: 8">
      Body copy starts on the same column as the title above and spans the same
      eight columns.
    </p>
    <aside class="card" style="--column-start: 11; --column-span: 2">Inline note</aside>
  </div>
</div>
```

Both sections use start 3 and span 8, so their content shares a left edge and
an alignment gutter without a wrapping grid. In an application, give that pair
one class and reuse it.

## The responsive contract

`.column-layout` has **no automatic collapse**. The canvas stays twelve columns
at every width, and the application owns narrow-container behavior.

This is deliberate. `8 + 4` and `3 + 9` do not become unusable at the same
width, a centered article may only need wider gutters, and a dashboard may want
three regions to become two before stacking. A single framework threshold would
be wrong more often than right, and a hidden one would have to be undone rather
than extended.

Recomposition sets the same two hooks. The simplest one stacks everything:

```css
@container (width < 40rem) {
  .profile-layout > * {
    --column-start: 1;
    --column-span: 12;
  }
}
```

A coordinate system is more useful when you keep it through an intermediate
state:

```css
.profile-main {
  --column-span: 8;
}

.profile-aside {
  --column-start: 9;
  --column-span: 4;
}

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

```html
<div class="container-query">
  <div class="column-layout profile-layout">
    <main class="profile-main">...</main>
    <aside class="profile-aside">...</aside>
  </div>
</div>
```

Put coordinates you recompose on a class: an inline `style` outranks every
rule, including your container query.

The `.container-query` wrapper here enables **your** `@container` rules, not a
hidden framework behavior. Remove your rules and the wrapper stops mattering.
This is the opposite of a primitive whose responsive contract depends on a
wrapper someone else has to remember.

## Nesting

A child's coordinates place that child only. A nested `.column-layout` uses the
ones it carries for its own position in the parent, and its children start from
nothing.

```html
<div class="column-layout">
  <section class="column-layout" style="--column-start: 3; --column-span: 8">
    <h3>Full width of the nested canvas</h3>
    <div style="--column-span: 6">Half of it</div>
  </section>
</div>
```

## Narrow containers

Twelve columns is a wide-context tool. With the default `--gap`, a 279px
container spends 132px on its eleven gaps and leaves about 12px per unit — a
four-unit region is 84px wide.

The framework guarantees the canvas itself never overflows its container: the
tracks are `minmax(0, 1fr)` and every child gets `min-inline-size: 0`, so item
boxes stay inside their tracks. It does not guarantee that content inside a
narrow span stays readable, or that an unbreakable word will not paint outside
its track. Define a narrow representation where the composition needs one.

## Scope

The primitive is horizontal only. There are no row, area, or order hooks, and no
breakpoint variants — those would move responsive strategy back into markup.
For genuinely two-dimensional placement, use CSS Grid directly on your own
class:

```css
.dashboard-summary {
  grid-row: 1 / span 2;
}
```

The column count is fixed at twelve and is not configurable. Twelve is what
makes the coordinates shared and lets `6 + 6`, `4 + 4 + 4`, `3 + 3 + 3 + 3`,
`8 + 4`, and `2 + 8 + 2` all land on the same canvas. For a track system whose
sizes carry meaning rather than twelve interchangeable units, use
`--grid-columns` on `.grid`.

Unlike `.grid-N`, the track template does not read `--gap`, so the gap
utilities are exact here at every width.

A placed region must generate a box. `display: contents` removes that box and
promotes its descendants to grid items, which leaves the placement with nothing
to apply to.

### Hooks

- `--column-span` — width in canvas units, 1 to 12. Unset, a region runs to the
  canvas end.
- `--column-start` — starting line, 1 to 12. Unset, the region is auto-placed.
