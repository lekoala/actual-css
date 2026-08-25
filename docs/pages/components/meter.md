# Meter

> Scalar measurement within a known range, not a progress indicator.

- Use native `<meter class="meter">`.
- Use a segmented `<div class="meter" role="meter">` when the measurement
  needs a category breakdown.
- Shares progress styling DNA.
- Represents a scalar measurement within a known range, not task completion.
- Use explicit bar height to avoid padding issues.

```html demo
<div class="stack">
  <meter class="meter" value="0.8" min="0" max="1" low="0.3" high="0.7" optimum="1"></meter>
  <meter class="meter" value="0.5" min="0" max="1" low="0.3" high="0.7" optimum="1"></meter>
  <meter class="meter" value="0.2" min="0" max="1" low="0.3" high="0.7" optimum="1"></meter>
</div>
```

The three standard meter zones (optimum, suboptimum, even-less-good) map to the
shared `--success`, `--warning`, and `--danger` colors.

Segmented meters keep the overall measurement on the meter itself and expose
the category breakdown as composition. A segmented `.meter` is a flex container
whose direct children are weighted by `--meter-value`; child intent classes
define segment colors. The values are relative weights, so they do not need to
be converted to percentages. Keep the segments decorative with
`aria-hidden="true"` and provide category names and values in a nearby legend.
An unintentional child remains transparent, so the meter background can
represent an available or otherwise unclassified portion.

```html demo
<div class="stack">
  <div
    class="meter"
    role="meter"
    aria-label="Storage usage"
    aria-valuemin="0"
    aria-valuemax="8192"
    aria-valuenow="6854.45"
    aria-valuetext="6854.45 MB used of 8 GB"
  >
    <span class="primary" style="--meter-value: 4600" aria-hidden="true"></span>
    <span class="secondary" style="--meter-value: 1350" aria-hidden="true"></span>
    <span class="success" style="--meter-value: 904.45" aria-hidden="true"></span>
    <span style="--meter-value: 1337.55" aria-hidden="true"></span>
  </div>

  <div class="cluster">
    <span class="cluster">
      <span><span class="primary intent-color" aria-hidden="true">●</span> Regular <span class="muted">4600 MB</span></span>
    </span>
    <span class="cluster">
      <span><span class="secondary intent-color" aria-hidden="true">●</span> System <span class="muted">1350 MB</span></span>
    </span>
    <span class="cluster">
      <span><span class="success intent-color" aria-hidden="true">●</span> Shared <span class="muted">904.45 MB</span></span>
    </span>
    <span class="cluster">
      <span><span class="muted" aria-hidden="true">●</span> Free <span class="muted">1337.55 MB</span></span>
    </span>
  </div>
</div>
```

### Hooks

- `--bar-height` — bar thickness, shared with `.progress`.
- `--meter-value` — relative weight of a direct child in a segmented meter.
