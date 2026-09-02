# Combobox

> A searchable or multi-value combobox is not shipped by the framework — the native `<select>` and `<datalist>` stay the baseline. Theme an external combobox with Actual tokens instead.

The `.select` class keeps the native baseline with a CSS chevron, and the optional
`custom-select` module adds the `appearance: base-select` native picker where the
browser supports it. Beyond those, apply the framework's judgment from the
[data grid template](../../demo/templates/data-grid.html) to the problem: when a
real product needs a JavaScript combobox (searchable select, removable tags,
autocomplete suggestions), load a dedicated component and bridge its custom
properties onto Actual's tokens.

**Related terms:** combo box, combobox, autocomplete, datalist, searchable select, enhanced select, multiple select, tags, chips, tag input, pill input.

## Theme bridge

The [combobox template](../../demo/templates/combobox.html) themes
[`@lekoala/combobox`](https://github.com/lekoala/combobox) entirely with Actual
tokens: the control mirrors `.input`, chips re-derive the `.badge` soft recipe,
and the picker popover follows `--surface-raised` and `--shadow-popout`. No
adapter, no compatibility layer — a handful of `--cb-*` assignments and shared
mix tokens.

```html
<label class="field actual-combobox">
  <span class="field-label">Skills</span>
  <combo-box placeholder="Search or add a skill…">
    <select class="select" name="skills[]" multiple>
      <option value="design" selected>Design</option>
      <option value="css" selected>CSS</option>
      <option value="javascript" selected>JavaScript</option>
    </select>
  </combo-box>
</label>
```

The card in the template documents the full token map of this recipe.

## Lightweight pass-through

Most of the skin is three one-line token bridges. The visible vocabulary —
surface, border, radius, focus ring, danger, hover overlay and the `--soft-*`
mix — stays the Actual one, so light/dark mode, the preset themes and their
contrast contracts apply to the combobox for free:

```css
.actual-combobox {
  --cb-bg: var(--surface);
  --cb-color: var(--text);
  --cb-border-color: var(--border);
  --cb-border-radius: var(--radius);
  --cb-focus-color: var(--focus);
  --cb-muted-color: var(--text-muted);
  --cb-error-color: var(--danger);
  --cb-chip-bg: transparent;
  --cb-control-height: var(--control-size);
  --cb-option-min-height: var(--control-size);
}

.actual-combobox .cb-control:focus-within,
.actual-combobox .cb-text-control:focus {
  outline: 2px solid transparent;
  box-shadow: var(--focus-ring-shadow);
}

.actual-combobox .cb-chip-remove:focus-visible {
  outline: 2px solid transparent;
  box-shadow: 0 0 0 2px var(--focus-ring);
}

.actual-combobox .cb-chip {
  border: var(--border-width) solid
    color-mix(in oklab, var(--surface) var(--soft-border-mix), var(--primary));
  border-radius: var(--radius-full);
  background: color-mix(in oklab, var(--surface) var(--soft-bg-mix), var(--primary));
  color: color-mix(in oklab, var(--primary) var(--soft-fg-mix), var(--text));
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-strong);
}
```

The composite focus ring follows any internal focus, not just the search
input: focus a chip or its remove × and the control shows the same field ring,
with the local `:focus-visible` indicator on the chip or its × on top.

The same approach works for any widget that exposes a custom-property skin —
keep the widget's behavior, restyle its tokens through the shared vocabulary.