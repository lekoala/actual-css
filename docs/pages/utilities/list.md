# List Helpers

Utilities for list chrome reset, readable measure, and editorial kicker labels.

## Class reference

| Class | Kind | Description |
|---|---|---|
| `.list-reset` | Utility | Removes native list margin, padding, and markers. |
| `.measure` | Utility | Caps a block at a readable width via `--prose-measure`. |
| `.overline` | Component | Small editorial kicker label: muted, uppercase, letterspaced. |

## List reset

`.list-reset` removes the native list chrome (margin, padding, markers) from any list. It is the generic version of `.nav-list` — use `.nav-list` when the list is a navigation list for semantic intent, and `.list-reset` for everything else (tag clouds, footer columns, related items, comment threads, embedded controls).

## Measure

`.measure` caps a block at a readable width using `--prose-measure`. It does not center — combine with `.center` for the common centered reading column, or with `margin-inline: auto` for a one-off centered block.

Use it for any content that needs a comfortable measure: prose articles, TOC lists, form fields, callouts. Avoid using it for full-bleed surfaces.

## Editorial labels

`.overline` is a small editorial label: muted color, smaller size, uppercase, slight letter-spacing. It does not impose a shape by itself. Add `.pill` for a bordered rounded chip, and combine with an intent class (`.primary`, `.success`, etc.) to tint the chip's text, border, and background.

The overline exists because categories, kicker labels, and section markers recur across editorial surfaces, and `.badge` is the wrong shape for them. `.badge` is a status indicator; `.overline` is metadata.

## CSS hooks

- `--prose-measure` — the readable measure `.measure` caps at; defaults to `70ch`.
- `--overline-radius` — the pill chip's corner radius; defaults to `--radius-full`.