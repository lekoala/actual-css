# Meter

> Scalar measurement within a known range, not a progress indicator.

- Use native `<meter class="meter">`.
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

## CSS hooks

- `--bar-height` — bar thickness, shared with `.progress`.
