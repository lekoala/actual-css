# Steps: representations, thresholds, and selector shapes

## Status

This document holds the reasoning that `steps.css` used to carry in its
comments: why the horizontal stepper has the representations it has, why the
thresholds sit where they sit, and which approaches were tried and rejected.

The goal is to keep those decisions recoverable so a future change does not
reintroduce a shape that was already measured and discarded.

## The markup contract

One primitive, two explicit compositions. Both classes are required:

```html
<ol class="steps steps-horizontal">…</ol>  <!-- 2 to 5 stages -->
<ol class="steps steps-vertical">…</ol>    <!-- no count limit -->
```

`.steps` is what a step *is*; the second class is what the sequence *looks
like*. A step is therefore the same thing in both. Every step wraps its label:

```html
<li class="complete"><span class="step-label">Account</span></li>
```

and its label may be an `a[href]` where the workflow allows navigation. That is
the whole interactive surface: see "The interactive guard".

The wrapper is not decoration. It is the only handle the space-aware
representations have: something to move beside a marker, something to place
under one, something to visually hide. Bare text in an `<li>` cannot be
addressed by any of them.

An earlier version supported bare text as a first-class form and paid for it
twice. Once in behaviour, because a row mixing wrapped and unwrapped steps
compacted only the wrapped ones — measured at five steps in a 559px region, the
unwrapped step held 201px while its four peers shrank to 89px. Once in bytes,
because the only valid way to express "every step is wrapped" is to enumerate
positions (see below), which grew the selector for each supported count.

Making the wrapper mandatory removes both, and the markers-only selector now
checks nothing about labels at all. An unwrapped row still compacts, with
nothing to hide: it stays laid out and does not overflow, which is all an
out-of-contract markup is owed. Guarding against it would mean paying selector
weight on every supported row to improve one that is already wrong.

## Why there are two thresholds

```text
< 35rem   markers only, 4 steps or more
>= 60rem  marker beside label, any count
otherwise stacked
```

Both are calibrated on five steps, the widest supported row and therefore the
binding case. Earlier versions had one threshold per count — eight ranges, then
four — and the per-count precision turned out to buy less than it cost.

**Markers-only starts at 4.** It exists for one real problem: a four- or
five-stage checkout in a phone-width region. Two or three steps stay readable
stacked far below any width worth designing for, and scroll past that, which is
an acceptable outcome there. The 2- and 3-step blocks that used to exist were
near-copies solving a problem nobody had. Symmetry is not a reason.

Inside the supported 2–5 domain, "4 or more" is exactly "4 or 5". Neither
query carries an upper bound; see "Counting the steps".

**35rem is five steps' own scroll threshold.** Items hold at
`flex: 1 0 var(--step-min)`, so a row's intrinsic width is `count × --step-min`
— 35rem for five steps. The query fires exactly where a five-step stacked row
would start to scroll, so no supported row ever scrolls in a band where
markers-only could have rescued it.

Four steps share that threshold instead of getting their own at 28rem. Between
448px and 560px they are therefore reduced to markers although stacked would
still have fitted. That is the deliberate cost of one threshold instead of two,
and it is the cheaper direction: hiding a label slightly early keeps it in the
accessibility tree and lets the surrounding screen name the current step, while
scrolling puts content behind an interaction.

Splitting the difference at 32rem was measured and rejected for exactly that
reason: it gives four steps a smaller early-hide band, but hands five-step rows
a scrolling band between 512px and 560px — 40px of overflow at 520px, 20px at
540px — which is the failure markers-only exists to prevent.

**60rem is where the inline connector survives on five steps.** Inline is a
bonus for generous room, not a rescue, so a late threshold costs nothing and one
threshold can serve every count. But it cannot be arbitrary: the connector
absorbing the free space between marker + label groups is the representation's
defining feature, and the region a theme replaces with a chevron.

Measured with five steps and realistic labels ("Personal details", "Delivery
address", "Shipping method", …), the connector width is:

| Container | 768px | 832px | 896px | 960px | 1024px |
| --- | --- | --- | --- | --- | --- |
| connector | 15px | 24px | 33px | 49px | 65px |

At 48rem (768px) the row renders inline with a 15px connector — the
representation applies, but its point has collapsed to a stub. 60rem is the
first threshold where five steps still clear the connector's own `2rem`
flex-basis. Four steps reach 58px already at 768px, and two or three steps have
room to spare, so calibrating on five costs the smaller counts only a longer
stay in the stacked layout.

**Thresholds are literal rem.** `@container` cannot resolve a custom property,
so overriding `--step-min` moves the scroll budget but not these queries. Same
trade as `--grid-min` in `grid.css`.

## Selector shapes

### `:has()` cannot be nested

`:has()` is not valid inside `:has()`, including indirectly through `:not()` or
`:is()`. The whole selector is discarded — silently, so the rule simply never
applies. Chrome throws on `document.querySelector` for it, which is the cheapest
way to check.

This rules out the natural spelling of a universal:

```css
/* INVALID — the rule never applies */
.steps:not(:has(> li:not(:has(> .step-label))))
```

When a count is already known, the workaround is to enumerate positions, each in
its own flat clause, folding the last into the count check:

```css
.steps:has(> :nth-child(1) > .step-label):has(> :nth-child(2):last-child > .step-label)
```

That is what the all-or-nothing label check used before `.step-label` became
mandatory. It works, but it costs one clause per position per rule, which is why
removing the need for it was worth more than optimising it.

### Counting the steps

Only markers-only counts, and only as a lower bound:

```css
/* four steps or more */
:has(> :nth-child(4))
```

`:has()` takes a relative selector list, so this needs no `:is()` wrapper. The
inline query counts nothing at all: it serves the whole domain.

Two richer spellings were carried before this one, and both existed for the same
reason — to keep a 6+ row out of the enhanced representations and on the base
layout:

```css
/* exactly 4 or 5 — removed */
:has(> :nth-child(4):last-child, > :nth-child(5):last-child)

/* at least 4, fewer than 6 — removed earlier */
:has(> :nth-child(4)):not(:has(> :nth-child(6)))
```

The two are equivalent — measured over the browser fixture they select the same
elements, and they are specificity-neutral to each other, since `:has()` and
`:not()` each take the specificity of their most specific argument. That
neutrality mattered while a choice between them was open: these rules sit at
equal specificity with the base ones and rely on source order.

What settled it was dropping the promise underneath both. The enumeration was
defended as "the enumeration *is* the contract" — the selector states the
supported counts, and an upper bound written as a separate `:not()` clause reads
like defensive noise a later cleanup would delete. That argument holds only if
6+ horizontal is a case worth serving carefully. It is not. It is out of
contract, and the enumeration was buying it a curated fallback at the cost of
four `:nth-child` clauses on every rule of the inline block, repeated three
times, on every row that *is* supported.

So the upper bound is gone, in both spellings. A 6+ row now compacts at narrow
widths and goes inline at wide ones, calibrated for a count it does not have.
That is what out of contract means: the rules apply as written. The docs say
2 to 5 and point longer sequences at `.steps-vertical` rather than promising a
graceful degradation nobody asked for.

The tests followed the same rule. A browser test that pinned what a six-step row
does — it used to assert "no rule fires", then briefly "it compacts" — was
deleted rather than updated. Either assertion turns an accident of the selectors
into an API nobody promised, and the second one would have to be revisited every
time a threshold moved. What is out of contract is not tested for behaviour.

Vertical was the other reason a rule might have needed a guard, and it is not one
any more either: every container query addresses `.steps-horizontal` by name, so
there is nothing to exclude. See "Two compositions, one primitive".

### The containment grant

The enhanced representations read the nearest `actual-container` size context,
which the author grants — with the `.container-query` class or by declaring the
name in their own CSS — on the row or on a region around it. It is not granted
by the component, because `container-type: inline-size` collapses `.steps` to
roughly zero in any shrink-to-fit box: a float, an inline-block, a table cell, a
grid auto track, an absolutely positioned box, a `max-content` parent. Block flow
and `.cluster` are safe.

Containment is also what makes the condition stable: content cannot perturb the
container's width, so the query cannot be flipped by its own effect.

The name is shared rather than steps-specific, so one grant serves every
size-aware component in a region.

### The interactive guard

`.sr-only` leaves an element in the tab order at 1×1 with `clip-path:
inset(50%)`, so a focus ring lands on nothing. Markers-only therefore refuses
any row whose labels are navigable:

```css
:not(:has(a[href]))
```

The guard rides in the selector rather than in a separate rule because the
container grant may sit on a wrapper this component cannot restyle.

**Links only.** The guard used to read
`:not(:has(> li > :is(a[href], button, [tabindex])))`, which covered any
focusable content a step might hold. Nothing ever held any: no fixture, demo or
documented example used a `<button>` or a `tabindex` inside a step, and the
docs describe exactly one navigable form — `<a class="step-label" href>`. The
extra branches were surface area spent on markup the component does not
describe, and they made the one selector a reader has to parse three times
longer.

So the contract is now explicit: a step label may be a link, and anything else
focusable in a step is out of contract. The guard is deliberately loose —
`:has(a[href])` reads the whole subtree, so a link anywhere in the row refuses
the compact form. Refusing on more than you promise is the safe direction.

A link needs no styling rule of its own to go with it. `color: inherit` sits in
the `.steps .step-label` rule: a span inherits its ink anyway, so only a link
ever had a `--link` colour to take back, and taking it back for every label costs
nothing and one rule less. That rule stays scoped to `.steps` — unlike
`.menu-item-text` and the framework's other sub-part classes — because a bare
`.step-label` weighs (0,1,0), exactly `.prose :where(a)`, and a stepper inside
prose would then be decided by the order the bundle concatenates two files in.

It reads structure, never state. A guard keyed on `aria-current` or `.complete`
would toggle the representation under the user as the workflow advanced and the
same link went future → current → complete. Refusing is also preferred over
revealing the label on focus, which would need it to float over a row it no
longer fits.

The inline representation hides nothing and carries no such guard.

The same `:has()` appears once more, for a different reason: a navigable row
reserves `padding-block` for its focus ring, because the scroll container clips
at the padding edge. See "Scrolling on one axis".

### Rejected alternatives for hiding a label

Hiding the label is declarations, not a value, so it cannot ride on a custom
property the way a `--step-min` override could — which is why collapsing the
markers-only blocks from four to one mattered more than trying to factor their
bodies. The tempting shortcuts all fail: zero block-size and `font-size: 0` lose
the accessible name, and style queries sit above the support floor.

The inline block's declarations are likewise written out rather than abstracted.
Two container queries with explicit bodies are easier to read, and to change,
than one clever indirection.

## States

Three states must be readable without a check glyph: future is neutral, complete
is a filled marker, current is an outlined one with a thicker ring. Filled reads
as "done", outlined as "you are here", and the distinction survives a numbered
stepper that never sets `--step-complete-mark`.

Current is declared after complete at equal specificity, so it wins on every
channel — including the connector. The accented line means "already walked", so
the segment *leaving* the current step is neutral; the segment *reaching* it is
owned by the previous step, which is complete.

The thicker ring is structural, so it survives forced colors, and it never
competes with the outline channel that belongs to focus.

### Forced colors, and the override that was removed

Forced colors drops the accent fill, so in a numbered flow a complete marker and
an upcoming one both render as a ringed disc with a number in it. Current still
reads, on its thicker ring and its bolder label; complete and upcoming do not
separate.

The component used to answer that with a `@media (forced-colors: active)` block
giving complete a system `Highlight` fill and `HighlightText` text. Captured
with forced colors emulated through the DevTools protocol, that fill renders the
marker's own content — the counter, or a `--step-complete-mark` checkmark —
unreadable: a sliver of `HighlightText` inside a solid disc. It trades an
ambiguity for an illegible glyph, in the exact mode it was written to help.

So the block is gone, and the honest answer is documented instead:
`--step-complete-mark` distinguishes the two states in forced colors as well as
anywhere else, because a different glyph survives a colour system that flattens
fills. An author whose flow needs that distinction sets it; the component does
not fake it with a fill that cannot carry its own content.

The general principle is the one this file keeps arriving at. A remedy that is
worse than the problem in its own target mode is not a remedy, and shipping it
"for accessibility" only makes the failure harder to notice.

## Connectors

The connector pseudo-element is marker-height rather than hairline-height so
`--step-connector` can be any complete background value — a gradient, an image,
or `none`. The default paints the hairline as a gradient sized
`100% var(--step-line-size)`.

The colour rides inside that gradient as `var(--step-line)` rather than being a
`--step-connector` default on `.steps`. A custom property resolves its `var()`
before inheritance, so a parent-level default would freeze the parent's colour
and a `.complete` child's connector would never follow its own state.

`--step-inline-connector` exists because the inline representation gives the
connector a genuinely different job: it absorbs the free space between
marker + label groups, which is the region a theme replaces with a chevron. It
falls back to `--step-connector`, then to the default line.

There is deliberately no `--step-vertical-connector`. The vertical geometry is
different, so a horizontal value cannot transpose onto it — but no real design
has asked to repaint it, and `.steps-vertical > li::after` is a reachable
override. Unrequested API is API not worth publishing.

## Scrolling on one axis

The row scrolls horizontally as its last resort, and never vertically. Saying
only `overflow-x: auto` does not express that: the spec computes the other axis
to `auto` too whenever one axis is a scroll container, so `overflow-y` becomes
`auto` by omission.

That would be harmless if the row had any vertical slack, and it has none. A
stacked step is a 28px marker, an 8px gap and a 17.5px label line — 53.5px, a
fractional height the box hugs exactly. Whether `scrollHeight` rounds to the
same integer as `clientHeight` then depends on the font in use, the device pixel
ratio and the zoom level, so a phantom vertical scrollbar appears on one machine
and not another. It was reported from a browser whose rounding went the other
way than the test environment's, which is exactly the shape of bug a fixed-width
fixture cannot catch.

`overflow-y: hidden` settles it: there is genuinely nothing to scroll on that
axis, in any representation.

On the axis that does scroll, `overscroll-behavior-inline: contain` keeps a
swipe that reaches the end of the row from chaining to the page behind it.

What makes the row scroll rather than squash is the item floor:
`min-inline-size: max(var(--step-size), var(--step-min))`. The `max()` is there
so an author who lowers `--step-min` below `--step-size` narrows the scroll
budget without collapsing items behind their own markers.

The cost is that clipping now happens at the padding edge, and a focus ring is
drawn outside its element's border box — `--focus-outline` is two border-widths
wide at `--focus-outline-offset`, so 4px past a label that sits flush with the
bottom of a stacked row. A navigable row therefore reserves exactly that much
`padding-block`, gated on `.steps-horizontal:has(a[href])`. An informational
stepper — the common case, with no ring to protect — keeps its height, and so
does a navigable column: the padding is compensation for the row's clip, and the
column is not a scroll container at all.

Reserving the space unconditionally would have been one rule shorter and 8px
taller on every stepper in the framework. Clipping and letting focus scroll the
ring into view would have kept the height and moved the row under the reader
instead.

## Two compositions, one primitive

`.steps` is the component. `.steps-horizontal` and `.steps-vertical` are peers,
both required, neither the default. Vertical is an explicit orientation, never a
responsive fallback, and it has no step-count limit: its practical limit is the
surrounding layout rather than a row's width budget.

This arrangement is the third the component has had, and each move was made to
delete something the previous one forced.

### First: vertical as a modifier

`<ol class="steps steps-vertical">`, where `.steps` was both the component and
the horizontal layout. The column inherited a row and then undid it — six
declarations that existed for no other reason:

| Undone | Because the row set |
| --- | --- |
| `overflow: visible` | `overflow-x: auto` |
| `overscroll-behavior: auto` | `overscroll-behavior-inline: contain` |
| `flex: none` | `flex: 1 0 var(--step-min)` |
| `grid-template-rows: auto` | `grid-template-rows: var(--step-size) auto` |
| `min-inline-size: 0` | `min-inline-size: max(--step-size, --step-min)` |
| `text-align: start` | `text-align: center` |

And it forced the inverse on the horizontal side: every rule that must not reach
a column carried `:not(.steps-vertical)` — the focus-ring rule plus every rule in
both container queries.

### Then: two independent roots

`<ol class="steps">` and `<ol class="steps-vertical">`, sharing no class. Both
lists above went to zero. But the shared half of the component — the counter, the
marker, `.step-label`, `.complete`, `aria-current="step"` — then had no name, and
had to be spelled `:is(.steps, .steps-vertical)` on twelve rules.

That repetition was the diagnosis, not the disease. Twelve rules needing the same
two-class prefix is what a shared primitive looks like when it has not been given
a class of its own.

### Now: a primitive and two compositions

`.steps` holds the twelve, under its own name. `.steps-horizontal` and
`.steps-vertical` hold what is genuinely per-orientation. Nothing excludes
anything, nothing undoes anything, and the shared rules read as what they are:

```text
.steps             what a step is
.steps-horizontal  a row, plus its container queries
.steps-vertical    a column
```

The cost is one class on the horizontal markup, which was previously implicit.
That is the right direction: if vertical is an explicit orientation rather than a
fallback, horizontal being explicit too is the same claim stated once more.

`.steps` on its own is incomplete markup. That is a real footgun — it renders a
flex row of unpositioned markers rather than nothing — and it is the price of
having neither orientation be the default. Documented, not defended.

### The one declaration that survived the audit

Each undone declaration in the first table was re-checked in a browser rather
than assumed gone, and one was not: **`justify-items: start` stays.** Grid items
blockify, so a label left at the default `normal` stretches across the whole
`1fr` track — measured, an `a.step-label` goes from 75px to 264px. That is a
full-width hover target and a full-width focus ring in a column, where the same
link in a row gets a box that hugs its text. The declaration is not undoing the
row; it is the column's own alignment, and it was only ever mistakable for a
reset.

### The connector's terminator

The connector's geometry belongs to each composition, so only the question of
*which* steps get one is shared. That used to be two rules pulling against each
other — `> li::after { content: "" }` and `> li:last-child::after { content:
none }` — which made "does a line trail the last step" a specificity question,
and made a stray `content` in a geometry rule enough to break it.

It is now one rule stating the condition: `.steps > li:not(:last-child)::after`.
A pseudo-element with no content generates no box, so both compositions can
address `> li::after` freely and neither can grow a line past the final step.
Nothing to order, nothing to weigh.

Its row is aligned to `start` so a label that wraps begins level with the top of
its marker. A single line is shorter than the marker and would float above its
centre, so the label takes `align-self: center` — which only bites in that case,
since a label tall enough to fill the row has nothing left to centre in.
Measured, a single line sits 0.25px off the marker's cap-height centre with it,
and 5px above without.

## Label typography

The marker carries the state, so the label reads a notch below it: one size
down, tight leading, neutral weight, with extra weight only on
`aria-current="step"`. A completed step gets none — its filled disc already
reads as strongly as text could.

The size is set on the component, never inside a container block. A font-size
that changed with the representation would resize the text under a reader
dragging a window, on top of the layout move the threshold already makes.

A navigable label keeps its underline, hover and focus ring but takes
`color: inherit`, because `--link` is a theme hook and a link-coloured label
would read ahead of the marker states it sits next to.
