# Steps

> Progress through a short multi-step flow.

Use an `<ol>` because the order of the steps is part of the meaning.

Add `.complete` to finished steps and `aria-current="step"` to the current one.
Unmarked steps are upcoming.

Steps is intended for **short flows of 2 to 5 stages** with concise labels. It
needs no JavaScript.

**Related terms:** stepper, progress steps, step indicator, wizard steps, multi-step progress.

## Basic usage

```html demo
<ol class="steps">
  <li class="complete">
    <span class="step-label">Account</span>
  </li>
  <li aria-current="step">
    <span class="step-label">Payment</span>
  </li>
  <li>
    <span class="step-label">Confirm</span>
  </li>
</ol>
```

The three states have distinct markers:

- **Upcoming** — neutral
- **Complete** — filled
- **Current** — outlined with a stronger ring

Only one step should use `aria-current="step"`.

Plain text labels also work for simple steppers:

```html
<ol class="steps">
  <li class="complete">Account</li>
  <li aria-current="step">Payment</li>
  <li>Confirm</li>
</ol>
```

`.step-label` is the recommended form when the label needs to be styled or
addressed independently.

## Responsive behaviour

Steps uses the available width when it can.

Each item keeps a minimum readable width controlled by `--step-min`. If the
whole sequence no longer fits, it scrolls horizontally rather than squeezing
labels into unreadable columns.

Keep labels short. If a workflow has many steps or needs long descriptions,
use a different navigation pattern rather than forcing everything into the
stepper.

Do not make steps links or buttons unless the workflow genuinely allows the
user to navigate between them.

## Hooks

- `--step-size` — marker size
- `--step-min` — minimum width of each step
- `--step-gap` — space between marker and label
- `--step-line-size` — connector thickness
- `--step-marker-radius` — marker corner radius
- `--step-connector` — connector background; `none` removes the line
- `--step-connector-mark` — glyph drawn between steps
- `--step-connector-mark-size` — connector glyph size
- `--step-complete-mark` — content used instead of the number on completed steps

## Line or mark between steps

The default connector is a line.

A separator mark can replace the line when you want a lighter or more
directional stepper:

```html demo
<ol
  class="steps"
  style="
    max-inline-size: 32rem;
    margin-inline: auto;
    --step-connector: none;
    --step-connector-mark: '›';
  "
>
  <li class="complete"><span class="step-label">Account</span></li>
  <li aria-current="step"><span class="step-label">Payment</span></li>
  <li><span class="step-label">Confirm</span></li>
</ol>
```

A mark can also sit on top of the normal track:

```html demo
<ol
  class="steps"
  style="
    max-inline-size: 32rem;
    margin-inline: auto;
    --step-connector-mark: '•';
  "
>
  <li class="complete"><span class="step-label">Account</span></li>
  <li aria-current="step"><span class="step-label">Payment</span></li>
  <li><span class="step-label">Confirm</span></li>
</ol>
```

The mark follows the connector's state colour, so completed sections stay
visually distinct.

Directional glyphs are not mirrored automatically:

```css
[dir="rtl"] .steps {
  --step-connector-mark: "‹";
}
```

Connector marks are decorative. The ordered list and its labels carry the
meaning of the sequence.
