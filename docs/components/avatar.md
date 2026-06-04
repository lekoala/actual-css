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

Default avatar with initials. The wrapper `.avatar` contains the visual element.

```html .inline
<div class="avatar"><abbr>JD</abbr></div>
<div class="avatar primary"><abbr>AB</abbr></div>
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
<div class="avatar primary"><abbr>JD</abbr></div>
<div class="avatar secondary"><abbr>AB</abbr></div>
<div class="avatar success"><abbr>MN</abbr></div>
<div class="avatar warning"><abbr>KL</abbr></div>
<div class="avatar danger"><abbr>XY</abbr></div>
<div class="avatar neutral"><abbr>OP</abbr></div>
```

## Sizes

Available sizes.

```html .inline
<div class="avatar sm"><abbr>JD</abbr></div>
<div class="avatar"><abbr>JD</abbr></div>
<div class="avatar lg"><abbr>JD</abbr></div>
```

## Group

Overlapping avatar group.

```html .inline
<div class="avatar-group">
  <div class="avatar primary"><abbr>JD</abbr></div>
  <div class="avatar secondary"><abbr>AB</abbr></div>
  <div class="avatar success"><abbr>MN</abbr></div>
</div>
```

## Badge

Notification badge with content.

```html .inline
<div class="avatar">
  <abbr class="circle">JD</abbr>
  <span class="indicator badge success">1</span>
</div>
<div class="avatar">
  <abbr class="circle">AB</abbr>
  <span class="indicator badge danger">99</span>
</div>
<div class="avatar lg">
  <abbr class="circle">MN</abbr>
  <span class="indicator badge warning">3</span>
</div>
```

## Status

Status dot at bottom-right.

```html .inline
<div class="avatar">
  <abbr class="circle">JD</abbr>
  <span class="indicator-bottom status success" aria-label="online"></span>
</div>
<div class="avatar">
  <abbr class="circle">AB</abbr>
  <span class="indicator-bottom status neutral"></span>
</div>
<div class="avatar lg">
  <abbr class="circle">MN</abbr>
  <span class="indicator-bottom status success"></span>
</div>
```

## Accessibility

- Use alongside text for context.
- Use `<figure>` with `<img>` for photos.
- Use `<abbr>` for initials.
