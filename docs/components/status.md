# Status

Small colored dot to show the current status of an element.

## Intents

- `.primary`
- `.secondary`
- `.success`
- `.warning`
- `.danger`
- `.neutral`

## Sizes

- `.sm`
- `.lg`

## Default

Default status dot.

```html .inline
<span class="status"></span>
<span class="status primary"></span>
<span class="status secondary"></span>
<span class="status success"></span>
<span class="status warning"></span>
<span class="status danger"></span>
<span class="status neutral"></span>
```

## Sizes

Available sizes.

```html .inline
<span class="status sm"></span>
<span class="status"></span>
<span class="status lg"></span>
```

## With indicator

Positioned on avatar or other elements.

```html .inline
<div class="avatar">
  <abbr class="circle">JD</abbr>
  <span class="indicator-bottom status success" aria-label="online"></span>
</div>
<div class="avatar">
  <abbr class="circle">AB</abbr>
  <span class="indicator-bottom status neutral"></span>
</div>
```

## Accessibility

- Use `aria-label` to describe the status for screen readers.
- Example: `<span class="status success" aria-label="Online"></span>`
