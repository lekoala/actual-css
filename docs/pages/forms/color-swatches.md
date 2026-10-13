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

## Palette and custom color

Add the native [`.color`](controls.md) picker to the panel for a color
outside the palette. Two changes to the flyout above:

- `data-flyout-auto-close="outside"` on the panel, so opening the color dialog
  does not close it, and `data-flyout-close` on each swatch, so a pointer pick
  still does. The arrow keys still move through the palette with the panel
  open.
- The custom input sits in a `<label class="cluster">`, which centers it on
  its text; `.choice` aligns checkboxes, radios and switches only.
- The custom input takes its own name. Application code unchecks the palette
  when a custom color is chosen, so the form sends `brand`, or `brand-custom`
  when no palette color is checked.

```html demo
<span class="field-label" id="brand-label">Brand color</span>
<div class="flyout-trigger">
  <button class="color-swatch" type="button" data-enhance="flyout"
          aria-controls="brand-palette" aria-expanded="false"
          aria-labelledby="brand-label brand-name"
          style="--color-swatch-value: #2563eb">
    <span class="sr-only" id="brand-name">Blue</span>
  </button>
  <div class="flyout stack" id="brand-palette" data-flyout-auto-close="outside"
       style="--flyout-pad: var(--space-30)" hidden>
    <div class="cluster" role="radiogroup" aria-labelledby="brand-label">
      <label class="color-swatch" data-flyout-close style="--color-swatch-value: #2563eb"><input type="radio" name="brand" value="#2563eb" aria-label="Blue" checked></label>
      <label class="color-swatch" data-flyout-close style="--color-swatch-value: #10b981"><input type="radio" name="brand" value="#10b981" aria-label="Green"></label>
      <label class="color-swatch" data-flyout-close style="--color-swatch-value: #f59e0b"><input type="radio" name="brand" value="#f59e0b" aria-label="Amber"></label>
      <label class="color-swatch" data-flyout-close style="--color-swatch-value: #e11d48"><input type="radio" name="brand" value="#e11d48" aria-label="Rose"></label>
    </div>
    <label class="cluster"><input class="color" type="color" name="brand-custom" value="#7048e8"> Custom…</label>
  </div>
</div>
<script>
  (() => {
    const preview = document.currentScript.closest(".docs-preview");
    const trigger = preview.querySelector("button.color-swatch");
    const palette = preview.querySelector(".flyout");
    palette.addEventListener("change", (event) => {
      const custom = event.target.type === "color";
      if (custom) for (const radio of palette.querySelectorAll('[type="radio"]')) radio.checked = false;
      trigger.style.setProperty("--color-swatch-value", event.target.value);
      trigger.querySelector(".sr-only").textContent = custom
        ? `Custom ${event.target.value}`
        : event.target.getAttribute("aria-label");
    });
  })();
</script>
```

The color dialog is the browser's own and looks different on each platform.

## Hooks

- `--color-swatch-value` — the color, set on each swatch.
- `--color-swatch-size` — visible swatch size, the height of a `.switch` track
  by default; the hit area stays `--control-size`. `.sm` and `.lg` scale both.
- `--color-swatch-radius` — corner radius; round by default.
