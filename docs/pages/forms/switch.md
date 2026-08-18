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

## CSS hooks

- `--switch-width` — track width.
- `--switch-block-size` — track height.
- `--switch-knob-margin` — inset between knob and track.

Knob size and travel distance are derived from these three; set the three rather
than the derived values. Prefer `.sm` / `.lg`, which change `--control-size`.