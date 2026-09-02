# Steps

> Progress through a short multi-step flow.

Use an `<ol>` because the order is part of the meaning. Add `.complete` to
finished steps and `aria-current="step"` to the current one. Unmarked steps are
upcoming.

Wrap each label in `.step-label`. The wrapper lets the horizontal stepper move
between its three space-aware representations without changing the markup.

Horizontal steps are designed and tested for **short flows of 2 to 5 stages**.
Vertical steps are not bound by that range; use as many stages as remain useful
in the surrounding layout.

The component needs no JavaScript.

**Related terms:** stepper, progress steps, step indicator, wizard steps, multi-step progress.

## Basic usage

```html demo
<ol class="steps">
  <li class="complete"><span class="step-label">Account</span></li>
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

Wrapping every label in `.step-label` is part of the component contract. The
wrapper is what the space-aware representations move, place or visually hide.

## Horizontal steps adapt to their space

Horizontal is the default orientation and is designed for **2 to 5 stages**.
With an `actual-container` size context, the same markup has three
representations.

### Wide — marker and label inline

With generous room, marker and label form one group and the connector absorbs
the free space between groups:

```text
✓ Account ───────── 2 Payment ───────── 3 Confirm
```

### Medium — label below the marker

As space tightens, labels move below their markers and each step gets a readable
share of the row:

```text
      ✓──────────2──────────3
   Account     Payment     Confirm
```

### Narrow — markers only, for 4 and 5 stages

A four- or five-stage row in a phone-width region would have to scroll. Rather
than that, it reduces to its markers:

```text
✓────────✓────────3────────4────────5
```

Two- and three-stage rows have no markers-only form. They stay readable stacked
far below any width worth designing for, and scroll below that, so removing
their labels would buy nothing.

The labels are only visually hidden; they stay in the ordered list for assistive
technology. The surrounding screen can present the current step name however it
needs — for example in its page title, form heading or a “Step 3 of 5” summary.

Actual CSS does not add tooltips or another interaction just to repeat those
labels.

Resize the demo below. The 3-step flow needs less room than the supported
5-step maximum.

```html demo resize
<div class="stack">
  <ol class="steps container-query" style="--step-complete-mark: '✓'">
    <li class="complete"><span class="step-label">Identification</span></li>
    <li aria-current="step"><span class="step-label">Confirmation</span></li>
    <li><span class="step-label">Finalisation</span></li>
  </ol>

  <ol class="steps container-query" style="--step-complete-mark: '✓'">
    <li class="complete"><span class="step-label">Account</span></li>
    <li class="complete"><span class="step-label">Details</span></li>
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

Two thresholds decide it:

| Container width | 2–3 stages | 4–5 stages |
| --- | --- | --- |
| below 35rem | stacked, scrolls if it must | markers only |
| 35rem to 60rem | stacked | stacked |
| from 60rem | inline | inline |

Both are calibrated on five stages, the widest supported row. **35rem** is the
five-stage `--step-min` budget, so no supported row ever scrolls where
markers-only could have helped; four stages share it and are therefore reduced
slightly earlier than they strictly need to be. **60rem** is where a five-stage
row still leaves its connector a real region rather than a stub — inline is a
bonus for generous room, so switching late costs nothing.

If labels are interactive, the markers-only representation is skipped. Hiding a
focusable label would create an invisible focus target, so a navigable flow keeps
its labels and uses the normal overflow fallback instead.

Without an `actual-container`, or without container-query / `:has()` support,
the stacked layout remains fully functional.

> `.container-query` uses inline-size containment. Put it where width comes from
> the layout context, not on a shrink-to-fit box. See the container-query helper
> for the full containment guidance.

## Vertical steps

Vertical steps are an explicit orientation, not a mobile fallback, and they do
not inherit the horizontal 2–5 stage limit.

Use `.steps-vertical` when the surrounding layout is naturally vertical — for
example a wizard sidebar or a narrow process panel:

```html demo
<ol class="steps steps-vertical" style="--step-complete-mark: '✓'">
  <li class="complete"><span class="step-label">Basic details</span></li>
  <li class="complete"><span class="step-label">Company details</span></li>
  <li aria-current="step"><span class="step-label">Subscription plan</span></li>
  <li><span class="step-label">Payment details</span></li>
</ol>
```

The state model is identical to horizontal steps. The composition is simply
different: markers form a vertical track and labels sit beside them.

Vertical steps stay vertical at every width. Container queries only refine the
horizontal orientation.

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

Steps are informational by default. Only make a label interactive when the
workflow genuinely allows navigation to that step:

```html
<li class="complete">
  <a class="step-label" href="/checkout/account">Account</a>
</li>
```

Keep `aria-current="step"` on the current `<li>`.

Interactive labels stay visible at narrow widths; the stepper prefers scrolling
over hiding a focusable control.

A step link keeps the colour of its own state rather than the theme's `--link`,
so the marker states stay the strongest signal in the row. Its underline, hover
and focus ring are untouched — that is what marks it as navigable. If a touch
target needs to be more generous, put `.touch-target` on the anchor rather than
growing the stepper.

## Hooks

- `--step-size` — marker diameter
- `--step-min` — minimum item width in the stacked horizontal layout
- `--step-gap` — marker-to-label space in the stacked horizontal layout
- `--step-inline-gap` — spacing between marker, label and connector inline
- `--step-vertical-gap` — space between vertical steps
- `--step-line-size` — connector thickness
- `--step-marker-radius` — marker corner radius
- `--step-connector` — default horizontal connector background
- `--step-inline-connector` — optional connector background for wide horizontal steps
- `--step-complete-mark` — content used instead of the number on completed steps

## Notes

The **2 to 5** range applies to the horizontal, space-aware stepper. Longer
horizontal sequences are not prevented, but they fall back to the base layout
instead of receiving the inline and markers-only adaptations.

The vertical orientation has no equivalent hard limit; its practical limit is
the surrounding layout and whether the sequence remains useful to scan.

The markers-only representation intentionally leaves presentation of the
current step name to the surrounding interface. If a narrow layout needs every
step name visible at once, `.steps-vertical` is usually the better composition.

The container-query thresholds are calibrated to the default `--step-min`.
Container queries cannot read custom properties, so changing `--step-min` does
not move those thresholds automatically.

See [Steps representations and thresholds](https://github.com/lekoala/actual-css/blob/master/docs/design-notes/steps.md)
for why the ranges are grouped this way, and which alternatives were measured
and rejected.
