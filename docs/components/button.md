# Button

Buttons allow the user to take actions or make choices.

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

A button with default styling.

```html
<button class="btn primary">Save</button>
```

```html
<button class="btn neutral">Cancel</button>
```

## Colors

All intent colors with default solid styling.

```html
<button class="btn primary">Primary</button>
```

```html
<button class="btn secondary">Secondary</button>
```

```html
<button class="btn success">Success</button>
```

```html
<button class="btn warning">Warning</button>
```

```html
<button class="btn danger">Danger</button>
```

```html
<button class="btn neutral">Neutral</button>
```

## Variants

Primary intent across all variants.

```html
<button class="btn primary solid">Solid</button>
```

```html
<button class="btn primary soft">Soft</button>
```

```html
<button class="btn primary outline">Outline</button>
```

```html
<button class="btn primary ghost">Ghost</button>
```

```html
<button class="btn primary link">Link</button>
```

## Sizes

Available sizes.

```html
<button class="btn primary sm">Small</button>
```

```html
<button class="btn primary">Default</button>
```

```html
<button class="btn primary lg">Large</button>
```

## States

Disabled and loading states.

```html
<button class="btn primary" disabled>Disabled</button>
```

```html
<button class="btn primary" aria-disabled="true">ARIA Disabled</button>
```

```html
<button class="btn primary loading">Loading</button>
```

## With icon

Buttons with icon content.

```html
<button class="btn primary">★ Favorite</button>
```

```html
<button class="btn primary">Save →</button>
```

## Accessibility

- Use a real <button> element for actions.
- Use <a> for navigation links.
- Use disabled attribute or aria-disabled for inactive buttons.
