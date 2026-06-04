# Data

Tables, metrics, and progress indicators.

## Intents

- `.primary`
- `.secondary`
- `.success`
- `.warning`
- `.danger`
- `.neutral`

## Table

Styled table with header.

```html
<div class="table-wrap">
  <table class="table">
    <thead>
      <tr><th>Name</th><th>Status</th></tr>
    </thead>
    <tbody>
      <tr><td>Alice</td><td><span class="badge success soft">Active</span></td></tr>
    </tbody>
  </table>
</div>
```

## Metric

Key metric display.

```html
<div class="metric">
  <span class="metric-label">Revenue</span>
  <strong class="metric-value">$42,200</strong>
  <span class="badge success soft">+12%</span>
</div>
```

## Progress

Progress bar with intent colors.

```html
<progress class="progress primary" max="100" value="72">72%</progress>
```

```html
<progress class="progress success" max="100" value="42">42%</progress>
```

## Meter

Meter with value ranges.

```html
<meter class="meter" min="0" max="100" low="70" high="90" optimum="35" value="42">42%</meter>
```

## Accessibility

- Use <table> for tabular data, not for layout.
- Provide text alternatives for progress and meter values.
