# Steps

> Semantic ordered-list progression for a multi-step process.

Use an `<ol>` because order is part of the meaning. Wrap each label in
`.step-label`, add `.complete` to finished steps and `aria-current="step"` to
exactly one current step. Unmarked items are future steps. The component needs
no JavaScript.

Steps is a compact pattern for workflows of **2 to 5 stages** with short labels.
Beyond five the UX changes category and the framework promises nothing.

The three states are distinct without any glyph: future is neutral, complete is
a filled marker with an accented connector, current is an outlined marker with a
thicker ring. The accented connector reads as "already walked", so the segment
leaving the current step stays neutral. A step carrying both states renders
entirely as current — marker, glyph, and connector.

**Related terms:** stepper, progress steps, step indicator, wizard steps, multi-step progress.

## Class reference

| Class                   | Kind      | Description                                          |
|-------------------------|-----------|------------------------------------------------------|
| `.steps`                | Component | Ordered progression with numbered markers.           |
| `.step-label`           | Component | A step's label. Required by label-aware layouts.     |
| `.complete`             | State     | A finished step: filled marker.                      |
| `[aria-current="step"]` | State     | The current step: outlined marker.                   |

```html demo
<ol class="steps">
  <li class="complete"><span class="step-label">Account</span></li>
  <li aria-current="step"><span class="step-label">Payment</span></li>
  <li><span class="step-label">Confirm</span></li>
</ol>
```

Plain text labels stay supported for a simple stepper and render identically:

```html demo
<ol class="steps">
  <li class="complete">Account</li>
  <li aria-current="step">Payment</li>
  <li>Confirm</li>
</ol>
```

Label-aware behaviour needs `.step-label`, because a bare text node is an
anonymous grid item that CSS cannot address. Use the element unless the stepper
is a one-off. When a workflow genuinely allows navigating back to a step, make
`.step-label` itself the `<a>` rather than nesting a control inside it — that is
the shape the component reads.

## Intrinsic responsiveness

`.steps` fills its row when the steps fit and holds each item at `--step-min`
otherwise, so the sequence scrolls horizontally only when it genuinely cannot
fit — no breakpoint. The threshold is space-driven: how many steps fit depends
on their number and the configurable minimum item width `--step-min`. Labels
wrap inside their item when needed.

Because `.steps` is an `<ol>` that can scroll horizontally, its overflow is not
focusable by default in every browser. Prefer a `--step-min` that fits the
common case, and only give a step flow `tabindex="0"` when your content
genuinely needs keyboard access to the overflow — the framework adds neither
JavaScript nor a tabindex automatically.

Keep state classes aligned with the real process state; they are visual, while
`aria-current="step"` also exposes the current position to assistive technology.
Do not put links or buttons around a step unless the workflow genuinely allows
the user to navigate to it.

## Narrow widths

When the row can no longer fit, `.steps` keeps every marker and the current
label and visually hides the other labels — the sequence keeps its shape
instead of sliding out of view, and every accessible name survives. Scroll is
the last resort, for when even the compact form cannot fit.

This is not a variant you switch on. It is what the component does once it can
has an `actual-container` size context — the framework's shared name for "here
is the width you were allocated". That part is yours to grant, because
containment would collapse a step flow whose width came from its own contents.
Add the ready-made class to the row:

```html demo resize
<ol class="steps container-query">
  <li class="complete"><span class="step-label">Identification</span></li>
  <li aria-current="step"><span class="step-label">Confirmation</span></li>
  <li><span class="step-label">Payment</span></li>
</ol>
```

Narrow this page and the row above swaps its labels for markers — the other
demos have no grant, so they stay plain `.steps` at any width.

or declare the same name yourself and keep the markup clean:

```css
.checkout-steps {
  container: actual-container / inline-size;
}
```

Either way the row's own width is the one measured. A region around it works
too, and then the width measured is that region's — the component responds to
its nearest `actual-container`, it does not necessarily measure itself. That is
the point of the shared name, and it also means a grant made for a `.grid-N` in
the same region reaches a step flow inside it.

The threshold is not a breakpoint. Items hold at `--step-min`, so the row's
intrinsic width is `count × --step-min` and the compact form takes over on the
exact width where the row would otherwise begin to scroll.

It stays out of the way unless it can keep that promise:

- **Width from the context.** Grant it in normal block flow (a `.cluster`
  child is fine). On a float, `inline-block`, table, grid `auto` track, abspos
  box, or `max-content` parent, containment would collapse the step flow to
  nothing. Same caveat as `.container-query` anywhere else.
- **`.step-label` elements.** Bare text has nothing to hide, so it scrolls.
- **No interactive label.** A hidden link would stay in the tab order with its
  focus ring clipped away, so a navigable flow keeps its labels and scrolls.
- **2 to 5 steps.** Six or more scrolls.

Thresholds are calibrated on the default `--step-min`, and a container query
cannot read a custom property, so raising `--step-min` moves the scroll budget
but not them. Restate the `@container` rules if you need the two aligned.

Without `:has()` or container query support the component behaves as it always
has: intrinsic widths, then scroll.

### Hooks

- `--step-size` — marker diameter.
- `--step-min` — minimum item width; below this the sequence scrolls instead of
  squishing labels.
- `--step-gap` — space between each marker and label.
- `--step-line-size` — connector thickness.
- `--step-marker-radius` — marker corner radius (round by default).
- `--step-connector` — connector background; when set it overrides the color
  (defaults to each step's own line, so a `.complete` step's connector follows
  its selected color). A plain color by default, but any background (e.g. a
  dashed `repeating-linear-gradient`) works. `none` removes the line.
- `--step-connector-mark` — a `content` value drawn between steps, centred on
  the connector's midline. Coloured from `--step-line`, so it carries the same
  state as the default connector; a `--step-connector` gradient or colour
  repaints the track only. Independent of `--step-connector` — keep both for a
  glyph on the track, or `none` for a glyph alone. Stay within `--step-size`, or
  the scroll container clips it.
- `--step-complete-mark` — replaces the number on a `.complete` step with any
  `content` value (e.g. `"✓"`); defaults to the step number.

## Line or mark between steps

A track and a separator glyph are both connectors. The line is the default; a
mark replaces or joins it.

```html demo
<ol class="steps" style="--step-connector: none; --step-connector-mark: '›'">
  <li class="complete">Account</li>
  <li aria-current="step">Payment</li>
  <li>Confirm</li>
</ol>
<ol class="steps" style="--step-connector-mark: '•'">
  <li class="complete">Account</li>
  <li aria-current="step">Payment</li>
  <li>Confirm</li>
</ol>
```

A directional glyph is not mirrored for you — pair it with the writing mode:

```css
[dir="rtl"] .steps {
  --step-connector-mark: "‹";
}
```

Marks ship with empty `content` alt text where the browser supports it. The
sequence lives in the `<ol>` and the labels either way, so pick a glyph that
adds nothing to the reading and never one carrying the only copy of a state.
