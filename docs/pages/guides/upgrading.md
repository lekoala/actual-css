# Upgrading

Each step below is a search for a removed class or hook and its replacement.
The [changelog](https://github.com/lekoala/actual-css/blob/master/CHANGELOG.md)
lists every change; this page keeps the ones that need an edit. Apply the
sections in order when skipping a release.

**Related terms:** migration, breaking changes, update, version.

## 0.12 to 0.13

### Layout hooks stop at each layout

`--cluster-justify`, `--cluster-align` and `--cluster-wrap` are reset on every
`.cluster`, and `--grid-columns` and `--grid-min` on every `.grid`. A value set
on an ancestor, including an outer cluster or grid, no longer reaches the
layout inside it. Search application CSS and inline styles for these hooks on
anything but the layout itself, then set them on the row or grid, or select it:

```css
.toolbar > .cluster {
  --cluster-justify: space-between;
}
```

`--gap` still inherits, so a density context keeps reaching every nested
layout.

### Avatar stacks

`.avatar-stack` no longer takes its size from a child `.avatar.sm` or
`.avatar.lg`. Move the size class to the stack and drop it from its avatars:

```html
<div class="avatar-stack sm" role="group" aria-label="Team members">
  <div class="avatar" role="img" aria-label="John Doe">…</div>
</div>
```

### Focus outline

`--focus-outline` has no default value any more. Search application CSS for
`var(--focus-outline)` and write the generic line instead:

```css
outline: var(--focus-ring-width) solid var(--focus-outline-color);
```

Setting `--focus-outline` still replaces the generic line.

### List rows

`.list-item` regions center on the row. For rows with long supporting text,
add `.items-start` to the row or to the `.list` to keep them top-aligned.

### Rendering changes without an edit

- `.breadcrumb`, `.pagination` and a horizontal `.tabs` strip never wrap: a
  strip that does not fit scrolls horizontally. Add `.scroller` for a thin
  scrollbar.
- The focus reserve of `.pagination` and of a scrolling dialog or drawer body
  no longer grows with `--border-width`: 1px narrower under
  `prefers-contrast: more`.

## 0.11 to 0.12

### Action rows

`.actions`, `.navbar-nav` and the layout of `.form-actions` are gone. A row of
actions is a `.cluster`; a vertical list is `stack list-reset`. Replace
`class="actions"` and `class="navbar-nav"` with `class="cluster"`, and
`class="form-actions"` with `class="cluster form-actions"`:

```html
<menu class="cluster">…</menu>
<ul class="cluster">…</ul>
<div class="cluster form-actions">…</div>
<ul class="stack list-reset">…</ul>
```

- The row takes the framework `--gap` (0.75rem). The former `.actions` used
  0.5rem: add `.tight` to keep it.
- The former `.navbar-nav` used `--space-10` (0.25rem), which no utility
  reproduces. If the tighter navbar rhythm matters, set
  `gap: var(--space-10)` on that row in application CSS.
- `.form-actions` has no top margin and no `--form-actions-margin-block-start`:
  put `.stack` on the form. `--form-actions-justify` and `--form-actions-align`
  still apply. In a modular build, also import `layout/cluster`.
- `.justify-content-*` aligns only its own element and no longer reaches a
  nested `.cluster`. Put the utility on the row it should align.

### Dialogs

- `.dialog-confirmation` is removed. Compose `.media` with `.dialog-icon`, then
  a `<footer class="bleed background-subtle cluster justify-content-space-between">`;
  the recipe is in [Dialog](../components/dialog.md).
- A `dialog.modal` body `<footer>` has no layout of its own: write
  `<footer class="cluster justify-content-end">`.
- `--modal-header-bg` is removed: put a `.background-*` utility on the
  `dialog.modal > header` band. Only that default fill has zero specificity;
  the header's layout keeps its structural rule.
- The confirmation recipe uses the regular 1rem modal inset where the former
  `.dialog-confirmation` used 1.5rem. Set `--modal-pad: var(--space-50)` on
  the dialog to keep the roomier treatment.

### Cards

The layout of a `.card` header or footer row is a zero-specificity default: any
author rule that targets the slot replaces it, not only a `.media`, `.cluster`,
`.form-actions` or `.justify-content-*` class. Check application CSS for bare
element rules such as `header { … }` or `footer { … }`, which now win over the
card's slot row.

### Themes and density

- A theme sets `--control-pad-x-sm`, `--control-pad-x-md` and
  `--control-pad-x-lg` instead of `--control-pad-x`. Used as a nested island,
  it re-selects them in its own block; see
  [Tokens](../foundations/tokens.md).
- `--font-width-dense` is removed, and `.compact` no longer condenses type: set
  `font-stretch` on the element that should render condensed.

### Rendering changes without an edit

These need no markup change; compare the affected screens.

- `.sm` controls have 13px of inline padding instead of 14px.
- `.compact` and `.spacious` controls get narrower or wider, not only shorter
  or taller.
- `.nav-list` rows sit `--space-10` apart instead of `--space-20`.
- `.card.compact` lowers the gap between its children to `--space-20`.
