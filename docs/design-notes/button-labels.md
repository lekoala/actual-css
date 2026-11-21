# Button labels

Why a button label sits one type step below the field text, in medium, and
which settings were tried before it. Recorded so a later "the buttons look
light / heavy" starts from these comparisons instead of a new round.

## Decision

| Size      | Label | Weight | Height |
| --------- | ----: | -----: | -----: |
| `.btn.sm` |  13px |    500 |   32px |
| `.btn`    |  14px |    500 |   38px |
| `.btn.lg` |  16px |    500 |   44px |

`--btn-font-size` is selected where `--control-font-size` is (`:root`, then
`.sm`/`.lg`), from the existing type steps (`--font-size-xs/-sm/-md`). Heights
and `--control-pad-x` do not move: the padding is a length, so a button's label
still starts on the text line of the field above it.

The control's geometry (height, padding, fill, intent) gives the button its
presence; the type gives it precision. Text size and control size do not have
to move together.

## What was compared

Same cards in the component bench (`scripts/playground/compare.html`), light
and dark, beside Carbon and the previous release.

- **16px / 500** (0.19): dense in Chromium on Windows. With
  `line-height: 1` a wrapped label's lines touched.
- **16px / 400**: elegant, but lighter than the 14px / 500 field labels, so
  the label of a field outweighed the action that submits it.
- **15px / 500**: the cleanest of the first round, but a 0.9375 ratio found
  nowhere else in the scale.
- **0.875 × control text, 500**: the field label's own ratio. Right at the
  default size, but `.sm` fell to 12.25px. Selecting the type steps instead
  gave 13/14/16.

In the Windows component bench at 14px, `system-ui` draws 500 like 600 in
Chromium and like 400 in Firefox. When 400 and 600 are the nearest
available weights, a request for 500 selects 400 under the CSS font matching
algorithm. Variable fonts such as Geist and Segoe UI Variable can render
500 through their weight axis.

Carbon sets its productive buttons at 14px / 400, with 12px field labels: what
reads right is the relation between the label of a field and the label of an
action, not either value alone.

## Beside a field

A field and a neutral outline button now differ on two cues: the field keeps
the 3:1 `--border-control` edge and a 16px regular value, the button a quiet
`--border` edge and a 14px medium label. The value leads, the action stays
readable. In the bench's edge card, Oat gives both the same pale edge and they
read alike; GOV.UK separates them at full weight (2px black field, filled
button).

Both cues are theme hooks: `--btn-font-size` (below), and
`.btn.outline { --ui-border: var(--intent, var(--border-control)); }` for a
3:1 button edge.

## Scope

- `.btn.link` takes the surrounding text size: it reads as text in a sentence.
- `.btn.icon-only` keeps its glyph at `--control-font-size`, so an icon font
  fills the square as before.
- `.pagination` sets its ellipsis at `--btn-font-size`, the page numbers' size.
- Segmented controls, tabs, menus and fields keep `--control-font-size`. They
  select or hold a value rather than act, and no shared "label size" token
  couples them to buttons.

## Keeping the other settings

Two demo themes keep the earlier settings, declared on the element so each
size class still resolves its own `--control-font-size`:

- `corporate`: 16px / 500, the field text size in medium.
- `minimal`: 16px / 400, beside its regular caption labels.

```css
[data-theme="brand"] :is(.btn, .pagination) {
  --btn-font-size: var(--control-font-size);
}
```

Set on a theme root instead, the value is replaced at every `.sm`/`.lg`
boundary.
