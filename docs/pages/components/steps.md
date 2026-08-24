# Steps

> Semantic ordered-list progression for a multi-step process.

Use an `<ol>` because order is part of the meaning. Add `.complete` to finished
steps and `aria-current="step"` to exactly one current step. Unmarked items are
future steps. The component needs no JavaScript.

## Class reference

| Class                   | Kind      | Description                                |
|-------------------------|-----------|--------------------------------------------|
| `.steps`                | Component | Ordered progression with numbered markers. |
| `.complete`             | State     | A finished step.                           |
| `[aria-current="step"]` | State     | The current step.                          |

```html demo
<ol class="steps">
  <li class="complete">Account</li>
  <li aria-current="step">Payment</li>
  <li>Confirm</li>
</ol>
```

## Intrinsic responsiveness

`.steps` fills its row when the steps fit and holds each item at `--step-min`
otherwise, so the sequence scrolls horizontally only when it genuinely cannot
fit — no breakpoint, and the threshold tracks the real content: three short
steps hold longer than six long ones. Labels wrap inside their item when
needed.

Keep state classes aligned with the real process state; they are visual, while
`aria-current="step"` also exposes the current position to assistive technology.
Do not put links or buttons around a step unless the workflow genuinely allows
the user to navigate to it.

### Hooks

- `--step-size` — marker diameter.
- `--step-min` — minimum item width; below this the sequence scrolls instead of
  squishing labels.
- `--step-gap` — space between each marker and label.
- `--step-line-size` — connector thickness.
- `--step-marker-radius` — marker corner radius (round by default).
- `--step-connector` — connector background; a plain color by default, but any
  background (e.g. a dashed `repeating-linear-gradient`) works.
- `--step-complete-mark` — replaces the number on a `.complete` step with any
  `content` value (e.g. `"✓"`); defaults to the step number.
