# Steps

> Semantic ordered-list progression for a multi-step process.

Use an `<ol>` because order is part of the meaning. Add `.complete` to finished
steps and `aria-current="step"` to exactly one current step. Unmarked items are
future steps. The component needs no JavaScript.

**Related terms:** stepper, progress steps, step indicator, wizard steps, multi-step progress.

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
  dashed `repeating-linear-gradient`) works.
- `--step-complete-mark` — replaces the number on a `.complete` step with any
  `content` value (e.g. `"✓"`); defaults to the step number.
