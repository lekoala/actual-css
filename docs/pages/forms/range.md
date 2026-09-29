# Range

> Native range input with a lightweight theme-aware custom skin.

`.range` keeps the native range control and its interaction semantics, while
customizing the track, thumb, focus state, intents, and disabled state. The
focus ring targets the thumb — the surface the user actually manipulates —
rather than the CSS box.

**Related terms:** slider, range input, scrubber.

```html demo
<label class="field">
  <span class="field-label">Volume</span>
  <input class="range" data-enhance="range" type="range" min="0" max="100" value="50" />
</label>
```

## Fill

`data-enhance="range"` opts into the `actual-css/js/range` behavior. It writes
`--range-progress`, the fill share the track gradient reads, and keeps it in
sync on input and after a form reset, including inputs associated through
`form="…"`. Without it the variable stays at its `0%` default and the track
renders plain — the control stays fully usable without JavaScript. The fill
follows the writing direction, and a bare `input[type="range"]` without the
`.range` class can opt in the same way.

## Named values

A `datalist` is the source of truth for discrete named steps: positions plus
names. Browsers render its ticks and labels inconsistently, so Actual never
depends on their presentation — the enhancement only reads `option` values and
their `label`. A matching label sets `aria-valuetext` on the input and mirrors
into each `<output for="…">`. The output is the visible value, not the input's
name — give the input its own accessible name, since `for` only declares the
output's operands.

```html demo
<div class="field">
  <output class="field-label" for="effort">High</output>
  <input
    class="range"
    data-enhance="range"
    id="effort"
    type="range"
    min="0"
    max="3"
    step="1"
    value="2"
    list="effort-levels"
    aria-label="Effort"
  />
  <datalist id="effort-levels">
    <option value="0" label="Minimal"></option>
    <option value="1" label="Standard"></option>
    <option value="2" label="High"></option>
    <option value="3" label="Maximum"></option>
  </datalist>
</div>
```

`aria-valuetext` is the announced value when a number really means a text; keep
it even if the visible `output` changes shape. An `output` is a live region,
so verify with a screen reader that the two do not double-announce.

## In a flyout

The range stays an `input`, the flyout stays a flyout — together they read as
a richer picker with no new component. `data-flyout-auto-close="outside"` keeps
dragging the slider from closing the panel.

```html demo
<div class="flyout-trigger">
  <button
    class="btn outline"
    type="button"
    data-enhance="flyout"
    aria-expanded="false"
    aria-controls="effort-picker"
  >
    Reasoning effort
  </button>

  <div
    class="flyout"
    id="effort-picker"
    data-flyout-auto-close="outside"
    style="--flyout-inline-size: 16rem; --flyout-pad: var(--space-40)"
    hidden
  >
    <div class="field">
      <output class="field-label text-center" for="effort-flyout">High</output>

      <input
        class="range"
        data-enhance="range"
        id="effort-flyout"
        type="range"
        min="0"
        max="3"
        step="1"
        value="2"
        list="effort-flyout-levels"
        aria-label="Reasoning effort"
      >

      <datalist id="effort-flyout-levels">
        <option value="0" label="Minimal"></option>
        <option value="1" label="Standard"></option>
        <option value="2" label="High"></option>
        <option value="3" label="Maximum"></option>
      </datalist>
    </div>

    <div class="cluster" style="--cluster-justify: center">
      <button class="btn primary sm" type="button" data-flyout-close>Done</button>
    </div>
  </div>
</div>
```

Actual deliberately does not emulate tick marks or multi-thumb ranges. Ticks
still need engine-specific pseudo-elements; the fill above is designed for
deletion once `::slider-fill` is interoperable — see
[Enhanced range controls](https://github.com/lekoala/actual-css/blob/master/docs/design-notes/platform-alignment.md).

## CSS hooks

- `--range-thumb-size` — thumb diameter.
- `--range-track-height` — track thickness.
- `--range-thumb-bg` — thumb color. Defaults to the local intent, then `--primary`.
- `--range-track-bg` — track color.
- `--range-fill-bg` — filled portion color. Defaults to the local intent, then `--primary`.
- `--range-progress` — fill share. Written by `actual-css/js/range`, never set by hand.
