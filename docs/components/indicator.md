# Indicator

Position any element on the corner of another element.

## Placement

- `.indicator` — positioned at top-right
- `.indicator-bottom` — positioned at bottom-right
- `.circle` — when placed on an element immediately before `.indicator` or `.indicator-bottom`, the indicator is positioned on the circle edge

## Default

Default top-right placement.

```html .inline
<div class="card" style="padding:1.5rem; position:relative;">
  <span class="indicator badge">New</span>
  content
</div>
```

## Bottom

Bottom-right placement.

```html .inline
<button class="btn">
  <span class="indicator-bottom badge secondary">12</span>
  inbox
</button>
```

## With avatar

Badge on avatar.

```html .inline
<div class="avatar">
  <abbr class="circle">JD</abbr>
  <span class="indicator badge success">3</span>
</div>
<div class="avatar">
  <abbr class="circle">AB</abbr>
  <span class="indicator-bottom status success"></span>
</div>
```

## Accessibility

- Use `aria-label` on the indicator for screen readers.
- Keep indicator text concise.
