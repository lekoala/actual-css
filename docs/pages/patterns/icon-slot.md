# Icon slot

> Contained icon zones — a leading icon, an icon disc, a status marker — appear
> across product UI: notifications, activity feeds, list actions, cards. There
> is no dedicated primitive; the same small contract is composed from existing
> pieces.

A contained icon zone must be a **stable box** that never shrinks, always
centers its glyph, and clips overflow:

- fixed `inline-size` / `block-size` (or `aspect-ratio: 1` for a disc);
- `display: grid; place-items: center;` for reliable centering;
- `flex: 0 0 auto` so a flex row never compresses it;
- `overflow: hidden`;
- a child `svg` constrained to the box.

## The contract

```css
.product-icon {
  flex: 0 0 auto;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.product-icon svg {
  inline-size: 100%;
  block-size: 100%;
}
```

For a round disc, add the `.circle` utility — it supplies the `border-radius`:

```css
.product-icon.circle {
  background: var(--surface-subtle);
}
```

## Reuse the existing icon slots

Several components already embody this slot — reach for them before composing
your own:

- `.alert-icon` — the leading icon in an alert.
- `.avatar` — initials or image in a fixed circular box.
- `.btn.icon-only` — a square icon button sized to the control height.
- `.input-icon` — a leading icon in a search/filter input.

```html demo
<div class="media">
  <span class="avatar primary"><abbr>AM</abbr></span>
  <div class="stack">
    <strong>Ada Meridian</strong>
    <span class="muted">Senior designer.</span>
  </div>
</div>
```
