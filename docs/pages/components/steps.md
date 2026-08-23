# Steps

> Semantic ordered-list progression for a multi-step process.

Use an `<ol>` because order is part of the meaning. Add `.complete` to finished
steps and `aria-current="step"` to exactly one current step. Unmarked items are
future steps. The component is horizontal by default; `.vertical` changes only
the layout and requires no JavaScript.

## Class reference

| Class                   | Kind      | Description                                |
|-------------------------|-----------|--------------------------------------------|
| `.steps`                | Component | Ordered progression with numbered markers. |
| `.complete`             | State     | A finished step.                           |
| `[aria-current="step"]` | State     | The current step.                          |
| `.vertical`             | Layout    | Stacks steps on the block axis.            |

```html demo
<ol class="steps">
  <li class="complete">Account</li>
  <li aria-current="step">Payment</li>
  <li>Confirm</li>
</ol>
```

## Vertical steps

```html demo
<ol class="steps vertical" style="max-inline-size: 18rem;">
  <li class="complete">Create an account</li>
  <li class="complete">Choose a plan</li>
  <li aria-current="step">Add payment details</li>
  <li>Confirm the subscription</li>
</ol>
```

Keep state classes aligned with the real process state; they are visual, while
`aria-current="step"` also exposes the current position to assistive technology.
Do not put links or buttons around a step unless the workflow genuinely allows
the user to navigate to it.

### Hooks

- `--step-size` — marker diameter.
- `--step-gap` — space between each marker and label, or between vertical steps.
- `--step-line-size` — connector thickness.
