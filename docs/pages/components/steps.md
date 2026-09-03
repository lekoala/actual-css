# Steps

> Progress through a short multi-step flow.

Use an `<ol>` because the order is part of the meaning. Add `.step-complete` to
finished steps and `aria-current="step"` to the current one. Unmarked steps are
upcoming.

Orientation and labels are two independent choices.

`.steps` is the component; the orientation is a second class, and it is always
required:

| Markup                                | Orientation | Stages   |
|---------------------------------------|-------------|----------|
| `<ol class="steps steps-horizontal">` | horizontal  | 2 to 5   |
| `<ol class="steps steps-vertical">`   | vertical    | no limit |

Neither orientation is the default, so `.steps` on its own is incomplete markup.
Everything a step *is* — `.step-label`, `.step-complete`, `aria-current="step"`,
the marker and its states — comes from `.steps` and is identical in both. The
second class only decides how the sequence is laid out.

For a horizontal sequence longer than five stages, use `.steps-vertical` or
another progression pattern.

Step labels are then the other choice, and it is **optional in either
orientation**. A sequence is either entirely labelled or entirely unlabelled:

|                | Empty steps         | `.step-label` on every step           |
|----------------|---------------------|---------------------------------------|
| **horizontal** | compact progression | named sequence, stacked or inline     |
| **vertical**   | compact rail        | named sequence, labels beside markers |

- **Unlabelled steps are visual progress markers.** The surrounding interface
  communicates the current step and position.
- **Labelled steps carry the sequence names themselves**, and may use
  `a.step-label` for navigation. Actual CSS never hides an authored label to
  solve a layout constraint.

The component needs no JavaScript.

**Related terms:** stepper, progress steps, step indicator, wizard steps, multi-step progress.

## Basic usage

```html demo
<ol class="steps steps-horizontal">
  <li class="step-complete"><span class="step-label">Account</span></li>
  <li aria-current="step"><span class="step-label">Payment</span></li>
  <li><span class="step-label">Confirm</span></li>
</ol>
```

The three states stay distinct even without a checkmark:

- **Upcoming** — neutral marker
- **Complete** — filled marker and completed connector
- **Current** — outlined marker with a stronger ring

Only one step should use `aria-current="step"`.

The marker carries the state, so the label sits a notch below it: one size
smaller than body text, and neutral in weight. Only the current step's label is
emphasised — it is where you are now. A completed step needs no bold text; its
filled marker already says as much.

## Horizontal steps

`.steps-horizontal` is designed for **2 to 5 stages**.

### Without labels — visual progress only

Leave the items empty when the surrounding interface already says where the
user is. The row is then a drawn `3 / 5`, and the page carries the words:

```html demo
<div class="stack">
  <hgroup>
    <p class="overline">Step 3 of 5</p>
    <h3>Validation</h3>
  </hgroup>

  <ol class="steps steps-horizontal" aria-hidden="true">
    <li class="step-complete"></li>
    <li class="step-complete"></li>
    <li aria-current="step"></li>
    <li></li>
    <li></li>
  </ol>
</div>
```

```text
●────────●────────③────────○────────○
```

This form fits from phone width to desktop with no container query and no
variant class: with no label to make room for, a step only needs its marker.

The track runs edge to edge, so it lines up with the text around it. There is
no label to centre a marker against, so each marker takes the start of its own
share of the row and its connector fills the rest.

Hide it from assistive technology with `aria-hidden="true"`. A list of empty
`<li>`s whose numbers come from CSS is not a useful sequence to announce, and
the `hgroup` above already carries the accessible information — position and
step name. An unlabelled step is never interactive, so nothing focusable is
being hidden.

> An empty step means genuinely empty — no text, not even whitespace.
> `<li></li>` is a marker; `<li> </li>` is not. Same rule as `.badge:empty`.

### With labels — the sequence carries the names

Add `.step-label` to every step when the stepper itself should expose the step
names, or when a step should be navigable:

```html demo
<ol class="steps steps-horizontal" aria-label="Checkout progress">
  <li class="step-complete"><span class="step-label">Account</span></li>
  <li class="step-complete"><span class="step-label">Profile</span></li>
  <li aria-current="step"><span class="step-label">Validation</span></li>
  <li><span class="step-label">Payment</span></li>
</ol>
```

**Actual CSS never hides an authored step label.** Labels stay visible at every
width. If a labelled row does not fit its space, it scrolls — and the honest
answers to that are more room, fewer stages, or `.steps-vertical`.

### One presentation enhancement

With generous room, a labelled row moves marker and label inline and lets the
connector absorb the free space between groups:

```text
normal space
      ✓──────────2──────────3
   Account     Payment     Confirm

generous space
✓ Account ───────── 2 Payment ───────── 3 Confirm
```

Stacked is the baseline and is fully functional on its own. The inline form is
an enhancement, and it needs an `actual-container` size context the author
grants.

Resize the demo below. The 3-step flow needs less room than the supported
5-step maximum.

```html demo resize
<div class="stack">
  <ol class="steps steps-horizontal container-query" style="--step-complete-mark: '✓'">
    <li class="step-complete"><span class="step-label">Identification</span></li>
    <li aria-current="step"><span class="step-label">Confirmation</span></li>
    <li><span class="step-label">Finalisation</span></li>
  </ol>

  <ol class="steps steps-horizontal container-query" style="--step-complete-mark: '✓'">
    <li class="step-complete"><span class="step-label">Account</span></li>
    <li class="step-complete"><span class="step-label">Details</span></li>
    <li aria-current="step"><span class="step-label">Payment</span></li>
    <li><span class="step-label">Review</span></li>
    <li><span class="step-label">Confirm</span></li>
  </ol>
</div>
```

`.container-query` is only a convenience helper. You can grant the same shared
context in your own CSS:

```css
.checkout-steps {
  container: actual-container / inline-size;
}
```

A named wrapper works too; the stepper responds to the nearest
`actual-container` region.

One threshold decides it: from **60rem**, a labelled row goes inline; below it,
stacked. That is calibrated on five stages, the widest supported row, because
it is where a five-stage row still leaves its connector a real region rather
than a stub. Inline is a bonus for generous room, so switching late costs
nothing, and the same threshold then serves every stage count.

The step count changes nothing else. Whether a row has two stages or five, its
labels stay visible and it scrolls if it must.

Without an `actual-container`, or without container-query / `:has()` support,
the stacked layout remains fully functional. The unlabelled form needs neither:
it is compact by structure, not by query.

> `.container-query` uses inline-size containment. Put it where width comes from
> the layout context, not on a shrink-to-fit box. See the container-query helper
> for the full containment guidance.

## Vertical steps

Vertical steps are an explicit orientation, not a mobile fallback, and they are
not bound by the horizontal 2–5 stage limit.

Use `.steps steps-vertical` when the surrounding layout is naturally vertical —
for example a wizard sidebar or a narrow process panel. It is a peer of
`.steps-horizontal`, not a modifier on it: never write the two together.

```html demo
<ol class="steps steps-vertical" style="--step-complete-mark: '✓'">
  <li class="step-complete"><span class="step-label">Basic details</span></li>
  <li class="step-complete"><span class="step-label">Company details</span></li>
  <li aria-current="step"><span class="step-label">Subscription plan</span></li>
  <li><span class="step-label">Payment details</span></li>
</ol>
```

The state model is identical to horizontal steps. The composition is simply
different: markers form a vertical track and labels sit beside them.

### A compact rail

Leaving the items empty works here too, and gives a marker rail — useful for a
narrow sticky sidebar next to content that names the step:

```html demo
<div class="cluster">
  <ol class="steps steps-vertical" aria-hidden="true">
    <li class="step-complete"></li>
    <li class="step-complete"></li>
    <li aria-current="step"></li>
    <li></li>
    <li></li>
  </ol>

  <hgroup>
    <p class="overline">Step 3 of 5</p>
    <h3>Validation</h3>
  </hgroup>
</div>
```

The rail is exactly as wide as its markers, so it costs nothing in a
shrink-to-fit column.

Vertical steps stay vertical at every width. The container query only refines
the horizontal orientation.

There is no fixed stage count for the vertical orientation. A longer sequence is
fine as long as it remains useful and readable in its surrounding layout.

## Connectors

Steps uses a line between markers by default.

`--step-connector` controls the default horizontal connector background. It
accepts a complete CSS background value, so a theme can replace the line with a
gradient, image or nothing at all.

In the wide horizontal representation, the connector expands into the free
space between marker + label groups. A theme can replace only that representation
with `--step-inline-connector`, for example a custom chevron SVG:

```css
.checkout-steps {
  --step-inline-connector:
    url("../icons/chevron.svg") center / 1rem 1rem no-repeat;
}
```

Vertical steps have no connector hook of their own. The vertical geometry is
different, so a horizontal value cannot transpose onto it — override
`.steps-vertical > li::after` directly if a design ever needs to.

Connectors are decorative. The ordered list and its labels carry the meaning of
the sequence.

## Navigation

Steps are informational by default, and **only a labelled step can be
navigable**: navigation is expressed by making a `.step-label` an `<a href>`.
Markers are never interactive, so an unlabelled row is visual progress and
nothing more.

The `<a href>` is the whole interactive surface: a `<button>` or any other
focusable element inside a step is outside the component contract. Only make a
label a link when the workflow genuinely allows navigation to that step:

```html demo resize
<ol class="steps steps-horizontal container-query">
  <li class="step-complete">
    <a class="step-label" href="#">Account</a>
  </li>
  <li class="step-complete">
    <a class="step-label" href="#">Details</a>
  </li>
  <li aria-current="step">
    <span class="step-label">Payment</span>
  </li>
  <li>
    <span class="step-label">Confirm</span>
  </li>
</ol>
```

Keep `aria-current="step"` on the current `<li>`.

A step link keeps the colour of its own state rather than the theme's `--link`,
so the marker states stay the strongest signal in the row. Its underline, hover
and focus ring are untouched — that is what marks it as navigable. If a touch
target needs to be more generous, put `.touch-target` on the anchor rather than
growing the stepper.

## Hooks

On `.steps`, so both orientations read them:

- `--step-size` — marker diameter
- `--step-inline-gap` — spacing between marker, label and connector inline
- `--step-line-size` — connector thickness
- `--step-marker-radius` — marker corner radius
- `--step-complete-mark` — content used instead of the number on completed steps

`.steps-horizontal` only:

- `--step-min` — minimum item width in the stacked horizontal layout
- `--step-gap` — marker-to-label space in the stacked horizontal layout
- `--step-connector` — default horizontal connector background
- `--step-inline-connector` — optional connector background for wide horizontal steps

`.steps-vertical` only:

- `--step-vertical-gap` — space between vertical steps

## Notes

Do not mix labelled and unlabelled steps in one sequence. Each step is sized on
its own content, so a mixed sequence renders a narrow marker between reading-
width steps — it lays out, but it reads as a gap rather than as progress.

A step name belongs in a `.step-label`. Bare text in an `<li>` is outside the
contract: it is content, so it gets a reading width like a label, but no rule
places or aligns it.

The **2 to 5** range applies to the horizontal orientation, and the inline
threshold is calibrated for it. A longer horizontal sequence is out of
contract: it still renders, but the geometry was never designed for that count.

The vertical orientation has no equivalent hard limit; its practical limit is
the surrounding layout and whether the sequence remains useful to scan.

An unlabelled sequence intentionally leaves presentation of the current step
name to the surrounding interface. If a narrow layout needs every step name
visible at once, a labelled `.steps-vertical` is usually the better
composition.

In Windows forced-colors mode the accent fill is dropped, so a completed marker
and an upcoming one both render as a ringed disc with a number. Set
`--step-complete-mark` — a checkmark, for instance — if your flow needs the two
to stay distinguishable there. Steps deliberately ships no forced-colors
override of its own: painting the marker `Highlight` makes the number or glyph
inside it unreadable, which is worse than the ambiguity it removes.

The inline threshold is calibrated to the default `--step-min`. Container
queries cannot read custom properties, so changing `--step-min` moves the
scroll budget but not the threshold.

See [Steps representations and thresholds](https://github.com/lekoala/actual-css/blob/master/docs/design-notes/steps.md)
for why the contract is shaped this way, and which alternatives were measured
and rejected.
