# Upgrading to 0.12

Each step below is a search for a removed class or hook and its replacement.
The [changelog](https://github.com/lekoala/actual-css/blob/master/CHANGELOG.md)
lists every change; this page keeps the ones that need an edit.

**Related terms:** migration, breaking changes, update, version.

## Action rows

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

- The row takes the framework `--gap` (0.75rem); `.actions` used 0.5rem. Add
  `.tight` to keep the tighter rhythm.
- `.form-actions` has no top margin and no `--form-actions-margin-block-start`:
  put `.stack` on the form. `--form-actions-justify` and `--form-actions-align`
  still apply.
- `.justify-content-*` aligns only its own element and no longer reaches a
  nested `.cluster`. Put the utility on the row it should align.

## Dialogs

- `.dialog-confirmation` is removed. Compose `.media` with `.dialog-icon`, then
  a `<footer class="bleed background-subtle cluster justify-content-space-between">`;
  the recipe is in [Dialog](../components/dialog.md).
- A `dialog.modal` body `<footer>` has no layout of its own: write
  `<footer class="cluster justify-content-end">`.
- `--modal-header-bg` is removed: put a `.background-*` utility on the
  `dialog.modal > header` band.

## Cards

A `.card` header or footer row has zero specificity. A `.media`, `.cluster`,
`.form-actions` or `.justify-content-*` on that slot now replaces the default
split row instead of losing to it; check slots that carried one of those
classes by accident.

## Themes and density

- A theme sets `--control-pad-x-sm`, `--control-pad-x-md` and
  `--control-pad-x-lg` instead of `--control-pad-x`.
- `--font-width-dense` is removed, and `.compact` no longer condenses type: set
  `font-stretch` on the element that should render condensed.

## Rendering changes without an edit

These need no markup change; compare the affected screens.

- `.sm` controls have 13px of inline padding instead of 14px.
- `.compact` and `.spacious` controls get narrower or wider, not only shorter
  or taller.
- `.nav-list` rows sit `--space-10` apart instead of `--space-20`.
- `.card.compact` lowers the gap between its children to `--space-20`.
