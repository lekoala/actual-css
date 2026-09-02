# Grid Responsiveness and Balanced Subdivision

## Status

Design note for Actual CSS 0.4.

This document explains the intended behavior of `.grid` and `.grid-N`, the alternatives considered, and the CSS constraints that prevent a single mechanism from satisfying every use case.

The goal is to preserve these decisions so future changes do not accidentally reintroduce previously rejected approaches.

## Problem

Actual CSS exposes two related but distinct grid use cases:

* a free collection that should adapt naturally to available space;
* a structured collection where a known column density should collapse through visually balanced subdivisions.

These goals are not equivalent.

A generic intrinsic grid can efficiently fill available space, but it does not know whether the resulting number of columns produces a balanced distribution for the number of items.

Conversely, a structurally balanced grid can preserve predictable subdivisions, but CSS cannot make it fully autonomous without introducing other layout constraints.

The distinction matters most when resizing a collection.

For six items, a purely space-driven grid may naturally move through:

```text
6 → 5 → 4 → 3 → 2 → 1
```

This maximizes use of available space, but produces layouts such as:

```text
5 + 1
4 + 2
```

Actual's structural grid use case instead prefers:

```text
6 → 3 → 2 → 1
```

Every state is a natural subdivision of six and every item has the same width.

## Core principle

Actual distinguishes **space-driven grids** from **count-driven grids**.

### `.grid`: space-driven collection

`.grid` is an intrinsic responsive collection.

Its behavior is driven by:

* the width of its containing block;
* `--grid-min`;
* the number of tracks that can fit.

A typical implementation uses `auto-fit`.

The browser is free to choose any number of columns that satisfies the minimum item width.

No guarantee is made about balanced final rows.

Conceptually:

```text
available space
      ↓
how many items fit?
      ↓
auto-fit
```

This is appropriate for collections where filling available space is more important than preserving a particular structural rhythm.

### `.grid-N`: count-driven structural grid

`.grid-2`, `.grid-3`, `.grid-4`, and `.grid-6` express a preferred structural density.

Their responsive progression should favor natural divisors of that density.

The intended chains are:

```text
.grid-2   2 → 1
.grid-3   3 → 1
.grid-4   4 → 2 → 1
.grid-6   6 → 3 → 2 → 1
```

This deliberately skips intermediate column counts that would create visibly uneven subdivisions.

For example, `.grid-6` should not pass through five or four columns simply because five or four tracks happen to fit.

The defining property of `.grid-N` is therefore not merely:

> at most N columns

It is:

> a structural density of N columns that collapses through balanced subdivisions of N.

## Equal-width items are an invariant

Actual does not attempt to repair an incomplete row by stretching individual items, changing their span independently, or making the last card wider than its peers.

At every responsive state, all direct items in a structural grid should have the same width.

Layouts such as this are intentionally avoided:

```text
[A][B][C]
[   D   ][E]
```

The grid may contain an incomplete final row when its item count is incompatible with the selected density, but the items themselves remain regular.

Visual consistency of the grid is more important than artificially filling every pixel.

## Item count and structural density are different inputs

A structural density does not imply that CSS knows the actual number of items.

For example, `.grid-6` describes the sequence:

```text
6 → 3 → 2 → 1
```

but it does not guarantee a balanced final row for an arbitrary number of children.

With eight items, six columns still produce:

```text
6 + 2
```

and three columns produce:

```text
3 + 3 + 2
```

CSS is not inferring the child count and selecting an optimal divisor of that count.

The contract is narrower:

> `.grid-N` provides balanced subdivisions of the declared structural density N.

This works particularly well when collection sizes are naturally compatible with that density.

For paginated collections, the server knows the page size and should choose a page size that works well with the expected presentation densities.

A partial final page is normal. CSS should not contain pagination heuristics intended to disguise a poor full-page item count.

## Why `auto-fit` alone is insufficient

`auto-fit` answers a spatial question:

> How many tracks of this minimum size fit in the available width?

It does not answer:

> Which number of tracks produces the most balanced subdivision?

For six items, if five columns fit, `auto-fit` may use five columns.

That behavior is correct for an intrinsic collection and incorrect for the structural-grid contract.

Therefore `.grid-N` cannot simply be implemented as `.grid` with a maximum column count if balanced subdivision remains a goal.

## Why `auto-fill` does not solve subdivision

`auto-fill` differs from `auto-fit` mainly in its treatment of empty tracks.

This matters when fewer items exist than the available grid capacity.

For example, with a four-column capacity and three items:

```text
auto-fit
[A      ][B      ][C      ]

auto-fill
[A][B][C][ ]
```

`auto-fill` can therefore preserve card width on a partial final page instead of expanding the remaining items.

That is useful behavior for catalogue-like layouts.

However, it does not solve the subdivision problem.

With six items and enough room for four columns, both mechanisms can still produce:

```text
[A][B][C][D]
[E][F]
```

Neither `auto-fit` nor `auto-fill` understands that three columns would form the more balanced `3 + 3` subdivision.

`auto-fill` is therefore not a replacement for the `.grid-N` responsive model.

## Historical implementation in 0.3.1

Actual CSS 0.3.1 already distinguished intrinsic grids from structural grids.

The structural presets changed their column count using container queries.

This allowed responsive behavior to depend on the size of the grid's local layout context rather than on the viewport.

The important architectural property was:

```text
query container
      ↓
.grid-N
```

The grid itself remained an ordinary grid item and therefore retained its normal intrinsic sizing behavior.

The main drawback was ergonomic: responsive structural grids depended on an explicit ancestor establishing the query container.

The requirement looked like an implementation detail in markup, which motivated attempts to make `.grid-N` autonomous in 0.4.

The behavior was worth preserving; the mechanism was the part under investigation.

## Demoted, not rejected: bounded intrinsic grids

One proposed 0.4 design implemented `.grid-N` as an intrinsic `auto-fit` or
`auto-fill` grid capped at N columns.

This removed breakpoints and container-query requirements.

It cannot be the whole answer, because it optimizes for available space:

```text
6 -> 5 -> 4 -> 3 -> 2 -> 1
```

where a structural grid is expected to optimize for subdivision:

```text
6 -> 3 -> 2 -> 1
```

The mechanism therefore answers a different question than the one `.grid-N`
asks.

It is nevertheless the right **baseline**. Bounded at N, using `auto-fill`, it
is responsive, overflow-safe, and equal-width at every state, and it needs
nothing above Actual's Minimal floor. Adopting it as the unenhanced behavior of
`.grid-N` is what makes the actual-container container a precision enhancement rather than
a prerequisite for responsiveness. This is the single most important difference
from 0.3.1, where a preset used without a wrapper stayed frozen at N columns
and was a genuine trap.

## Rejected approach: `smart-grid` item-count heuristics

Another direction attempted to choose intermediate column counts that avoided orphan rows.

For a collection containing `itemCount` items and `c` columns, a one-item final row appears when:

```text
itemCount mod c = 1
```

This observation is useful, but it is not a suitable basis for a generic grid class.

The undesirable column counts depend on the actual number of items, not only on the declared grid density.

A fixed `.grid-4` class cannot know whether three columns are desirable:

* for ten items, three columns produces `3 + 3 + 3 + 1`;
* for twelve items, three columns produces a perfect `3 + 3 + 3 + 3`.

Hard-coding `.grid-4` to skip three columns would encode the answer for one item count and penalize another.

More importantly, avoiding a singleton is weaker than balanced subdivision.

For six items, four columns gives `4 + 2`. There is no singleton, but `3 + 3` is still structurally preferable.

Actual therefore does not attempt to infer an optimal layout from item count in CSS.

## Rejected approach: make `.grid-N` its own query container

A promising prototype used:

```css
.grid-N {
  container-type: inline-size;
}
```

and kept a fixed internal track count.

Instead of changing `grid-template-columns` on the container, container queries changed `grid-column: span ...` on its children.

For a six-track grid:

```text
span 1 → 6 columns
span 2 → 3 columns
span 3 → 2 columns
span 6 → 1 column
```

This successfully produced:

```text
6 → 3 → 2 → 1
```

without requiring an external query-container wrapper.

It also guaranteed equal-width items.

Technically, the mechanism is valid: descendants can query the dimensions of their ancestor query container.

However, the solution has a serious side effect.

### Inline-size containment changes intrinsic sizing

`container-type: inline-size` introduces inline-size containment.

The contents of the grid no longer contribute normally to the grid's intrinsic inline size.

Probes showed the following behavior:

| Context                         | Observed grid width |
| ------------------------------- | ------------------: |
| normal block                    |              1192px |
| parent grid `auto` track        |               992px |
| parent grid `min-content` track |                48px |
| flex item with `flex: 0 1 auto` |                48px |
| `width: fit-content`            |                48px |
| float                           |                48px |
| inline-block                    |                 0px |

The self-container therefore works when the grid already receives a definite or stretched width, but can collapse almost completely in shrink-to-fit or intrinsic-sizing contexts.

This is not merely an artificial CSS edge case.

Actual's own composition primitives can create such contexts.

For example:

```html
<div class="cluster">
  <div class="grid-4">...</div>
</div>
```

`.cluster` is a wrapping flex row whose children retain normal `flex: 0 1 auto` sizing.

A self-contained `.grid-4` can therefore exhibit exactly the collapse observed in the probe.

Similar intrinsic-sizing concerns exist when a structural grid participates in auto-sized tracks or other shrink-to-fit compositions.

### Why this approach is rejected

Making `.grid-N` its own query container removes an explicit wrapper at the cost of changing the fundamental sizing behavior of the primitive.

That trade-off is not acceptable for a composable layout library.

Attempts to compensate with `contain-intrinsic-size`, special rules for `.cluster`, or other context-specific fixes would add complexity and create coupling between otherwise independent primitives.

The self-container approach is therefore rejected.

## Why an external query container is not merely a workaround

A size container query cannot make an element react to its own size without applying containment to that element.

Placing the query container on an ancestor preserves the intrinsic sizing behavior of `.grid-N` while still allowing the grid to react to local available space.

The relationship is:

```text
query container (any ancestor, e.g. .container-query)
        ↓ observes local available width
.grid-N
        ↓ changes structural subdivision
items
```

The extra ancestor is therefore not accidental ceremony.

It represents a real boundary imposed by the CSS containment model.

Actual should not hide that boundary if hiding it requires changing the sizing semantics of the grid. Balanced subdivision keys off a container **named** `actual-container` rather than any anonymous query container, so an incidental `container-type: inline-size` region never changes the grid by accident; `.container-query` is the convenience helper that establishes that named context. The name is generic rather than grid-specific: it means "here is the width you were allocated", and other size-aware components (`.steps` and its label collapse) read the same context. The grid does not own it — it is one consumer.

## Out of scope: explicit per-region placement

Editorial or application layouts that need arbitrary per-region spans and starts
are outside the `.grid` / `.grid-N` collection contract. Both primitives lay out
uniform peers; neither expresses "this region occupies seven units starting at
the third".

That case is answered by `.column-layout`, an opt-in twelve-column coordinate
system with no automatic responsive behavior. See `column-layout.md`. It also
narrows `--grid-columns` to its intended role: track templates whose sizes carry
meaning, rather than a stand-in for a coordinate system.

## Progressive enhancement

Container queries are newer than Actual's Minimal browser baseline.

Structural grids must therefore have a usable fallback without them.

The fallback should remain structurally valid and readable. It does not need to reproduce the full responsive subdivision behavior.

Modern browsers may enhance the grid when it is placed inside a query container.

This follows Actual's general compatibility rule:

> Modern CSS should not raise the Minimal baseline when a progressive fallback is possible at low cost.

## Relationship with `--grid-min`

`--grid-min` belongs naturally to `.grid`.

It expresses the minimum desirable width of an item in a space-driven collection.

Structural `.grid-N` presets are different: their behavior is driven by a known count and a predefined subdivision sequence.

Trying to derive their container-query thresholds from `--grid-min` is not currently practical because size container-query conditions cannot use arbitrary custom-property values as their thresholds.

The APIs should therefore remain conceptually separate:

```text
.grid
    input: --grid-min
    strategy: available-space driven

.grid-N
    input: structural density N
    strategy: divisor-driven subdivision
```

The fact that both produce CSS Grid layouts does not mean they require the same responsive algorithm.

## Supported structural densities

The current useful presets are:

```text
2 → 1
3 → 1
4 → 2 → 1
6 → 3 → 2 → 1
```

Not every integer necessarily deserves a preset.

For example, five has only trivial divisors:

```text
5 → 1
```

Adding `.grid-5` would either produce an abrupt transition or require introducing non-divisor heuristics such as `5 → 2 → 1`.

Actual should not add structural presets merely to complete a numerical sequence.

New presets should have a clear layout use case and a defensible subdivision chain.

## Thresholds are visual design decisions

The subdivision chain can be derived from the structural density.

The width thresholds at which transitions occur cannot.

Values such as:

```text
28rem
48rem
64rem
```

must be validated against realistic Actual content rather than inherited mechanically from historical breakpoints.

Before changing structural-grid thresholds, probes should verify:

* realistic cards rather than empty boxes;
* narrow parent inside a wide viewport;
* every expected subdivision state;
* equal item widths;
* full and partial rows;
* interaction with common Actual composition primitives;
* fallback behavior without container-query support.

The viewport itself should not determine the result; the relevant local container should.

## Why there is no breakpoint scale

Actual exposes no `sm` / `md` / `lg` / `xl` scale, and the structural grid is the
clearest illustration of why. The whole framework declares two width media
queries:

```text
@media (max-width: 30rem)   x2   modal padding on small screens
@media (min-width: 48rem)   x1   .app-layout, bottom nav -> side nav
```

Everything else responsive is intrinsic or container-driven. The responsibility
splits cleanly:

```text
viewport
   |
   +-- the few genuinely viewport-level decisions
   |     .app-layout
   |
   +-- composition and chrome
          |
        named query container
          |
        actual-container
          |
        2 / 3 / 4 / 6 stages
```

**Thresholds are local and content-driven.** `28rem`, `48rem` and `64rem`
describe how much room *this collection* needs for a given density, probed
against the content each preset targets. They are not device classes, and the
fact that two of them coincide with widely used framework breakpoints is a
coincidence, not the justification. A grid does not know what device it is on
and does not need to.

**The unit is `rem` so the thresholds follow typographic scale.** Container
query lengths in `rem` resolve against the root font size, so a reader who
scales their type up moves every threshold with it:

```text
root 16px   48rem = 768px    768px container -> .grid-3 = 3 columns
root 20px   48rem = 960px    768px container -> .grid-3 = 1 column
root 24px   48rem = 1152px   768px container -> .grid-3 = 1 column
```

That is the correct response, not a rounding artifact: larger type genuinely
needs more room per item, so the same container honestly supports fewer columns.
A `px` breakpoint cannot express this.

### Container width is not a monotonic function of viewport width

This is the empirical case against a global scale, and it is measurable inside
this repository. `demo/templates/dashboard.html` reveals its workspace sidebar
at `72rem`. Measuring the main region's content box across that boundary:

| Viewport | Container content box | `.grid-4` | `.grid-6` |
| -------- | --------------------- | --------- | --------- |
| 1100px   | 65.8rem               | 4         | 6         |
| 1160px   | 52.6rem               | 2         | 3         |

The viewport grew by 60px and the grid lost half its columns, because the
composition spent that growth on chrome rather than on content. A viewport-keyed
system reasons about this backwards by construction: it sees a wider screen and
infers more room, at the exact moment there is less. No amount of breakpoint
tuning fixes that, because there is no stable function from viewport width to
container width — the composition sits in between and is free to change.

A named query container asks the only question with a reliable answer: *how much
inline space does this collection actually have?* Everything the ladder does
follows from that measurement, which is why the thresholds can stay content-
derived instead of device-derived.

## API guidance

Use `.grid` when the number of columns should emerge naturally from available space.

Use `.grid-N` when the declared density and its balanced subdivisions are part of the intended composition.

Use structural grids for uniform peer items. They are not intended as editorial grids with arbitrary per-item spans.

Do not use CSS layout heuristics to compensate for a pagination size that produces undesirable full-page distributions when the server already knows the item count.

## Decision

Actual keeps two different grid contracts.

```text
.grid
    intrinsic
    space-driven
    auto-fit
    configurable through --grid-min
    no guarantee of balanced rows

.grid-N
    structural
    count-driven
    equal-width items
    responsive through natural subdivisions of N
    local-container driven when enhanced
```

A structural grid must not become its own inline-size query container, because doing so breaks intrinsic and shrink-to-fit composition.

If local responsive subdivision requires a size container query, that query container must remain outside the structural grid.

The explicit container boundary is preferable to hidden containment side effects.

The guiding principle is:

> `.grid` optimizes for available space. `.grid-N` optimizes for balanced subdivision.

Future grid changes should preserve that distinction unless the public contract itself is intentionally reconsidered.

## Resolution

`.grid-N` is a bounded `auto-fill` grid by default, and a divisor-chain grid
inside a query container.

```text
.grid                      space-driven, auto-fit, --grid-min
.grid-N                    count-driven baseline, auto-fill bounded at N,
                           may pass through non-divisor column counts
actual-container .grid-N        balanced subdivision, N -> divisors of N -> 1
```

The whole enhancement lives inside `@supports (container-type: inline-size)`.
Browsers below the floor get the baseline whether or not a wrapper is present,
which removes the parallel `@media` block 0.3.1 had to maintain in lockstep
with its container thresholds.

### `--grid-min` is not a `.grid-N` hook

`@container` thresholds cannot resolve a custom property. A hook honored in the
baseline would therefore fall silent the moment an author added a query
container — exactly the kind of hidden, position-dependent contract this
redesign set out to remove. The baseline hard-codes `16rem` instead.

The resulting API split is the clearer one anyway: item width is `.grid`'s
contract, column density is `.grid-N`'s.

### Thresholds

Three shared steps, not one calibrated per preset:

```text
28rem   first horizontal density   .grid-2, .grid-4, .grid-6 -> 2 columns
48rem   three columns              .grid-3, .grid-6 -> 3 columns
64rem   dense densities            .grid-4 -> 4, .grid-6 -> 6
```

An earlier draft tuned each final step so that every preset landed an item
around 240px, which put `.grid-6` at 80rem or 96rem. That was the wrong
optimization, and worth recording so it is not re-derived.

Calibrating every preset to the same item width erases the information N
carries. An author does not reach for `.grid-N` to say *I have N things*; they
say *my content suits this density*. `.grid-6` should reach six columns early
precisely because choosing it is a statement that the items are compact. At
96rem an item is back to `.grid`'s 16rem default, and the preset has no reason
to exist.

The right probe is therefore each preset against the content it targets, not
one specimen across all of them:

| Preset    | Probed with                        | Item at its final step | Result |
| --------- | ---------------------------------- | ---------------------- | ------ |
| `.grid-2` | large card, summary, action        | 218px @ 28rem          | clean  |
| `.grid-3` | standard card                      | 248px @ 48rem          | clean  |
| `.grid-4` | compact card, stat                 | 247px @ 64rem          | clean  |
| `.grid-6` | stat, avatar, thumbnail, icon tile | 161px @ 64rem          | clean  |

161px is small for a card with a heading and a paragraph — and that is the
point. A preset that needs 250px per item is `.grid-4`, not `.grid-6`.

The framework does not guess appropriate item size. The author states it by
choosing a density; the framework then guarantees a clean structural collapse
of that density.

### Reference container sizes

The thresholds describe the **query container's content box**, not the viewport
and not the grid's own border box. Padding and borders on the container come off
the top before the query resolves. Verified states:

| Container content box | `.grid-2` | `.grid-3` | `.grid-4` | `.grid-6` |
| --------------------- | --------- | --------- | --------- | --------- |
| `< 28rem`             | 1         | 1         | 1         | 1         |
| `28rem` – `< 48rem`   | 2         | 1         | 2         | 2         |
| `48rem` – `< 64rem`   | 2         | 3         | 2         | 3         |
| `>= 64rem`            | 2         | 3         | 4         | 6         |

Two consequences for anyone sizing a region that hosts a structural grid.

**Size the region to land on a threshold, not just under one.** A region whose
content box settles at 47rem gives `.grid-3` one column — the same result as
20rem. The step is a cliff, not a ramp, and `.grid-3` has no intermediate state
to soften it; that is the invariant, not a defect. If a region is meant to show
three columns, give it 48rem of content box with room to spare.

**Budget backwards from the content box.** A region that must reach a threshold
`T` needs `T + its own padding-inline + its own border-inline` of outer width.
The convenient reference sizes are therefore the thresholds plus the padding the
region actually carries:

```text
target 28rem content box   + 2 x 1rem padding + 2 x 1px border   ~= 30.2rem outer
target 48rem content box   + 2 x 1rem padding + 2 x 1px border   ~= 50.2rem outer
target 64rem content box   + 2 x 1rem padding + 2 x 1px border   ~= 66.2rem outer
```

Rounding **up** past that figure is deliberate. Landing on the threshold to the
pixel means a later padding change, measured in fractions of a rem, silently
drops the region a state.

### Why there is no `.grid-5`

The divisors of five are five and one, so the chain would be `5 -> 1` with no
intermediate state. The system exposes densities that subdivide well, not every
integer. Proposals to give `.grid-5` a hand-picked `5 -> 2 -> 1` chain are
covered by the rejected `smart-grid` section above: those steps encode an
assumption about item count that the class cannot verify.

## Demonstrability is part of the contract

A threshold nobody can reach is indistinguishable from a threshold that does not
work. This was not hypothetical: the documentation site shipped for some time
with an article column capped at 48rem, and the live demo previews inside it are
the query containers. Their content box therefore topped out at **45.9rem at
every viewport width** — 1280px, 1920px, identical. Every `.grid-3` demo on the
site rendered one column, `.grid-4` and `.grid-6` rendered two, and the page
teaching `6 -> 3 -> 2 -> 1` showed the reader its 2-column state as though that
were the top of the chain.

The bug was reported as a `.grid-3` calibration complaint. It was not one. No
text-based check could see it, because every class name, every threshold, and
every rule in the framework was correct.

Two durable rules came out of it.

**The query container must be the element whose content box is the grid's actual
available space.** Putting `container` on a padded box is correct; putting it on
an outer wrapper and letting an inner box add the padding makes the query
resolve against a width the grid does not have, firing every threshold early.
The demo would then claim a state it cannot honor — a lie in the geometry rather
than in the CSS.

**A surface that documents the thresholds has to be wide enough to reach them.**
The docs shell is sized backwards from 64rem plus the preview's own padding, and
that arithmetic is asserted in `tests/docs-geometry.test.js` against the
thresholds parsed out of `grid.css`, so raising a threshold without giving the
documentation room to reach it fails a test instead of quietly degrading every
demo. The prose keeps its own reading measure inside the wider track: demo
measure and prose measure are different contracts and should not be forced to
share a number.

### A probe that correctly changed nothing

The same investigation measured `.choice-card` in a forced 3-up, to ask whether
`.grid-3`'s 48rem step was simply too conservative:

| Container | px / card | Result             |
| --------- | --------- | ------------------ |
| 44rem     | 224       | one line, at ease  |
| 40rem     | 203       | one line, at limit |
| 38rem     | 192       | **wraps**          |
| 32rem     | 160       | wraps badly        |

So those particular cards do fit three-up at roughly 40rem, well below the
preset's step. That was not a reason to move the step or to add a density
modifier, and the temptation is worth recording.

`.grid-3` is a generic preset built around ~15.5rem per item, in agreement with
`.grid-4`'s ~15.4rem. Choice cards are simply smaller than the preset's target
content. Lowering the step to fit them would have put `.grid-3` at ~14.2rem and
broken the only clean agreement in the ladder — to fix a symptom whose actual
cause was 2rem of documentation padding.

A modifier introducing a second density ladder becomes defensible only when
*several unrelated* content families independently show the standard steps to be
too conservative while wanting identical balanced-collapse behavior. One
component in one miscalibrated container is not that evidence. A per-component
threshold would also collide with the established meaning of `.compact` in
Actual, which is padding density on a component (`.card.compact`,
`.table.compact`) and never a layout threshold.

