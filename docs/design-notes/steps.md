# Steps: representations, thresholds, and selector shapes

## Status

This document holds the reasoning behind `steps.css`: why the component has the
representations it has, why the threshold sits where it sits, and which
plausible alternatives are wrong and by how much.

Its job is to keep the constraints legible, so a change that would reintroduce
a shape this component measures as worse can be recognised as such. Everything
here is stated as the design is, with the measurement that settles it — not as
a record of what changed when. That belongs in the changelog.

## The markup contract

One primitive, two explicit compositions. Both classes are required:

```html
<ol class="steps steps-horizontal">…</ol>  <!-- 2 to 5 stages -->
<ol class="steps steps-vertical">…</ol>    <!-- no count limit -->
```

`.steps` is what a step *is*; the second class is what the sequence *looks
like*. A step is therefore the same thing in both.

`.step-label` is then the other decision, and it is **independent of the
first**: it says whether the sequence carries its own step names. Optional in
either orientation; when a sequence carries names, every step carries one.

```html
<!-- the page carries the name; the sequence draws the position -->
<ol class="steps steps-horizontal" aria-hidden="true">
  <li class="step-complete"></li>
  <li aria-current="step"></li>
  <li></li>
</ol>

<!-- the sequence carries the names -->
<ol class="steps steps-horizontal">
  <li class="step-complete"><a class="step-label" href="/account">Account</a></li>
  <li aria-current="step"><span class="step-label">Validation</span></li>
  <li><span class="step-label">Payment</span></li>
</ol>
```

Two dimensions, four compositions:

|                | empty steps          | `.step-label` on every step            |
| -------------- | -------------------- | -------------------------------------- |
| **horizontal** | compact progression  | named sequence, stacked or inline      |
| **vertical**   | compact rail         | named sequence, labels beside markers  |

The two forms are not two densities of the same thing. They show different
information, which is why the contract splits on content rather than on a
width. And the split is not the component's invention: a step with nothing in
it *is* just a marker. "Markers only" is not a variant — it is what a step
naturally is when it has no content.

A label may be an `a[href]` where the workflow allows navigation. That is the
whole interactive surface and it belongs to labels alone, which is the same
rule read from the other end: navigating a flow means naming its destinations —
see "Navigation is a labelled affair".

### Why `.step-complete` is prefixed

The framework writes modifiers bare — `<button class="btn primary outline lg">`
— and a bare `.complete` would look like it belongs to that grammar. It does
not. Those modifiers qualify a component on the component's own element; this
one marks one item *inside* a component, which is the position `.step-label`
occupies. Prefixing keeps the component's public vocabulary in one namespace:
`steps`, `steps-horizontal`, `steps-vertical`, `step-label`, `step-complete`,
beside `aria-current="step"`.

It also keeps the framework from claiming `complete` — an ordinary English word
an application is likely to want for a task, a download or a form — as a
reserved global class, for one component's one state.

Complete is the only state with a class at all. Current is `aria-current="step"`
and upcoming is the absence of both, because the platform already spells those.

### Bare text in an `<li>`

Out of contract — a step name belongs in a `.step-label` — and it degrades in
the right direction. `:empty` reads an item's own content, so `<li>Account</li>`
is not empty: it takes the reading width a wrapped label would, and only the
placing and aligning that `.step-label` rules provide are missing. It lays out
and does not fall apart, which is all an out-of-contract markup is owed.

This is the case that makes bare text expensive to support as a first-class
form, and it is worth stating precisely, because a component that sizes steps
*per label* pays for it twice.

In behaviour: a row mixing wrapped and unwrapped steps compacts only the
wrapped ones. Measured at five steps in a 559px region, the unwrapped step
holds 201px while its four peers shrink to 89px. That skew is what
`> li:has(.step-label)` produces — bare text has no label, so it takes a
marker-wide floor while its wrapped peers keep `--step-min`.

In bytes: the only valid way to express "every step is wrapped" is to enumerate
positions (see "`:has()` cannot be nested"), which grows the selector for each
supported count.

`:empty` avoids both by asking the question that actually decides the layout —
*is there anything in this step?* — and answering it the same way for a label,
a link and bare text.

The row-level alternative, `.steps-horizontal:not(:has(.step-label)) > li`,
avoids the skew differently: it makes every step reading-width, so an empty
step in a mixed row becomes a wide gap rather than a marker. It also puts the
compact form itself behind `:has()`, above the Degraded tier, for a shape that
needs no modern selector at all.

### `:empty` means empty

No children, no text — not even whitespace. `<li></li>` is a marker;
`<li>\n</li>` is not. Comments are allowed.

That is a sharp edge, and it is the framework's existing one: `.badge:empty`
draws the same line, so it is not a new convention for an author to learn. It
is documented next to the markup that relies on it.

## Why there is one threshold

```text
>= 60rem  marker beside label
otherwise stacked
```

Only labelled rows see it. An unlabelled row is already the shape the query
produces, so it stays out — one representation at every width, which is what
lets it be documented as unconditional.

One threshold, and no per-count variants of it: see "Nothing counts the steps".

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

**The threshold is literal rem.** `@container` cannot resolve a custom
property, so overriding `--step-min` moves the scroll budget but not this
query. Same trade as `--grid-min` in `grid.css`.

## The compact form

The whole unlabelled contract, in both orientations:

```css
.steps-horizontal > li:empty {
  flex: 1 1 0;
  justify-items: start;
  min-inline-size: var(--step-size);
}

.steps-horizontal > li:empty::after {
  inset-inline-start: var(--step-size);
}

.steps-horizontal > li:empty:last-child {
  flex: 0 0 auto;
}

.steps-vertical > li:empty {
  grid-template-columns: var(--step-size);
}
```

The CSS then reads almost as the public contract does:

```css
.steps-horizontal > li        { /* marker over label */ }
.steps-horizontal > li:empty  { /* marker only */ }
.steps-vertical   > li        { /* marker beside label */ }
.steps-vertical   > li:empty  { /* marker only */ }

@container actual-container (inline-size >= 60rem) {
  .steps-horizontal:has(.step-label) > li { /* optional wide enhancement */ }
}
```

### Why the row's rule is two declarations and the column's is one

The row's base rule describes a step, not a stacked step:

```css
.steps-horizontal > li {
  display: grid;
  grid-template-rows: var(--step-size);   /* the marker's row, and only it */
  gap: var(--step-gap);
  …
}
```

The template declares one track. A `.step-label` is auto-placed into an
implicit second row, and `gap` only means something once there are two tracks —
so an empty step is exactly `--step-size` tall, with no empty track and no gap
for `:empty` to take back. `grid-template-rows: var(--step-size) auto` builds
that second row whether or not a label ever arrives, and the compact rule then
has to remove the track *and* the gap. What is left to say is only the sizing:

```text
li:empty              only the marker    marker floor   equal share of the line
li with .step-label   a second row       --step-min     a readable share
```

The column cannot use that mechanism, and the reason is worth recording so it
is not "simplified" later: **`grid-auto-flow` is `row`**, so an auto-placed
label lands *under* its marker rather than beside it. Its second track is
therefore explicit, and `:empty` takes it back — one declaration, since a
single track has nothing for `gap` to sit beside.

### Why the track runs edge to edge

`justify-items: start` on an empty step is not an override of the row's
centring, and the distinction matters because it looks like one. A marker is
centred in its share because a label sits under it and the two must share a
centre. With no label there is nothing to centre against, so the marker takes
the start of its share, its connector fills the rest, and the final step —
having no share to fill — is only as wide as its own marker.

The result is a track flush with both ends of the row, which is what lets it
line up with the heading or paragraph that names the step. Keeping the centred
geometry leaves half-cell margins at both ends: measured on five empty steps in
a 736px row, 60px of dead space on each side, with the first marker floating
inward of a left-aligned heading.

It also matches the inline representation, whose `:last-child { flex: 0 0 auto }`
is the same declaration for the same reason.

The connector follows from the alignment rather than being tuned to it. The
base geometry starts a connector at `50% + --step-size / 2` — the right edge of
a centred marker — and runs it `100% - --step-size`, to the next marker's left
edge. Move the marker to the start of the share and that origin becomes
`--step-size`; the width is unchanged, and the connector still lands exactly on
the next marker. Measured at 736px and at 200px: zero gap either side.

### What the column's rule buys

Nothing visible in a stretched column: a flex item in a column container fills
its line whatever its tracks say, so the marker, the connector and the item's
box all measure identically either way. Only `grid-template-columns` changes.

It earns its place in a **shrink-to-fit box** — which is what a sticky progress
rail usually is. Measured at three empty steps in an `inline-size: max-content`
wrapper: **36px without the rule, 28px with it.** The 8px is `--step-inline-gap`,
the gap to a label track holding nothing. A rail eight pixels wider than the
markers it draws is not a bug anyone would file, and also not something to
leave in a component whose whole claim is that sizing follows content.

### Why `:empty` rather than `:has()`

It says what the markup says, and it reads the item's own content, which is
what keeps bare text off a marker-wide floor (see "Bare text in an `<li>`").

It also predates `:has()` by a decade, so the compact form reaches the Degraded
tier. `:has(.step-label)` appears only in the wide container query, where
losing it costs the inline bonus and nothing structural. So the support story
has no hole in it:

```text
no :has(), no container queries    both compact forms work; labelled stays stacked
:has() + container queries         labelled rows also go inline past 60rem
```

## Selector shapes

### `:has()` cannot be nested

`:has()` is not valid inside `:has()`, including indirectly through `:not()` or
`:is()`. The whole selector is discarded — silently, so the rule simply never
applies. Chrome throws on `document.querySelector` for it, which is the cheapest
way to check.

This rules out the natural spelling of "every step is labelled":

```css
/* INVALID — the rule never applies */
.steps:not(:has(> li:not(:has(> .step-label))))
```

When a count is already known, the workaround is to enumerate positions, each in
its own flat clause, folding the last into the count check:

```css
.steps:has(> :nth-child(1) > .step-label):has(> :nth-child(2):last-child > .step-label)
```

That is the strict all-or-nothing label check, and it costs one clause per
position per rule.

Nothing needs it, because nothing asks that question. Sizing is decided per
item, by `:empty`, so no rule needs to know what the *sequence* contains; only
the wide enhancement asks about labels at all, and it asks the loose version:

```css
.steps-horizontal:has(.step-label) > li   /* some step is labelled */
```

One flat clause at any count. It cannot express "every step is labelled", so
all-or-nothing is enforced by documentation rather than by the selector — and
the strict version would cost the enumeration above on every rule, to improve
markup that is already wrong. What the loose clause gives a mixed row is the
inline treatment for all of its steps, which is the harmless direction: each
item is still sized on its own content.

### Nothing counts the steps

No selector in the component reads `:nth-child`, and none needs to. Whether a
step is compact is decided by that step's content, at every width.

A count check is the natural instinct for a stepper, so it is worth stating
what it would be for and why the component declines it. A representation that
*hides* labels below a width only helps at four or five steps — two or three
stay readable stacked far below any width worth designing for — so it needs a
lower bound:

```css
/* four steps or more */
:has(> :nth-child(4))
```

and, to keep a 6+ row on the base layout, one of two upper bounds as well:

```css
/* exactly 4 or 5 */
:has(> :nth-child(4):last-child, > :nth-child(5):last-child)

/* at least 4, fewer than 6 */
:has(> :nth-child(4)):not(:has(> :nth-child(6)))
```

Both upper bounds are defensible as "the enumeration *is* the contract" — the
selector stating the supported counts. That argument holds only if 6+
horizontal is a case worth serving carefully. It is not. It is out of contract,
and the enumeration buys it a curated fallback at the cost of four
`:nth-child` clauses on every rule of the block, on every row that *is*
supported.

So a 6+ row goes inline at wide widths, calibrated for a count it does not
have. That is what out of contract means: the rules apply as written. The docs
say 2 to 5 and point longer sequences at `.steps-vertical` rather than promising
a graceful degradation nobody asked for.

The tests hold the same line: there is no six-step fixture. Pinning what such a
row does — "no rule fires", or "it compacts" — turns an accident of the
selectors into an API nobody promised, and would have to be revisited every
time a threshold moved. What is out of contract is not tested for behaviour.

Vertical is the other thing a rule might need to exclude, and it needs no guard
either: the container query addresses `.steps-horizontal` by name, so there is
nothing to exclude. See "Two compositions, one primitive".

### The containment grant

The inline representation reads the nearest `actual-container` size context,
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

The grant is an enhancement in both directions. An unlabelled sequence needs
none — its shape is intrinsic, in either orientation. A labelled one needs none
either: stacked is the baseline, and the grant only buys the wide composition.
**The container does not rescue the component; it improves how it composes.**

### Navigation is a labelled affair

Only a `.step-label` can be a link, so navigation and labels are one decision.
A marker is never interactive, which rules out the doubtful case directly: five
clickable circles with no visible name.

That single rule is also what keeps a focus guard out of the layout. `.sr-only`
leaves an element in the tab order at 1×1 under `clip-path: inset(50%)`, so a
focus ring lands on nothing — and a component that hides labels to fit needs to
refuse any row whose labels are navigable:

```css
:not(:has(a[href]))
```

Such a guard has to read structure rather than state, because `aria-current`
moves as the workflow advances and the same link goes future → current →
complete: a state-keyed guard flickers under the user. It also has to be
deliberately loose — `:has(a[href])` reads the whole subtree — since refusing on
more than you promise is the safe direction. None of that is needed here:
nothing hides a label, so no rule has to ask whether hiding one would be safe.

The contract is one sentence. A step label may be a link, a marker never is, and
anything else focusable in a step is out of contract.

The one `:has(a[href])` in the file is unrelated: a navigable row reserves
`padding-block` for its focus ring, because the scroll container clips at the
padding edge. See "Scrolling on one axis".

A link needs no styling rule of its own to go with it. `color: inherit` sits in
the `.steps .step-label` rule: a span inherits its ink anyway, so only a link
has a `--link` colour to take back, and taking it back for every label costs
nothing and one rule less. That rule stays scoped to `.steps` — unlike
`.menu-item-text` and the framework's other sub-part classes — because a bare
`.step-label` weighs (0,1,0), exactly `.prose :where(a)`, so a stepper inside
prose would be decided by the order the bundle concatenates two files in.

## Why nothing hides a label

**The framework does not silently remove content to solve a layout problem.**
That is the sentence the whole component turns on, and it is worth defending in
detail, because hiding labels below a width is the obvious design for a
stepper and it is a well-measured trap.

### The shape it rules out

A container query hiding every label of a four- or five-step row below 35rem:

```text
< 35rem  + 4 steps or more  markers only, unless a label is a link
```

with `.sr-only` on `.step-label`, so the text stays in the accessibility tree
while its box disappears. Or the same rules behind a public class, so the author
picks the representation instead of a width picking it.

The threshold is not the weak part. Items hold at `flex: 1 0 var(--step-min)`,
so a row's intrinsic width is `count × --step-min` — 35rem for five steps — and
the query fires exactly where a five-step stacked row starts to scroll. Four
steps share that threshold rather than getting their own at 28rem, so between
448px and 560px they compact although stacked would still fit; splitting the
difference at 32rem is worse, handing five-step rows a scrolling band instead
(40px of overflow at 520px, 20px at 540px).

### Why the premise fails

It asks the author to write five step names and then takes them away. Made
explicit as a class, that is a public API whose entire meaning is *hide the
content I just made you author* — plus a `.sr-only` clone in the component,
plus a link guard so the hiding cannot clip a focus target, plus documentation
explaining why four steps behave differently from three. The hidden markup ends
up richer than the visible interface: a second, invisible version of the
component.

And the accessibility it buys is thinner than it looks. A CSS-numbered `<li>`
sequence with five hidden names is not a better announcement than the sentence
the page already contains. In practice the page says **Step 3 of 5 —
Validation**, and the sequence is a picture of it.

So the question is not "how narrow before labels must go?" but "does this
sequence carry names at all?", and that one is the author's to answer in
markup. An unlabelled sequence is compact because it has nothing to show; a
labelled one keeps everything it was given. When a labelled row does not fit,
the honest answers are scrolling, more space, or `.steps-vertical`.

### What the rule is worth, concretely

Holding that line is what keeps all of the following out of the component:

* a second container query, and the `< 35rem` threshold in it;
* `:has(> :nth-child(4))`, and any other rule that counts steps;
* `:not(:has(a[href]))` on a layout rule — a rule asking whether hiding would
  be safe;
* a `.sr-only` clone inside the component, and `clip-path` anywhere in the file;
* a marker-only variant class, and the `:not(...)` guard the wide query would
  need to leave it alone;
* two of three `grid-template-rows` declarations and a `gap: 0`, since the base
  template need not build a label row for a step that has no label;
* a browser test proving the focus guard reads structure rather than state, and
  the four- versus five-step threshold fixtures;
* a documentation section explaining why three steps behave differently from
  four.

It also generalises for free. Once "markers only" is *a step with no content*
rather than *a representation of a labelled step*, the same sentence describes
the column, and the contract is two independent dimensions rather than one
orientation with a mode:

```text
orientation  x  labels  =  four compositions, no variant classes
```

### The cheap versions of hiding, for the record

Hiding a label is declarations, not a value, so it cannot ride on a custom
property the way a `--step-min` override can. The tempting shortcuts each fail
on their own terms: zero block-size and `font-size: 0` lose the accessible
name, and style queries sit above the support floor.

Relatedly, the wide block's declarations are written out rather than
abstracted. One container query with an explicit body is easier to read, and to
change, than any clever indirection.

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

### Forced colors, and why there is no override

Forced colors drops the accent fill, so in a numbered flow a complete marker and
an upcoming one both render as a ringed disc with a number in it. Current still
reads, on its thicker ring and its bolder label; complete and upcoming do not
separate.

The obvious remedy is a `@media (forced-colors: active)` block giving complete a
system `Highlight` fill and `HighlightText` text. Captured with forced colors
emulated through the DevTools protocol, that fill renders the marker's own
content — the counter, or a `--step-complete-mark` checkmark — unreadable: a
sliver of `HighlightText` inside a solid disc. It trades an ambiguity for an
illegible glyph, in the exact mode it exists to help.

So there is no such block, and the honest answer is documented instead:
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
and a `.step-complete` child's connector would never follow its own state.

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
and not another — the shape of bug a fixed-width fixture cannot catch, which is
why the browser test sweeps fractional widths instead of sampling a few.

`overflow-y: hidden` settles it: there is genuinely nothing to scroll on that
axis, in any representation.

On the axis that does scroll, `overscroll-behavior-inline: contain` keeps a
swipe that reaches the end of the row from chaining to the page behind it.

What makes the row scroll rather than squash is the item floor:
`min-inline-size: max(var(--step-size), var(--step-min))`. The `max()` is there
so an author who lowers `--step-min` below `--step-size` narrows the scroll
budget without collapsing items behind their own markers.

The cost of scrolling is that clipping happens at the padding edge, and a focus
ring is drawn outside its element's border box — `--focus-outline` is two
border-widths wide at `--focus-outline-offset`, so 4px past a label that sits
flush with the bottom of a stacked row. A navigable row therefore reserves
exactly that much `padding-block`, gated on `.steps-horizontal:has(a[href])`. An
informational stepper — the common case, with no ring to protect — keeps its
height, and so does a navigable column: the padding is compensation for the
row's clip, and the column is not a scroll container at all.

The two cheaper answers each cost something worse. Reserving the space
unconditionally is one rule shorter and 8px taller on every stepper in the
framework. Clipping, and letting focus scroll the ring into view, keeps the
height and moves the row under the reader instead.

## Two compositions, one primitive

`.steps` is the component. `.steps-horizontal` and `.steps-vertical` are peers,
both required, neither the default. Vertical is an explicit orientation, never a
responsive fallback, and it has no step-count limit: its practical limit is the
surrounding layout rather than a row's width budget.

`.steps` holds what a step *is*, under its own name. `.steps-horizontal` and
`.steps-vertical` hold what is genuinely per-orientation. Nothing excludes
anything, nothing undoes anything, and the rules read as what they are:

```text
.steps             what a step is
.steps-horizontal  a row, plus its container query
.steps-vertical    a column
```

There is no third class, and no third *composition* either. A compact
progression is the same `.steps-horizontal` with empty items, and a compact
rail is the same `.steps-vertical` with empty items — which is why neither
needs a name of its own. See "Why nothing hides a label".

The cost is one class on the horizontal markup, where the orientation could be
implicit. That is the right direction: if vertical is an explicit orientation
rather than a fallback, horizontal being explicit too is the same claim stated
once more.

`.steps` on its own is incomplete markup. That is a real footgun — it renders a
flex row of unpositioned markers rather than nothing — and it is the price of
having neither orientation be the default. Documented, not defended.

### Why the primitive needs a class of its own

Both alternatives cost more, and each in a way that is easy to mistake for
economy.

**Vertical as a modifier** — `.steps` meaning both the component and the
horizontal layout — makes the column inherit a row and then undo it. Six
declarations exist for no other reason:

| Undone | Because the row sets |
| --- | --- |
| `overflow: visible` | `overflow-x: auto` |
| `overscroll-behavior: auto` | `overscroll-behavior-inline: contain` |
| `flex: none` | `flex: 1 0 var(--step-min)` |
| `grid-template-rows: auto` | `grid-template-rows: var(--step-size)` |
| `min-inline-size: 0` | `min-inline-size: max(--step-size, --step-min)` |
| `text-align: start` | `text-align: center` |

And it forces the inverse on the horizontal side: every rule that must not
reach a column carries `:not(.steps-vertical)` — the focus-ring rule plus every
rule in the container query.

**Two independent roots** — `.steps` and `.steps-vertical` sharing no class —
zeroes both of those lists. But then the shared half of the component (the
counter, the marker, `.step-label`, `.step-complete`, `aria-current="step"`) has
no name, and has to be spelled `:is(.steps, .steps-vertical)` on twelve rules.
Twelve rules needing the same two-class prefix is what a shared primitive looks
like when it has not been given a class of its own.

### `justify-items: start` is not a reset

It looks like one, sitting in `.steps-vertical > li` next to properties the row
also sets. It is the column's own alignment, and it is load-bearing: grid items
blockify, so a label left at the default `normal` stretches across the whole
`1fr` track — measured, an `a.step-label` goes from 75px to 264px. That is a
full-width hover target and a full-width focus ring in a column, where the same
link in a row gets a box that hugs its text.

### The connector's terminator

The connector's geometry belongs to each composition, so only the question of
*which* steps get one is shared. One rule states the condition:
`.steps > li:not(:last-child)::after`. A pseudo-element with no content
generates no box, so both compositions can address `> li::after` freely and
neither can grow a line past the final step. Nothing to order, nothing to weigh.

The alternative is two rules pulling against each other —
`> li::after { content: "" }` and `> li:last-child::after { content: none }` —
which makes "does a line trail the last step" a specificity question, and makes
a stray `content` in a geometry rule enough to break it.

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
