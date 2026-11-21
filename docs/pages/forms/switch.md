# Switches

> Toggle controls that share a native checkbox at the markup level, with a switch visual.

```html demo
<label class="choice">
  <input class="switch" type="checkbox" role="switch" checked />
  <span>Notifications</span>
</label>
```

## Usage

- Apply `class="switch"` to a native checkbox and `role="switch"` for on/off semantics.
- Give it an accessible name through a label or `aria-label`.
- Use `checked` for the initial state and `.checked` to change it in JavaScript.

The browser exposes the native checked state to assistive technology; do not
add `aria-checked` or a change handler to synchronize it. The
[WAI-ARIA switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)
uses the native checked state for checkbox inputs.

Wrap a switch in `.choice` to pair it with a label. The switch stays
top-aligned with the first line of text, so labels that wrap onto two lines —
naturally or via an explicit line break — still sit cleanly.

```html demo
<label class="choice">
  <input class="switch" type="checkbox" role="switch" checked />
  <span>
    Release alerts
    <span class="field-help">Send status changes to the release channel.</span>
  </span>
</label>
```

```html demo
<!-- Multi-line labels keep the switch aligned with the first line. -->
<label class="choice">
  <input class="switch" type="checkbox" role="switch" />
  <span>
    Send a summary of account activity for the past month, including any
    unusual sign-ins, to the address on file.
    <span class="field-help">A long label that wraps onto a second line.</span>
  </span>
</label>
```

```html demo
<!-- Explicit line break, top-aligned with the first line. -->
<label class="choice">
  <input class="switch" type="checkbox" role="switch" />
  <span>
    Weekly summary with a<br />manual line break
    <span class="field-help">A forced two-line label.</span>
  </span>
</label>
```

## Notification preferences

For a notification matrix with two switch columns (email and push), see the
[notification preferences composition](../../demo/templates/blocks.html#notification-preferences).
Use native table headers for the shared rows and columns, and give each switch
an accessible name that includes both its topic and channel.

## Sizing and alignment

A switch is sized off the control typography, not field density. Its track
comes from `--choice-control-size` — the same token a checkbox and a radio use
— so the three sit on a line of text at matching weight. Density contexts change
`--control-size`, which is field height, and deliberately leave inline choices
alone.

The offset that centers each control on the first line of its label is derived
from that control's own height, so a checkbox and a taller switch land on the
same optical line. Change the type or the control size and they stay level:

```html demo
<!-- Same row, three heights: 18px checkbox, 18px radio, 20px switch track. -->
<div class="cluster">
  <label class="choice">
    <input class="check" type="checkbox" checked />
    <span>Checkbox</span>
  </label>
  <label class="choice">
    <input class="radio" type="radio" name="align-default" checked />
    <span>Radio</span>
  </label>
  <label class="choice">
    <input class="switch" type="checkbox" role="switch" checked />
    <span>Switch</span>
  </label>
</div>
```

```html demo
<!-- A looser line-height re-centers every control by the same rule. -->
<div class="cluster" style="line-height: 2.2;">
  <label class="choice">
    <input class="check" type="checkbox" checked />
    <span>Checkbox</span>
  </label>
  <label class="choice">
    <input class="radio" type="radio" name="align-tall" checked />
    <span>Radio</span>
  </label>
  <label class="choice">
    <input class="switch" type="checkbox" role="switch" checked />
    <span>Switch</span>
  </label>
</div>
```

```html demo
<!-- Scaling --choice-control-size grows the checkbox and the switch
     track together, and the row stays aligned. -->
<div class="cluster" style="--choice-control-size: 1.5em;">
  <label class="choice">
    <input class="check" type="checkbox" checked />
    <span>Checkbox</span>
  </label>
  <label class="choice">
    <input class="radio" type="radio" name="align-big" checked />
    <span>Radio</span>
  </label>
  <label class="choice">
    <input class="switch" type="checkbox" role="switch" checked />
    <span>Switch</span>
  </label>
</div>
```

### Hooks

- `--switch-bg` — track fill. At rest it is `--border-control`: the filled pill
  is the 3:1 edge that identifies the unchecked switch on its surface.
- `--switch-border` — track edge. It follows `--switch-bg`, so the track reads
  as one shape; a disabled track takes the quiet `--border` of a disabled
  check. Validation takes precedence.
- `--switch-knob` — knob fill. At rest it is `--surface-raised` in a light
  scheme and `--text` in a dark one, so it contrasts with the track.

- `--choice-control-size` — shared size for inline choices; the switch track is
  this plus `0.125em`, so scaling it scales the checkbox and the switch together.
- `--switch-width` — track width.
- `--switch-block-size` — track height.
- `--switch-knob-margin` — inset between knob and track.
- `--switch-knob-inline-size` — knob width; wider than its height makes a
  capsule knob. Defaults to the knob height.

### A lighter resting switch

The default puts the 3:1 cue of an unchecked switch on its track: a gray pill
whose knob only moves. A theme can move the cue to the knob instead, a dark
knob on a quiet track, which makes "off" lighter:

```css
.switch:not(:checked):not(:disabled) {
  --switch-bg: var(--border);
  --switch-knob: var(--text-muted);
}

.switch:not(:checked):not(:disabled):hover {
  --switch-bg: color-mix(in oklab, var(--text) 10%, var(--border));
}
```

The trade-off is the knob: dark when off, light on the colored track when on.
On the default palette the muted knob holds 5.9:1 against the surface in light
and 7.5:1 in dark. `actual-css contrast` reads a switch on its stronger cue,
track or knob.

Knob size and travel distance are derived from these hooks; set them rather
than the derived values. The knob is concentric in its track: the
inset is measured inside the border on both axes, so it clears the rails by the
same distance it clears the ends.
