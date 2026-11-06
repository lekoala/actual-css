# Stat

> One figure with its label, a detail line and an optional trend: KPI tiles,
> dashboard summaries, metric cards. Composed from a card, a grid and a badge;
> there is no stat component.

**Related terms:** KPI, metric, statistic, figure, stat card, number tile,
delta, trend indicator.

## Anatomy

- A label.
- The value, in a `<data value>` when it is a formatted number.
- A detail line: the period, a target, a comparison.
- An optional trend: a badge whose sign states the direction, so it reads
  without color. Use the minus sign `−`, which screen readers announce.

Keep the label first in source order, so each tile reads as one sentence.
`.grid` wraps the tiles as the width allows.

```html demo resize
<div class="grid" style="--grid-min: 12rem">
  <div class="card stack">
    <span class="muted">Revenue</span>
    <data class="text-title" value="48902">$48,902</data>
    <p class="cluster">
      <span class="badge success soft">+12.4%</span>
      <span class="muted">vs. last month</span>
    </p>
  </div>

  <div class="card stack">
    <span class="muted">Active users</span>
    <data class="text-title" value="1284">1,284</data>
    <p class="cluster">
      <span class="badge danger soft">−3.1%</span>
      <span class="muted">vs. last month</span>
    </p>
  </div>

  <div class="card stack">
    <span class="muted">Churn</span>
    <data class="text-title" value="0.009">0.9%</data>
    <p class="cluster">
      <span class="badge success soft">−0.3 pts</span>
      <span class="muted">lower is better</span>
    </p>
  </div>
</div>
```

## Inverted trends

When lower is better — churn, response time, open incidents — the sign keeps
following the number and the intent follows the outcome: a fall is `−` and
`success`. Say so in the detail line, as the Churn tile does, so the color is
never the only cue.

Promote the stat to a component only when the same markup is hand-rolled
across a product; until then, a local class on the card carries any
product-specific type or spacing.
