# Color swatches

> Pick a color from a palette the application defines, inline or from a flyout.

**Related terms:** color picker, palette, swatch, color chip, accent color, label color.

`.color-swatch` is a `<label>` wrapping a native radio, with the color in
`--color-swatch-value`. The radio stays the control: it submits, takes the
arrow keys and carries the name in `aria-label`. The checked swatch shows a
double ring that reads on any color. Use checkboxes for several colors at once.

For a free color, use the native [`.color`](controls.md) picker; a custom
spectrum or RGB sliders are outside Actual.

## Palette

Lay the swatches out with `.cluster` or `.grid`.

```html demo
<fieldset class="field-group cluster">
  <legend>Category color</legend>
  <label class="color-swatch" style="--color-swatch-value: #2563eb"><input type="radio" name="category" value="#2563eb" aria-label="Blue" checked></label>
  <label class="color-swatch" style="--color-swatch-value: #10b981"><input type="radio" name="category" value="#10b981" aria-label="Green"></label>
  <label class="color-swatch" style="--color-swatch-value: #f59e0b"><input type="radio" name="category" value="#f59e0b" aria-label="Amber"></label>
  <label class="color-swatch" style="--color-swatch-value: #e11d48"><input type="radio" name="category" value="#e11d48" aria-label="Rose"></label>
  <label class="color-swatch" style="--color-swatch-value: #ffffff"><input type="radio" name="category" value="#ffffff" aria-label="White"></label>
</fieldset>
```

## Palette in a flyout

A `<button class="color-swatch">` shows the current color and opens the
palette as a [flyout](../enhancements/flyout.md). A pointer pick closes it;
the arrow keys move through the colors with the panel open, and Escape returns
to the button. Give the panel `--flyout-pad` so the focus ring fits inside it.
Application code shows the pick on the button.

```html demo
<span class="field-label" id="accent-label">Accent color</span>
<div class="flyout-trigger">
  <button class="color-swatch" type="button" data-enhance="flyout"
          aria-controls="accent-palette" aria-expanded="false"
          aria-labelledby="accent-label accent-name"
          style="--color-swatch-value: #2563eb">
    <span class="sr-only" id="accent-name">Blue</span>
  </button>
  <div class="flyout" id="accent-palette" style="--flyout-pad: var(--space-30)" hidden>
    <div class="cluster" role="radiogroup" aria-labelledby="accent-label">
      <label class="color-swatch" style="--color-swatch-value: #2563eb"><input type="radio" name="accent" value="#2563eb" aria-label="Blue" checked></label>
      <label class="color-swatch" style="--color-swatch-value: #10b981"><input type="radio" name="accent" value="#10b981" aria-label="Green"></label>
      <label class="color-swatch" style="--color-swatch-value: #f59e0b"><input type="radio" name="accent" value="#f59e0b" aria-label="Amber"></label>
      <label class="color-swatch" style="--color-swatch-value: #e11d48"><input type="radio" name="accent" value="#e11d48" aria-label="Rose"></label>
    </div>
  </div>
</div>
<script>
  (() => {
    const preview = document.currentScript.closest(".docs-preview");
    const trigger = preview.querySelector("button.color-swatch");
    preview.querySelector(".flyout").addEventListener("change", (event) => {
      trigger.style.setProperty("--color-swatch-value", event.target.value);
      trigger.querySelector(".sr-only").textContent = event.target.getAttribute("aria-label");
    });
  })();
</script>
```

## Hooks

- `--color-swatch-value` — the color, set on each swatch.
- `--color-swatch-size` — visible swatch size, the height of a `.switch` track
  by default; the hit area stays `--control-size`. `.sm` and `.lg` scale both.
- `--color-swatch-radius` — corner radius; round by default.
