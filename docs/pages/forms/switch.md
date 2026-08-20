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

## CSS hooks

- `--switch-width` — track width.
- `--switch-block-size` — track height.
- `--switch-knob-margin` — inset between knob and track.

Knob size and travel distance are derived from these three; set the three rather
than the derived values. Prefer `.sm` / `.lg`, which change `--control-size`.
