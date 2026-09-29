# Shimmer

> **Module** — import `actual-css/css/effects/shimmer` or `actual-css/css/effects`.

Shimmer sweeps a highlight across a text label to show an activity in
progress: an agent working, a chatbot composing, a job processing.

```html demo
<div class="stack">
  <span class="shimmer" role="status">Working…</span>
  <p class="cluster">
    <span class="spinner" aria-hidden="true"></span>
    <span class="shimmer" role="status">Generating the report…</span>
  </p>
</div>
```

**Related terms:** shimmering text, loading text, thinking indicator, pending
label, typing indicator.

Shimmer is presentation only and selects no ARIA attribute. Put
`role="status"` on a message that should be announced, and `aria-busy="true"`
on the region whose content is being updated — not on the message because it
looks busy. Assistive technology may hold back changes inside a busy region
until it is released.

The label rests on `--shimmer-color` and the band passes in
`--shimmer-highlight`; one pass takes `--duration-shimmer`, the pace shared
with `.skeleton` and indeterminate `.progress`. With reduced motion, or in a
browser without `background-clip: text`, the label is plain
`--shimmer-color` text.

## Choosing a waiting signal

| Primitive                  | Signals                                      |
| -------------------------- | -------------------------------------------- |
| [`.spinner`](spinner.md)   | An operation takes time                      |
| [`.skeleton`](skeleton.md) | Content is not available yet                 |
| `.shimmer`                 | This label describes an activity in progress |
| [`.aura`](aura.md)         | This object is emphasized                    |

They compose rather than imply one another: `aria-busy` never adds an aura or
a shimmer. A card being processed can carry several, each for its own reason:

```html demo
<span class="aura primary">
  <article class="card stack" style="inline-size: 18rem">
    <p><strong>Quarterly import</strong></p>
    <p class="shimmer" role="status">Processing 1,204 rows…</p>
    <div class="stack" aria-busy="true">
      <div class="skeleton" data-shape="text" aria-hidden="true"></div>
      <div class="skeleton" data-shape="text" aria-hidden="true"></div>
    </div>
  </article>
</span>
```
