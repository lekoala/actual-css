# Switches

> Toggle controls that share a native checkbox at the markup level, with a switch visual.

- The API is `class="switch"`. Use `role="switch"` for ARIA correctness.
- The visual state tracks the native `checked` attribute. No JavaScript is required.
- For strict ARIA correctness, keep `aria-checked` in sync. This is an enhancement, not the baseline.

```html demo
<!-- Default: native state, no JS required. -->
<input class="switch" type="checkbox" role="switch" checked />
```

```html demo
<!-- Enhancement: keep aria-checked in sync. -->
<input class="switch"
       type="checkbox"
       role="switch"
       aria-checked="true"
       checked
       onchange="this.setAttribute('aria-checked', this.checked)" />
```

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

## Sizing and alignment

A switch is sized off the control typography, not field density. Its track
comes from `--choice-control-size` — the same token a checkbox and a radio use
— so the three sit on a line of text at matching weight. `.sm` and `.lg` change
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

## CSS hooks

- `--choice-control-size` — shared size for inline choices; the switch track is
  this plus `0.125em`, so scaling it scales the checkbox and the switch together.
- `--switch-width` — track width.
- `--switch-block-size` — track height.
- `--switch-knob-margin` — inset between knob and track.

Knob size and travel distance are derived from the three `--switch-*` hooks; set
those rather than the derived values. The knob is concentric in its track: the
inset is measured inside the border on both axes, so it clears the rails by the
same distance it clears the ends.
