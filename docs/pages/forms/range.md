# Range

> Native range input with a lightweight theme-aware custom skin.

`.range` keeps the native range control and its interaction semantics, while
customizing the track, thumb, focus state, intents, and disabled state. The
focus ring targets the thumb — the surface the user actually manipulates —
rather than the CSS box.

**Related terms:** slider, range input, scrubber.

```html demo
<label class="field">
  <span class="field-label">Volume</span>
  <input class="range" type="range" min="0" max="100" value="50" />
</label>
```

Actual deliberately does not emulate filled tracks, tick marks, value labels,
or multi-thumb ranges. Those still require engine-specific pseudo-elements or a
value duplicated out of the HTML into CSS. Prefer the platform as richer range
styling becomes interoperable — see
[Enhanced range controls](https://github.com/lekoala/actual-css/blob/master/docs/design-notes/platform-alignment.md).

## CSS hooks

- `--range-thumb-size` — thumb diameter.
- `--range-track-height` — track thickness.
- `--range-thumb-bg` — thumb color. Defaults to the local intent, then `--primary`.
- `--range-track-bg` — track color.
