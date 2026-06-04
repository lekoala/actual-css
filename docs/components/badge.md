# Badge

Badges are used to inform the user of the status of specific data.

## Intents

- `.primary`
- `.secondary`
- `.success`
- `.warning`
- `.danger`
- `.neutral`

## Variants

- `.solid`
- `.soft`
- `.outline`
- `.ghost`
- `.link`

## Sizes

- `.sm`
- `.lg`

## Default

A badge with default solid styling.

```html .inline
<span class="badge success">Published</span>
<span class="badge warning">Pending</span>
```

## Colors

All intent colors with default solid styling.

```html .inline
<span class="badge primary">Primary</span>
<span class="badge secondary">Secondary</span>
<span class="badge success">Success</span>
<span class="badge warning">Warning</span>
<span class="badge danger">Danger</span>
<span class="badge neutral">Neutral</span>
```

## Variants

Primary intent across all variants.

```html .inline
<span class="badge primary solid">Solid</span>
<span class="badge primary soft">Soft</span>
<span class="badge primary outline">Outline</span>
<span class="badge primary ghost">Ghost</span>
<span class="badge primary link">Link</span>
```

## Sizes

Available sizes.

```html .inline
<span class="badge primary sm">Small</span>
<span class="badge primary">Default</span>
<span class="badge primary lg">Large</span>
```

## Accessibility

- Badges are non-interactive by default.
- Use alongside text for context, not as the only indicator.
