# Avatar

User avatar with initials, image, or icon.

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

Default avatar with initials.

```html .inline
<span class="avatar">A</span>
<span class="avatar primary">B</span>
```

## Image

Avatar with image.

```html .inline
<figure class="avatar">
  <img src="https://ui-avatars.com/api/?name=JD&background=random" alt="JD">
</figure>
```

## Colors

Intent colors.

```html .inline
<span class="avatar primary">P</span>
<span class="avatar secondary">S</span>
<span class="avatar success">S</span>
<span class="avatar warning">W</span>
<span class="avatar danger">D</span>
<span class="avatar neutral">N</span>
```

## Sizes

Available sizes.

```html .inline
<span class="avatar sm">S</span>
<span class="avatar">M</span>
<span class="avatar lg">L</span>
```

## Group

Overlapping avatar group.

```html .inline
<div class="avatar-group">
  <span class="avatar primary">A</span>
  <span class="avatar secondary">B</span>
  <span class="avatar success">C</span>
</div>
```

## Badge

Status indicator dot. Wrap the avatar and badge in `.avatar-badge-container`.

```html .inline
<div class="avatar-badge-container">
  <span class="avatar">A</span>
  <span class="avatar-badge success bottom-right"></span>
</div>
<div class="avatar-badge-container">
  <span class="avatar">A</span>
  <span class="avatar-badge danger top-right">1</span>
</div>
```

## Accessibility

- Use alongside text for context.
- Use `<figure>` with `<img>` for photos.
- Use `<abbr>` for initials.
