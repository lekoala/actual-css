# Segmented control

> One compact choice among a few options, on a shared track with the selected segment raised.

**Related terms:** segmented control, toggle group, pill tabs, view switcher, button group.

`.segmented` is the track and each `.segment` a direct child. The look is
shared; the semantics come from the markup, so pick the anatomy by what the
choice does:

| Use           | Markup                 | Selected               | Keyboard      |
| ------------- | ---------------------- | ---------------------- | ------------- |
| Pick a value  | `<fieldset>` of radios | `:checked`             | Native arrows |
| Switch panels | `role="tablist"`       | `aria-selected="true"` | Tabs runtime  |
| Navigate      | `<nav>` of links       | `aria-current="page"`  | Tab, Enter    |

Segments share the width equally and the track is at least `--control-size`
tall, so it lines up with `.btn` and `.input`; `.sm` and `.lg` size it like
any control. A long label wraps instead of truncating, and the row grows with
it. A parent that stretches its children (`.stack`) makes it full width; add
`.align-self-start` to keep it at its content width.

## Pick a value

Wrap each radio in its label. The radio is visually hidden but stays focusable
and submitted; in a browser without `:has()` it stays visible beside the
label.

```html demo
<fieldset class="segmented">
  <legend class="sr-only">Range</legend>
  <label class="segment"><input type="radio" name="range" value="day">Day</label>
  <label class="segment"><input type="radio" name="range" value="week" checked>Week</label>
  <label class="segment"><input type="radio" name="range" value="month">Month</label>
</fieldset>
```

## Switch panels

A tablist with `data-enhance="tabs"` takes the [tabs](../enhancements/tabs.md)
runtime unchanged: it reads the roles, not the classes.

```html demo
<div class="segmented" role="tablist" aria-label="View" data-enhance="tabs">
  <button class="segment" type="button" role="tab" id="view-list-tab" aria-selected="true" aria-controls="view-list">List</button>
  <button class="segment" type="button" role="tab" id="view-grid-tab" aria-selected="false" aria-controls="view-grid" tabindex="-1">Grid</button>
</div>
<section role="tabpanel" id="view-list" aria-labelledby="view-list-tab">List view</section>
<section role="tabpanel" id="view-grid" aria-labelledby="view-grid-tab" hidden>Grid view</section>
```

## Navigate

```html demo
<nav class="segmented" aria-label="Period">
  <a class="segment" href="#day" aria-current="page">Day</a>
  <a class="segment" href="#week">Week</a>
  <a class="segment" href="#month">Month</a>
</nav>
```

## When to use something else

- Several options on at once (bold, italic): `.join` of `.btn` with
  `aria-pressed`, see [joined controls](../forms/joined-controls.md).
- More options than fit on one row: [tabs](../enhancements/tabs.md), whose
  strip scrolls.
- Long or descriptive options: [choice cards](../forms/choice-cards.md) or
  plain radios.

## Hooks

- `--segmented-bg` — track fill.
- `--segmented-pad` — inset between the track and its segments, also the gap
  between segments; the segment radius is the track radius minus it.
- `--segmented-radius` — track corner radius.
- `--segmented-fg` — label ink of the unselected segments; the selected one
  takes `--text`.
- `--segmented-selected-bg` — fill of the selected segment. Its shadow follows
  `--shadow`, so a flat theme removes it at the theme level.
- `--segmented-selected-border` — hairline around the selected segment. It is
  what sets the segment apart where its fill is darker than the track; a theme
  whose fill is lighter can fade it.
